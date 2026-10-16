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
import { Fonts, ScreenColors, ScreenFonts, TrackColors } from "./theme";
import { Logo } from "./Logo";

import { ScreenHeroFiller, ScreenHeroIconFiller } from "./ScreenHeroFiller";
import { ScreenHachikoBalloon } from "./ScreenHachikoBalloon";

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
    <ScreenHachikoBalloon
      status={
        <ScreenSessionsStatus
          text={
            state === "in_session"
              ? "Ongoing Sessions"
              : state === "break"
              ? `Next sessions ${relativeTime ?? ""}`
              : "Current and Upcoming Sessions"
          }
        />
      }
    >
      {Array.from(recentSessions.entries())
        .filter((e): e is [string, ConferenceSession] => e[1] !== undefined)
        .map(([track, s], i) => (
          <React.Fragment key={track}>
            {/* kor26: 吹き出しの中は space-evenly なので、タイトルが長い組では余白が 0 近くまで減り、
                区切り線がセッションに接する。線の上下には、余白とは別に、タイトルと話者の間と同じ 1vw を必ず空ける。
                それで入りきらない組では、吹き出しが上に伸びる */}
            {i > 0 ? (
              <Box h="0.1vw" mx="2vw" my="1vw" bgColor={ScreenColors.line} />
            ) : null}
            <AnnounceUpcomingTopic session={s} />
          </React.Fragment>
        ))}
    </ScreenHachikoBalloon>
  );
};

// kor26: 吹き出しの下の段の状態の文。数字だけ大きくし、末尾に細い矢印を付ける
const ScreenSessionsStatus: React.FC<{ text: string }> = ({ text }) => {
  return (
    <Text
      fontFamily={ScreenFonts.heading}
      fontWeight="700"
      fontSize="2.3vw"
      lineHeight="3.6vw"
      color={ScreenColors.keyGreen}
    >
      {text
        .trim()
        .split(/(\d+)/)
        .map((part, i) =>
          /^\d+$/.test(part) ? (
            <Text as="span" key={i} fontSize="3.2vw">
              {part}
            </Text>
          ) : (
            <React.Fragment key={i}>{part}</React.Fragment>
          )
        )}
      <StatusArrow />
    </Text>
  );
};

// kor26: フォントの「→」は bold で太くなるので、細い線の SVG で描く (線の太さ 0.12vw)
const StatusArrow: React.FC = () => {
  return (
    <Box
      as="span"
      display="inline-block"
      ml="0.8vw"
      w="2.4vw"
      h="1vw"
      verticalAlign="middle"
    >
      <svg
        viewBox="0 0 24 10"
        width="100%"
        height="100%"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.2}
      >
        <path d="M0 5H23M18 0.6L23 5L18 9.4" />
      </svg>
    </Box>
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
    <Box textAlign="left" fontFamily={ScreenFonts.body}>
      {/* TODO: missing room name */}

      {/* kor26: hall 名の四角、avatar、タイトルの字面の上端をそろえる */}
      <HStack alignItems="flex-start" spacing="0.7vw" textAlign="left">
        <Flex
          minW="14.5vw"
          direction="column"
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
          <Text
            fontWeight="500"
            fontSize="1.2vw"
            lineHeight="1.8vw"
            color={ScreenColors.balloonTextMuted}
          >
            #kaigionrails
          </Text>
          <Text
            fontWeight="500"
            fontSize="1.2vw"
            lineHeight="1.8vw"
            color={ScreenColors.balloonTextMuted}
          >
            #kaigionrails_{session.track}
          </Text>
        </Flex>
        <Box
          minW="7vw"
          w="7vw"
          mx="1vw"
          opacity={session.canceled ? 0.5 : undefined}
        >
          {session.speakers && session.speakers.length > 0 ? (
            <SpeakerAvatar speakers={session.speakers} />
          ) : null}
        </Box>
        {/* kor26: キャンセルになったトークは、枠を空けたまま残す。Canceled の印を avatar の上端にそろえて置き、
            タイトルと話者は薄くする */}
        <Box
          as="div"
          flex="1"
          minW={0}
          color={
            session.canceled ? ScreenColors.balloonTextCanceled : undefined
          }
        >
          {session.canceled ? <CanceledLabel /> : null}
          {/* kor26: 公式サイトのトークのタイトルと同じ 110% の平体。伸びるぶん、折り返し幅を先に 1.1 で割っておく。
              行の上端から字面の上端まで、和文で約 0.08vw、英字の ascender で約 0.22vw 空くので、
              その間をとって 0.15vw 持ち上げ、字面の上端を avatar の上端にそろえる */}
          <Heading
            as="h2"
            mt={session.canceled ? "1vw" : "-0.15vw"}
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

// kor26: 公式サイトの keynote の Canceled ラベルと同じ、ピンク地に白文字。hall 名の四角と同じ大きさにする
const CanceledLabel: React.FC = () => {
  return (
    <Text
      display="inline-block"
      px="0.6vw"
      py="0.3vw"
      bgColor={ScreenColors.keyPink}
      color={ScreenColors.balloonText}
      fontFamily={ScreenFonts.heading}
      fontWeight="700"
      fontSize="1.8vw"
      lineHeight="2.3vw"
    >
      Canceled
    </Text>
  );
};

const ScreenTopicSpeaker: React.FC<{ speaker: Speaker }> = ({ speaker }) => {
  const primaryAlias = speaker.github_id || speaker.twitter_id;
  const primaryIcon =
    (speaker.github_id && <GitHubIcon boxSize="1.55vw" m={0} />) ||
    (speaker.twitter_id && <TwitterIcon boxSize="1.55vw" m={0} />);
  // kor26: 名前と ID がどちらも折り返せない長い 1 語だと、行がタイトルの列より広がり、
  // 吹き出しとスポンサー欄を右に押し出す。入りきらないときは、アイコンと ID をひとまとまりで次の行に送る。
  // それでも入らない長さは、途中で折る (overflowWrap)
  return (
    <HStack
      as="p"
      spacing="1vw"
      rowGap={0}
      wrap="wrap"
      overflowWrap="anywhere"
      fontWeight="500"
      fontSize="1.6vw"
      lineHeight="2vw"
      mt="1vw"
    >
      <Text as="span">{speaker.name}</Text>
      {primaryIcon || primaryAlias ? (
        <HStack as="span" spacing="1vw">
          {primaryIcon ? primaryIcon : null}
          {primaryAlias ? (
            <Text as="span" m={0}>
              @{primaryAlias}
            </Text>
          ) : null}
        </HStack>
      ) : null}
    </HStack>
  );
};
