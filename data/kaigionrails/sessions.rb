require 'yaml'
require 'time'
require 'aws-sdk-dynamodb'

# Kaigi on Rails 2026 のサイトの src/_data/schedule.yml と speakers.yml から、
# セッションを DynamoDB に同期する。keynote と talk だけを入れ、休憩や Sponsor LT などは入れない。
#
#   DRY_RUN=1 にすると AWS に触れず、作るアイテムを表示するだけにする。
#   CANCELED=slug1,slug2 で、キャンセルになったトークに canceled: true を付ける。枠は空けたまま残し、サイネージに Canceled と出す。
#   サイトのデータにはトークのキャンセルの印が無いので、同期し直すたびに毎回渡す (渡し忘れると普通のトークに戻る)

# schedule.yml の track (1 / 2) と、UI の track slug / hall 名の対応。-1 (全幅) の枠は入れない
TRACKS = {
  1 => { track: 'magenta', hall: 'Magenta Hall' },
  2 => { track: 'lime', hall: 'Lime Hall' },
}

# schedule.yml の day と開催日
DAYS = {
  1 => '2026-10-16',
  2 => '2026-10-17',
}

SESSION_TYPES = %w(keynote talk)

SPEAKER_IMAGE_BASE_URL = 'https://kaigionrails.org/2026/images/speakers'

schedule_yml, speakers_yml, table_name, tenant = ARGV[0,4]
abort "Usage: #$0 schedule_yml speakers_yml table_name tenant" unless schedule_yml && speakers_yml && table_name && tenant
dry_run = !ENV['DRY_RUN'].to_s.empty?
canceled_slugs = ENV['CANCELED'].to_s.split(',').map(&:strip).reject(&:empty?)

updated_at = Time.now.to_i
touched_items = {}

speakers_data = YAML.safe_load_file(speakers_yml)
speakers = speakers_data.fetch('keynote', []).chain(speakers_data.fetch('talk', [])).to_h { [_1.fetch('id'), _1] }

# 個別画像 (avatar_path) があればそれを、無ければ gravatar を使う。どちらも無ければ空にして、UI の代替アバターに任せる
def avatar_url(speaker)
  if speaker['avatar_path']
    "#{SPEAKER_IMAGE_BASE_URL}/#{speaker.fetch('avatar_path')}"
  elsif speaker['gravatar_hash']
    "https://gravatar.com/avatar/#{speaker.fetch('gravatar_hash')}?s=512"
  else
    ''
  end
end

schedule = YAML.safe_load_file(schedule_yml)

sessions = %w(day_one day_two).flat_map { schedule.fetch(_1, []) }.filter_map do |event|
  next unless SESSION_TYPES.include?(event.fetch('type'))
  track = TRACKS.fetch(event.fetch('track'))
  date = DAYS.fetch(event.fetch('day'))

  {
    slug: event.fetch('id'),
    starts_at: Time.parse("#{date} #{event.fetch('starts_at')}:00 +09:00").to_i,
    ends_at: Time.parse("#{date} #{event.fetch('ends_at')}:00 +09:00").to_i,
    track: track.fetch(:track),
    hall: track.fetch(:hall),
    title: event.fetch('title'),
    canceled: canceled_slugs.include?(event.fetch('id')),
    speakers: event.fetch('speakers', []).map do |id|
      speaker = speakers.fetch(id)
      {
        slug: id,
        name: speaker.fetch('name'),
        github_id: speaker.fetch('github_id', nil),
        twitter_id: nil,
        avatar_url: avatar_url(speaker),
      }
    end,
    updated_at:,
  }
end

unknown_canceled_slugs = canceled_slugs - sessions.map { _1.fetch(:slug) }
abort "CANCELED has unknown slugs: #{unknown_canceled_slugs.join(', ')}" unless unknown_canceled_slugs.empty?

@dynamodb = Aws::DynamoDB::Client.new unless dry_run

pk = "#{tenant}::sessions"

sessions.each do |session|
  sk = "#{tenant}::sessions:#{session.fetch(:ends_at)}:#{session.fetch(:track)}"
  data = session
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

abort "sk collision: #{sessions.size} sessions but #{touched_items.size} keys" if touched_items.size != sessions.size

if dry_run
  puts "DRY_RUN: #{sessions.size} sessions (#{sessions.map { _1.fetch(:track) }.tally}), canceled: #{canceled_slugs.inspect}; nothing was written"
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
