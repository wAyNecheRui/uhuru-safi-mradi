import { useCurrentFrame, spring, interpolate, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../theme";

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  delay?: number;
  accentColor?: string;
  x?: number;
  y?: number;
  width?: number;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon, title, description, delay = 0,
  accentColor = COLORS.primary, x = 0, y = 0, width = 400,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const appear = spring({ frame: frame - delay, fps, config: { damping: 15, stiffness: 150 } });
  const scale = interpolate(appear, [0, 1], [0.8, 1]);
  const opacity = interpolate(appear, [0, 1], [0, 1]);

  return (
    <div style={{
      position: 'absolute', left: x, top: y, width,
      background: `linear-gradient(145deg, ${COLORS.darkCard}, ${COLORS.darkSurface})`,
      borderRadius: 20, padding: 32,
      border: `1px solid ${COLORS.border}`,
      transform: `scale(${scale})`, opacity,
      boxShadow: `0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)`,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 14,
        background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}10)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 28, marginBottom: 16,
        border: `1px solid ${accentColor}40`,
      }}>
        {icon}
      </div>
      <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 700, color: COLORS.white, marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ fontFamily: FONTS.body, fontSize: 15, color: COLORS.muted, lineHeight: 1.5 }}>
        {description}
      </div>
    </div>
  );
};
