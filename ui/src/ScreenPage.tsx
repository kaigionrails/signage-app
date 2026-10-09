import React, { ReactNode } from "react";

import { Flex, Box, HStack, Image } from "@chakra-ui/react";
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
        {/* Bottom-left (kor26)。下の帯 (51.125vw〜56.25vw) に、hachiko とその右のカタカナのロゴを上下中央で並べる。
            大きいハチ公が出ているあいだ (セッション一覧の吹き出し、hero filler) は hachiko を隠す。
            visibility で隠すので、カタカナのロゴの位置は変わらない */}
        <HStack
          display={screen.mode === "filler" ? "none" : "flex"}
          position="absolute"
          top="51.125vw"
          left="2vw"
          h="5.125vw"
          spacing="1vw"
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
          <Image
            src="/kaigionrails-katakana-lime.svg?p=kor26"
            alt="カイギ・オン・レイルズ"
            h="1.8vw"
            w="auto"
          />
        </HStack>
      </>
    </>
  );
};
