import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { COLORS } from "../theme";

export const PersistentBackground: React.FC = () => {
  const frame = useCurrentFrame();

  const gradientAngle = interpolate(frame, [0, 1350], [135, 225]);
  const pulse = Math.sin(frame * 0.02) * 5;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${gradientAngle}deg, ${COLORS.darkBg} 0%, #0F172A ${50 + pulse}%, ${COLORS.darkCard} 100%)`,
      }}
    />
  );
};
