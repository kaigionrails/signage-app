import React, { ReactNode } from "react";

import { Flex, Box, Image } from "@chakra-ui/react";
import { AspectRatio } from "@chakra-ui/react";

import Api, { ScreenMode } from "./Api";
import { useKioskContext } from "./KioskProvider";
import { useApiContext } from "./ApiContext";
import { TickProvider } from "./TickProvider";
import {
  BottomHachikoProvider,
  useBottomHachikoHidden,
} from "./BottomHachikoProvider";

import { Colors, ScreenColors } from "./theme";

import { ScreenSponsorRotation } from "./ScreenSponsorRotation";
import { ScreenHeroFiller } from "./ScreenHeroFiller";
import { ScreenRotationView } from "./ScreenRotationView";
import ScreenMessageView from "./ScreenMessageView";
import { Logo } from "./Logo";

export const ScreenPage: React.FC = () => {
  return (
    <TickProvider>
      <Box w="100vw" h="auto">
        <AspectRatio ratio={16 / 9}>
          <Box bgColor={ScreenColors.bg} bgSize="contain" w="100%" h="100%">
            <BottomHachikoProvider>
              <IntermissionScreenInner />
            </BottomHachikoProvider>
          </Box>
        </AspectRatio>
      </Box>
    </TickProvider>
  );
};

const NahaThemedLetterBox: React.FC<{
  children?: ReactNode;
  letterBoxBgColor?: string;
}> = ({ children, letterBoxBgColor }) => {
  return (
    <Flex
      h="100%"
      w="100%"
      justify="space-around"
      direction="column"
      bgColor={letterBoxBgColor ?? ScreenColors.accent}
    >
      <Flex
        h="46vw"
        w="100%"
        justify="space-between"
        direction="row"
        bgColor={ScreenColors.bg}
      >
        {children}
      </Flex>
    </Flex>
  );
};

// kor26: 画面の下端の斜線。公式サイトの diagonal stripe と同じ書き方 (高さ 1.23vw、全幅)
const KorStripe: React.FC<{ hidden: boolean; top: string }> = ({
  hidden,
  top,
}) => {
  return (
    <Box
      display={hidden ? "none" : "block"}
      position="absolute"
      top={top}
      left={0}
      w="100%"
      h="1.23vw"
      bg={`repeating-linear-gradient(-45deg, ${ScreenColors.stripe} 0, ${ScreenColors.stripe} 0.833vw, transparent 0.833vw, transparent 1.667vw)`}
    />
  );
};

export const NahaThemedFillerPaddingX: React.FC<{ mode: ScreenMode }> = ({
  mode,
}) => {
  return (
    <Box minW="5.7vw" flexGrow={2}>
      {mode === "filler" ? (
        // fixme: unused code
        <Box w="100%" h="100%" bgColor={ScreenColors.accent}></Box>
      ) : (
        <NahaThemedLetterBox>{/* padding X */}</NahaThemedLetterBox>
      )}
    </Box>
  );
};

export const IntermissionScreenInner: React.FC = () => {
  const apictx = useApiContext(false);
  const kioskParams = useKioskContext();
  const { data: screen } = Api.useScreenControl(apictx, kioskParams.track);
  const bottomHachikoHidden = useBottomHachikoHidden();

  if (!screen) return <p>Loading screen control</p>;

  console.log("IntermissionScreenInner/screen", screen);
  return (
    <>
      {/* kor26: 下帯 (51.125vw〜56.25vw) に、公式サイトの背景の交差点の模様を敷く。
          画面全体に cover で敷いたときの下端が見えるようにする (画像は 16:9 より少し横長なので高さで合わせる)。
          絶対配置の要素は DOM の順に重なるので、最初に置いて、大きいハチ公や左下のハチ公より下にする。
          filler ではキービジュアルに重なるので出さない */}
      <Box
        display={screen.mode === "filler" ? "none" : "block"}
        position="absolute"
        top="51.125vw"
        left={0}
        w="100%"
        h="5.125vw"
        css={{
          "&": {
            backgroundImage: `url(/bg-crossing.webp?p=kor26)`,
            backgroundSize: "auto 56.25vw",
            backgroundPosition: "center bottom",
            backgroundRepeat: "no-repeat",
          },
        }}
      />
      {/* kor26: 画面の下端の斜線。交差点の模様の上、大きいハチ公と左下の hachiko の下に重なるよう、ここに置く。
          filler ではキービジュアルに同じ斜線が入っているので出さない */}
      <KorStripe hidden={screen.mode === "filler"} top="55.02vw" />
      <Flex h="100%" w="100%" direction="row" bgColor={ScreenColors.bg}>
        {screen.mode !== "filler" ? (
          <NahaThemedFillerPaddingX mode={screen.mode} />
        ) : null}
        {screen.mode === "filler" ? (
          <Box w="100%" h="100%">
            <ScreenHeroFiller />
          </Box>
        ) : (
          <Box h="100%" w="100%" flexGrow={3}>
            <NahaThemedLetterBox>
              {screen.mode === "message" && screen.message ? (
                <ScreenMessageView screen={screen} />
              ) : null}
              {screen.mode === "rotation" ? <ScreenRotationView /> : null}
            </NahaThemedLetterBox>
          </Box>
        )}

        {screen.show_sponsors ? (
          <Box h="100%">
            <NahaThemedLetterBox
              letterBoxBgColor={
                screen.mode === "filler" ? ScreenColors.bg : undefined
              }
            >
              <ScreenSponsorRotation />
            </NahaThemedLetterBox>
          </Box>
        ) : null}
      </Flex>
      <>
        {/* Bottom-left (kor26)。下の帯 (51.125vw〜56.25vw) の上下中央に hachiko を置く。
            吹き出しの下に大きいハチ公が立っているあいだは隠す。filler ではキービジュアルの上に出す */}
        <Flex
          position="absolute"
          top="51.125vw"
          left="2vw"
          h="5.125vw"
          alignItems="center"
        >
          <Box
            visibility={bottomHachikoHidden ? "hidden" : "visible"}
            w="auto"
            h="4.3vw"
            css={{
              "& svg": { height: "100%", width: "auto" },
              "& img": { height: "100%", width: "auto" },
            }}
          >
            <Logo />
          </Box>
        </Flex>
        {/* Top-left (kor26)。上の帯 (0〜5.125vw) に、Kaigi on Rails 2026 の横ロゴを上下中央で置く。
            ロゴ (viewBox 730×100) は大文字が高さの 21〜77% にあるので、箱を上下中央に置けば大文字も帯の中央に来る。
            高さ 4.5vw で大文字は約 2.5vw。K の左端 (x = 17.15) が画面の 2.5vw に来るよう、左の余白のぶんずらす。
            filler ではキービジュアルにロゴが入っているので出さない */}
        <Flex
          display={screen.mode === "filler" ? "none" : "flex"}
          position="absolute"
          top={0}
          left="calc(2.5vw - 4.5vw * 17.15 / 100)"
          h="5.125vw"
          alignItems="center"
        >
          <Image
            src="/kaigionrails-logo-horizontal.svg?p=kor26"
            alt="Kaigi on Rails 2026"
            h="4.5vw"
            w="auto"
          />
        </Flex>
      </>
    </>
  );
};
