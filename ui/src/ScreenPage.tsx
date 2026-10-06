import React, { ReactNode } from "react";

import { Flex, Box, HStack } from "@chakra-ui/react";
import { AspectRatio } from "@chakra-ui/react";

import Api, { ScreenMode } from "./Api";
import { useKioskContext } from "./KioskProvider";
import { useApiContext } from "./ApiContext";
import { TickProvider } from "./TickProvider";

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
            <IntermissionScreenInner />
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
      {/* kor26: キービジュアルのピンク / ライムの横線を、帯と本文の境目に引く */}
      <Flex
        h="46vw"
        w="100%"
        justify="space-between"
        direction="row"
        bgColor={ScreenColors.bg}
        borderTop={letterBoxBgColor ? undefined : "0.2vw solid"}
        borderBottom={letterBoxBgColor ? undefined : "0.2vw solid"}
        borderTopColor={ScreenColors.keyPink}
        borderBottomColor={ScreenColors.keyGreen}
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
        {/* Bottom-left hachiko (kor26)。下の帯 (51.125vw〜56.25vw) の縦中央に、上下約 0.8vw の隙間を空けて置く */}
        <Box
          display={screen.mode === "filler" ? "none" : "block"}
          position="absolute"
          top="51.94vw"
          left="2vw"
          w="auto"
          h="3.5vw"
          css={{
            "& svg": { height: "100%", width: "auto" },
            "& img": { height: "100%", width: "auto" },
          }}
        >
          <Logo />
        </Box>
      </>
    </>
  );
};
