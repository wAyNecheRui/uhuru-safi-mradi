import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";

// 11 scenes, ~54s at 30fps = ~1620 frames (accounting for transitions)
// 150+120+120+180+150+180+180+150+120+120+150 = 1620 - 10*20 = 1420
export const RemotionRoot = () => (
  <Composition
    id="main"
    component={MainVideo}
    durationInFrames={1420}
    fps={30}
    width={1920}
    height={1080}
  />
);
