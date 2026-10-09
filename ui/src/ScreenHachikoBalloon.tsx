import React from "react";

import { Flex, Box } from "@chakra-ui/react";

import { ScreenColors, ScreenFonts } from "./theme";
import { Logo } from "./Logo";
import { useHideBottomHachiko } from "./BottomHachikoProvider";

// kor26: 下のハチ公がアナウンスしている黒い吹き出し。セッション一覧と message で使う。
// 高さは中身によらず 37.6vw (本文エリアの上下を 4.2vw ずつ空ける)。
// 左は左の余白に 2.7vw はみ出させて画面の 3vw から始め、右はスポンサー欄から 1.5vw 離す。
// status を渡すと、下の段に置く
export const ScreenHachikoBalloon: React.FC<{
  status?: React.ReactNode;
  children: React.ReactNode;
}> = ({ status, children }) => {
  // しっぽの下に大きいハチ公を立たせるので、そのあいだ下帯の左下のハチ公は隠す
  useHideBottomHachiko();
  return (
    <Flex w="100%" h="100%" direction="column" justify="center">
      <Flex
        position="relative"
        direction="column"
        h="37.6vw"
        ml="-2.7vw"
        mr="1.5vw"
        px="2.5vw"
        pt="2.5vw"
        pb="2vw"
        borderRadius="0.9vw"
        bgColor={ScreenColors.balloonBg}
        color={ScreenColors.balloonText}
        fontFamily={ScreenFonts.body}
      >
        {/* セッション一覧では、セッションの間に区切り線を挟む。space-evenly にして、線がないときの space-around と同じ位置にセッションを置く */}
        <Flex flex="1" minH={0} direction="column" justify="space-evenly">
          {children}
        </Flex>
        {status ? <Box textAlign="right">{status}</Box> : null}
        {/* しっぽ。縦の辺が右で、先が右下を向く直角三角形。境目に隙間が出ないよう、上端を 0.05vw 吹き出しに重ねる */}
        <Box
          position="absolute"
          top="calc(100% - 0.05vw)"
          right="12.3vw"
          w="3.3vw"
          h="2.65vw"
          bgColor={ScreenColors.balloonBg}
          clipPath="polygon(0 0, 100% 0, 100% 100%)"
        />
        {/* しっぽの右 1.3vw に立つ大きいハチ公 (12.3vw - 1.3vw = 11vw)。吹き出しの下辺 (画面の 46.925vw) から
            高さ 8.8vw なので、足は下帯の中、画面の下端から約 0.5vw 上に来る */}
        <Box
          position="absolute"
          top="100%"
          left="calc(100% - 11vw)"
          h="8.8vw"
          css={{ "& img": { height: "100%", width: "auto" } }}
        >
          <Logo />
        </Box>
      </Flex>
    </Flex>
  );
};
