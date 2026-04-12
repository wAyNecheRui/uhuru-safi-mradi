import { useCurrentFrame, spring, interpolate, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../theme";

interface StepIndicatorProps {
  steps: string[];
  activeStep: number;
  x?: number;
  y?: number;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps, activeStep, x = 0, y = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      display: 'flex', gap: 12, alignItems: 'center',
    }}>
      {steps.map((step, i) => {
        const isActive = i <= activeStep;
        const appear = spring({ frame: frame - i * 8, fps, config: { damping: 20 } });
        const scale = interpolate(appear, [0, 1], [0.5, 1]);
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 18,
              background: isActive ? COLORS.primary : COLORS.darkSurface,
              border: `2px solid ${isActive ? COLORS.primaryLight : COLORS.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: FONTS.display, fontSize: 14, fontWeight: 700,
              color: isActive ? COLORS.white : COLORS.muted,
              transform: `scale(${scale})`,
            }}>
              {i + 1}
            </div>
            <div style={{
              fontFamily: FONTS.body, fontSize: 13,
              color: isActive ? COLORS.white : COLORS.muted,
              fontWeight: isActive ? 600 : 400,
              maxWidth: 100,
            }}>
              {step}
            </div>
            {i < steps.length - 1 && (
              <div style={{
                width: 30, height: 2,
                background: i < activeStep ? COLORS.primaryLight : COLORS.border,
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
};
