import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Img, staticFile } from 'remotion';
import { COLORS, FONTS } from '../theme';

export const LandingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Screen zoom-in
  const s = spring({ frame, fps, config: { damping: 20, stiffness: 120 } });
  const scale = interpolate(s, [0, 1], [0.85, 0.6]);
  const opacity = interpolate(s, [0, 1], [0, 1]);

  // Label
  const labelS = spring({ frame: frame - 25, fps, config: { damping: 20 } });
  const labelO = interpolate(labelS, [0, 1], [0, 1]);
  const labelY = interpolate(labelS, [0, 1], [20, 0]);

  // Floating indicator
  const floatY = Math.sin(frame * 0.08) * 6;

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      {/* Screenshot */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: `translate(-50%, calc(-50% + ${floatY}px)) scale(${scale})`,
          opacity,
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)',
        }}
      >
        <Img src={staticFile('images/01-landing.png')} style={{ display: 'block', width: 1920, height: 1080 }} />
      </div>

      {/* Label overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          left: '50%',
          transform: `translateX(-50%) translateY(${labelY}px)`,
          opacity: labelO,
          background: `linear-gradient(135deg, ${COLORS.darkCard}F0, ${COLORS.darkSurface}F0)`,
          border: `1px solid ${COLORS.primary}40`,
          borderRadius: 16,
          padding: '20px 40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ fontFamily: FONTS.display, fontSize: 28, fontWeight: 700, color: COLORS.white }}>
          Public Landing Page
        </span>
        <span style={{ fontFamily: FONTS.body, fontSize: 18, color: COLORS.muted }}>
          Track projects • View transparency data • Get started
        </span>
      </div>
    </AbsoluteFill>
  );
};
