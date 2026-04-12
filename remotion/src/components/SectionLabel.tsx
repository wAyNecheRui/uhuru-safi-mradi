import { useCurrentFrame, spring, interpolate, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../theme";

interface SectionLabelProps {
  label: string;
  color?: string;
}

export const SectionLabel: React.FC<SectionLabelProps> = ({ label, color = COLORS.primaryLight }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const appear = spring({ frame, fps, config: { damping: 20 } });
  const width = interpolate(appear, [0, 1], [0, 100]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
      <div style={{ width: `${width}%`, maxWidth: 50, height: 3, background: color, borderRadius: 2 }} />
      <div style={{
        fontFamily: FONTS.body, fontSize: 14, fontWeight: 600,
        color, letterSpacing: 3, textTransform: 'uppercase',
        opacity: interpolate(appear, [0, 1], [0, 1]),
      }}>
        {label}
      </div>
    </div>
  );
};
