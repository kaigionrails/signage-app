require 'yaml'
require 'aws-sdk-dynamodb'

# Kaigi on Rails 2026 のサイトの src/_data/sponsors.yml から、スポンサーを DynamoDB に同期する。
# サイネージに出すのは ruby と gold だけ (silver は出さない)。
#
#   DRY_RUN=1 にすると AWS に触れず、作るアイテムを表示するだけにする。

PLANS = %w(ruby gold)

LOGO_BASE_URL = 'https://kaigionrails.org/2026/images/sponsors'

yml_path, table_name, tenant = ARGV[0,3]
abort "Usage: #$0 sponsors_yml table_name tenant" unless yml_path && table_name && tenant
dry_run = !ENV['DRY_RUN'].to_s.empty?

updated_at = Time.now.to_i
touched_items = {}

tiers = YAML.safe_load_file(yml_path).fetch('tiers')
# ruby → gold の順に、sponsors.yml での並び順のまま [sponsor, plan] の組にする
eligible_sponsors = PLANS.flat_map do |plan|
  tier = tiers.find { _1.fetch('slug') == plan }
  (tier ? tier.fetch('sponsors') : []).map { [_1, plan] }
end

@dynamodb = Aws::DynamoDB::Client.new unless dry_run

pk = "#{tenant}::sponsors"

eligible_sponsors.each_with_index do |(sponsor, plan), order_index|
  logo = sponsor.fetch('logo') # 例: S309_mov.am_ruby
  # プランが変わると logo の末尾 (_ruby など) が変わるので、id には先頭の番号 (S309) だけを使う
  id = logo.split('_').first
  sk = "#{tenant}::sponsors:#{id}"
  data = {
    tenant:,
    id:,
    plan:,
    name: sponsor.fetch('name'),
    avatar_url: "#{LOGO_BASE_URL}/#{logo}@2x.png",
    order_index:,
    updated_at:,
  }
  p(pk:, sk:, data:)
  touched_items[sk] = true
  next if dry_run
  @dynamodb.update_item(
    table_name:,
    key: { pk:, sk: },
    update_expression: "set #{data.keys.map { "##{_1} = :#{_1}" }.join(', ')}",
    expression_attribute_names: data.keys.map { ["##{_1}", _1.to_s] }.to_h,
    expression_attribute_values: data.transform_keys { ":#{_1}" },
  )
end

abort "id collision: #{eligible_sponsors.size} sponsors but #{touched_items.size} keys" if touched_items.size != eligible_sponsors.size

if dry_run
  puts "DRY_RUN: #{eligible_sponsors.size} sponsors (#{eligible_sponsors.map(&:last).tally}); nothing was written"
  exit
end

@dynamodb.query(table_name:, expression_attribute_values: {":pk" => pk}, key_condition_expression: 'pk = :pk').flat_map(&:items).each do |item|
  sk = item.fetch('sk')
  unless touched_items[sk]
    p [:delete, pk, sk]
    @dynamodb.delete_item(
      table_name:,
      key: { pk:, sk: },
    )
  end
end
