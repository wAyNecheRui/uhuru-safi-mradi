import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Img, staticFile } from 'remotion';
import { COLORS, FONTS } from '../theme';

export const ProjectsShowcaseScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const screenS = spring({ frame, fps, config: { damping: 20 } });
  const screenScale = interpolate(screenS, [0, 1], [0.85, 0.55]);
  const screenO = interpolate(screenS, [0, 1], [0, 1]);
  const floatY = Math.sin(frame * 0.07) * 5;

  // Stats
  const stats = [
    { value: '10', label: 'Total Projects' },
    { value: '5', label: 'Completed' },
    { value: 'KES 2B+', label: 'Total Budget' },
    { value: '47', label: 'Counties' },
  ];

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      {/* Screenshot */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '45%',
          transform: `translate(-50%, calc(-50% + ${floatY}px)) scale(${screenScale})`,
          opacity: screenO,
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)',
        }}
      >
        <Img src={staticFile('images/05-projects.png')} style={{ display: 'block', width: 1920, height: 1080 }} />
      </div>

      {/* Bottom stats bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 50,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 32,
        }}
      >
        {stats.map((stat, i) => {
          const sS = spring({ frame: frame - 30 - i * 6, fps, config: { damping: 15 } });
          const o = interpolate(sS, [0, 1], [0, 1]);
          const scale = interpolate(sS, [0, 1], [0.8, 1]);
          return (
            <div
              key={i}
              style={{
                background: `${COLORS.darkCard}E8`,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 14,
                padding: '16px 32px',
                textAlign: 'center',
                opacity: o,
                transform: `scale(${scale})`,
              }}
            >
              <div style={{ fontFamily: FONTS.display, fontSize: 28, fontWeight: 800, color: COLORS.primaryLight }}>
                {stat.value}
              </div>
              <div style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.muted }}>{stat.label}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
