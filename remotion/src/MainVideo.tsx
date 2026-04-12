import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { slide } from "@remotion/transitions/slide";
import { IntroScene } from "./scenes/IntroScene";
import { RoleSelectionScene } from "./scenes/RoleSelectionScene";
import { CitizenReportScene } from "./scenes/CitizenReportScene";
import { CommunityVotingScene } from "./scenes/CommunityVotingScene";
import { ContractorScene } from "./scenes/ContractorScene";
import { GovernmentScene } from "./scenes/GovernmentScene";
import { MapTransparencyScene } from "./scenes/MapTransparencyScene";
import { ClosingScene } from "./scenes/ClosingScene";
import { PersistentBackground } from "./components/PersistentBackground";

const T = 20; // transition duration in frames

export const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <PersistentBackground />
      <TransitionSeries>
        {/* Intro: 5s */}
        <TransitionSeries.Sequence durationInFrames={150}>
          <IntroScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: T })}
        />

        {/* Role Selection: 5s */}
        <TransitionSeries.Sequence durationInFrames={150}>
          <RoleSelectionScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-left" })}
          timing={linearTiming({ durationInFrames: T })}
        />

        {/* Citizen Reporting: 7s */}
        <TransitionSeries.Sequence durationInFrames={210}>
          <CitizenReportScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: T })}
        />

        {/* Community Voting: 5s */}
        <TransitionSeries.Sequence durationInFrames={150}>
          <CommunityVotingScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: T })}
        />

        {/* Contractor: 6s */}
        <TransitionSeries.Sequence durationInFrames={180}>
          <ContractorScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-bottom" })}
          timing={linearTiming({ durationInFrames: T })}
        />

        {/* Government: 6s */}
        <TransitionSeries.Sequence durationInFrames={180}>
          <GovernmentScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-left" })}
          timing={linearTiming({ durationInFrames: T })}
        />

        {/* Map & Transparency: 5s */}
        <TransitionSeries.Sequence durationInFrames={150}>
          <MapTransparencyScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: T })}
        />

        {/* Closing: 5s */}
        <TransitionSeries.Sequence durationInFrames={150}>
          <ClosingScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
