import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { slide } from "@remotion/transitions/slide";
import { IntroScene } from "./scenes/IntroScene";
import { LandingScene } from "./scenes/LandingScene";
import { RoleSelectionScene } from "./scenes/RoleSelectionScene";
import { CitizenReportScene } from "./scenes/CitizenReportScene";
import { CommunityVotingScene } from "./scenes/CommunityVotingScene";
import { GovernmentScene } from "./scenes/GovernmentScene";
import { ContractorScene } from "./scenes/ContractorScene";
import { ProjectTrackingScene } from "./scenes/ProjectTrackingScene";
import { TransparencyScene } from "./scenes/TransparencyScene";
import { ProjectsShowcaseScene } from "./scenes/ProjectsShowcaseScene";
import { ClosingScene } from "./scenes/ClosingScene";
import { PersistentBackground } from "./components/PersistentBackground";

const T = 20;

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

        {/* Landing page: 4s */}
        <TransitionSeries.Sequence durationInFrames={120}>
          <LandingScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-left" })}
          timing={linearTiming({ durationInFrames: T })}
        />

        {/* Role Selection: 4s */}
        <TransitionSeries.Sequence durationInFrames={120}>
          <RoleSelectionScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: T })}
        />

        {/* Citizen Reporting: 6s */}
        <TransitionSeries.Sequence durationInFrames={180}>
          <CitizenReportScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: T })}
        />

        {/* Community Voting: 5s */}
        <TransitionSeries.Sequence durationInFrames={150}>
          <CommunityVotingScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-bottom" })}
          timing={linearTiming({ durationInFrames: T })}
        />

        {/* Government Approval: 6s */}
        <TransitionSeries.Sequence durationInFrames={180}>
          <GovernmentScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-left" })}
          timing={linearTiming({ durationInFrames: T })}
        />

        {/* Contractor Bidding: 6s */}
        <TransitionSeries.Sequence durationInFrames={180}>
          <ContractorScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: T })}
        />

        {/* Project Tracking: 5s */}
        <TransitionSeries.Sequence durationInFrames={150}>
          <ProjectTrackingScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-left" })}
          timing={linearTiming({ durationInFrames: T })}
        />

        {/* Transparency Portal: 4s */}
        <TransitionSeries.Sequence durationInFrames={120}>
          <TransparencyScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: T })}
        />

        {/* Projects Showcase: 4s */}
        <TransitionSeries.Sequence durationInFrames={120}>
          <ProjectsShowcaseScene />
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
