import React from "react";
import dayjs from "./dayjs";

import {
  HStack,
  VStack,
  Heading,
  Flex,
  Box,
  Image,
  Text,
} from "@chakra-ui/react";

import { Center } from "@chakra-ui/react";

import { Api, ConferenceSession, Speaker } from "./Api";
import { Colors, Fonts, ScreenColors, ScreenFonts, TrackColors } from "./theme";
import { Logo } from "./Logo";

import { ScreenHeroFiller, ScreenHeroIconFiller } from "./ScreenHeroFiller";

import { useRelativeTime } from "./ScreenAnnounceTime";
import { useApiContext } from "./ApiContext";
import { useTick } from "./TickProvider";

import { SpeakerAvatar } from "./SpeakerAvatar";
import { GitHubIcon } from "./GitHubIcon";
import { TwitterIcon } from "./TwitterIcon";

type ConferenceStateAssumption =
  | "break"
  | "in_session"
  | "mixed"
  | "end_of_day";

export const ScreenSessionsView: React.FC<{ keynoteOnly?: boolean }> = ({
  keynoteOnly = false,
}) => {
  const tick = useTick();
  const recentSessions = useRecentSessions(keynoteOnly);

  let earliestStartUnix = undefined;
  if (recentSessions) {
    for (const [, s] of recentSessions.entries())
      if (
        s &&
        (earliestStartUnix === undefined || s.starts_at < earliestStartUnix)
      )
        earliestStartUnix = s.starts_at;
  }
  const relativeTime = useRelativeTime(earliestStartUnix);

  if (!recentSessions) return <ScreenHeroIconFiller />; // FIXME:

  const state: ConferenceStateAssumption | undefined = (() => {
    if (!recentSessions) return undefined;
    let allTomorrow = true;
    let allUndefined = true;
    for (const [, s] of recentSessions.entries()) {
      if (s) allTomorrow &&= tick.date() !== dayjs.unix(s.starts_at).date();
      allUndefined &&= s === undefined;
    }
    if (allTomorrow || allUndefined) return "end_of_day";

    let allStartedAndNotFinished = true;
    for (const [, s] of recentSessions.entries()) {
      if (s)
        allStartedAndNotFinished &&=
          dayjs.unix(s.starts_at).isBefore(tick) &&
          tick.isBefore(dayjs.unix(s.ends_at));
    }
    if (allStartedAndNotFinished) return "in_session";

    let allNotStarted = true;
    for (const [, s] of recentSessions.entries()) {
      if (s) allNotStarted &&= tick.isBefore(dayjs.unix(s.starts_at));
    }
    if (allNotStarted) return "break";

    return "mixed";
  })();

  //console.log("ScreenSessionsView/state", state);

  if (state === "end_of_day") return <ScreenHeroIconFiller />; // FIXME:

  return (
    // kor26: セッションの間に区切り線を挟む。space-evenly にして、線がないときの space-around と同じ位置にセッションを置く
    <Flex
      w="100%"
      h="100%"
      direction="column"
      justify="space-evenly"
      textAlign="center"
      fontFamily={ScreenFonts.body}
    >
      {/*<VStack w="100%" spacing="1vw">*/}
      <Text
        fontWeight={600}
        fontSize="2.3vw"
        lineHeight="3vw"
        position="absolute"
        textAlign="right"
        right="3vw"
        top="52.35vw"
        color={Colors.navText}
      >
        {/* ^ kor26: 大文字の高さの中央を、下の帯 (51.125vw〜56.25vw) の中央にそろえる。
            IBM Plex Sans JP は ascent 1.06em / descent 0.44em と下に余白が多く、行の中で文字が上に寄るので、そのぶん下げてある */}
        {state === "in_session" ? <>Ongoing Sessions</> : null}
        {state === "break" ? <>Next sessions {relativeTime}</> : null}
        {state === "mixed" ? <>Current and Upcoming Sessions</> : null}
      </Text>

      {Array.from(recentSessions.entries())
        .filter((e): e is [string, ConferenceSession] => e[1] !== undefined)
        .map(([track, s], i) => (
          <React.Fragment key={track}>
            {i > 0 ? (
              <Box h="0.1vw" mx="2vw" bgColor={ScreenColors.line} />
            ) : null}
            <AnnounceUpcomingTopic session={s} />
          </React.Fragment>
        ))}
    </Flex>
  );
};

