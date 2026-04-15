import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { COLORS, FONTS } from '../theme';

export const WorkflowCard: React.FC<{
  icon: string;
  title: string;
  description: string;
  delay?: number;
  color?: string;
  x?: number;
  y?: number;
}> = ({ icon, title, description, delay = 0, color = COLORS.primary, x = 0, y = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 180 } });
  const translateY = interpolate(s, [0, 1], [50, 0]);
  const opacity = interpolate(s, [0, 1], [0, 1]);

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translateY(${translateY}px)`,
        opacity,
        background: `linear-gradient(135deg, ${COLORS.darkCard} 0%, ${COLORS.darkSurface} 100%)`,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 16,
        padding: '28px 32px',
        width: 400,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 12,
            background: `${color}25`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
          }}
        >
          {icon}
        </div>
        <span
          style={{
            fontFamily: FONTS.display,
            fontSize: 24,
            fontWeight: 600,
            color: COLORS.white,
          }}
        >
          {title}
        </span>
      </div>
      <p
        style={{
          fontFamily: FONTS.body,
          fontSize: 17,
          color: COLORS.muted,
          lineHeight: 1.5,
          margin: 0,
        }}
      >
        {description}
      </p>
    </div>
  );
};
