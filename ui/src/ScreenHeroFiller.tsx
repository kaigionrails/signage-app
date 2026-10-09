import React from "react";

import { Center, Box } from "@chakra-ui/react";
import { LogoIcon } from "./LogoIcon";
import { useHideBottomHachiko } from "./BottomHachikoProvider";

// キービジュアルにロゴが入っているので、上にロゴは重ねない
export const ScreenHeroFiller: React.FC = () => {
  return (
    <Box
      w="100%"
      h="100%"
      css={{
        "&": {
          backgroundImage: `url(/kv.webp?p=kor26)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        },
      }}
    />
  );
};

// kor26: 中央に大きいハチ公を出すので、そのあいだ下帯の左下のハチ公は隠す
export const ScreenHeroIconFiller: React.FC = () => {
  useHideBottomHachiko();
  return (
    <Center
      w="100%"
      h="100%"
      css={{
        "& svg": { height: "70%", width: "auto" },
        "& img": { height: "70%", width: "auto" },
      }}
    >
      <LogoIcon />
    </Center>
  );
};