function useRecentSessions(keynoteOnly: boolean = false) {
  const apictx = useApiContext(false);
  const tick = useTick();
  const { data: conferenceSessions } = Api.useConferenceSessions(apictx);

  if (!conferenceSessions) return undefined;
  if (!apictx) return undefined;

  const tracks = keynoteOnly
    ? apictx.config.tracks.filter((t) => t === "magenta")
    : apictx.config.tracks;

  const retval = new Map(
    tracks.map((track) => {
      const trackSessions = conferenceSessions.tracks.get(track) ?? [];
      const firstUnfinishedSession = trackSessions.find(
        (s) => tick.unix() <= s.ends_at
      );
      return [track, firstUnfinishedSession];
    })
  );
  //console.log("useRecentSessions", retval);
  return retval;
}

const AnnounceUpcomingTopic: React.FC<{ session: ConferenceSession }> = ({
  session,
}) => {
  return (
    // kor26: 右端をスポンサー欄の区切り線から 2vw 離す (セッションの間の横線の右端と同じ)
    <Box textAlign="left" fontFamily={ScreenFonts.body} pr="2vw">
      {/* TODO: missing room name */}

      {/* kor26: avatar とタイトルは上端でそろえる。hall 名とハッシュタグは、これまでどおり avatar (7vw) の縦中央に置く */}
      <HStack alignItems="flex-start" spacing="0.7vw" textAlign="left">
        <Flex
          minW="14.5vw"
          minH="7vw"
          direction="column"
          justify="center"
          align="flex-end"
          textAlign="right"
        >
          <Text
            display="inline-block"
            px="0.6vw"
            py="0.3vw"
            bgColor={TrackColors[session.track]?.bg}
            color={TrackColors[session.track]?.fg}
            fontWeight="700"
            fontSize="1.8vw"
            lineHeight="2.3vw"
          >
            {session.hall}
          </Text>
          <Text fontWeight="500" fontSize="1.2vw" lineHeight="1.8vw">
            #kaigionrails
          </Text>
          <Text fontWeight="500" fontSize="1.2vw" lineHeight="1.8vw">
            #kaigionrails_{session.track}
          </Text>
        </Flex>
        <Box minW="7vw" w="7vw" mx="1vw">
          {session.speakers && session.speakers.length > 0 ? (
            <SpeakerAvatar speakers={session.speakers} />
          ) : null}
        </Box>
        <Box as="div" flex="1" minW={0}>
          {/* kor26: 公式サイトのトークのタイトルと同じ 110% の平体。伸びるぶん、折り返し幅を先に 1.1 で割っておく。
              行の上端から字面の上端まで、和文で約 0.08vw、英字の ascender で約 0.22vw 空くので、
              その間をとって 0.15vw 持ち上げ、字面の上端を avatar の上端にそろえる */}
          <Heading
            as="h2"
            mt="-0.15vw"
            minW="calc(26vw / 1.1)"
            maxW="calc(100% / 1.1)"
            flexGrow={2}
            fontSize="2.1vw"
            lineHeight="2.5vw"
            fontWeight="700"
            fontFamily={ScreenFonts.body}
            transform="scaleX(1.1)"
            transformOrigin="left center"
          >
            {session.title}
          </Heading>
          {session.speakers && session.speakers.length > 0 ? (
            <Box>
              {session.speakers.map((s) => (
                <ScreenTopicSpeaker key={s.avatar_url} speaker={s} />
              ))}
            </Box>
          ) : null}
        </Box>
      </HStack>
    </Box>
  );
};

const ScreenTopicSpeaker: React.FC<{ speaker: Speaker }> = ({ speaker }) => {
  const primaryAlias = speaker.github_id || speaker.twitter_id;
  const primaryIcon =
    (speaker.github_id && <GitHubIcon boxSize="1.55vw" m={0} />) ||
    (speaker.twitter_id && <TwitterIcon boxSize="1.55vw" m={0} />);
  return (
    <HStack
      as="p"
      spacing="1vw"
      fontWeight="500"
      fontSize="1.6vw"
      lineHeight="2vw"
      mt="1vw"
    >
      <Text as="span">{speaker.name}</Text>
      {primaryIcon ? primaryIcon : null}
      {primaryAlias ? (
        <Text as="span" m={0}>
          @{primaryAlias}
        </Text>
      ) : null}
    </HStack>
  );
};
