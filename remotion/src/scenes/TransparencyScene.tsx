import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Img, staticFile } from 'remotion';
import { COLORS, FONTS } from '../theme';

export const TransparencyScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const screenS = spring({ frame, fps, config: { damping: 20 } });
  const screenScale = interpolate(screenS, [0, 1], [0.85, 0.52]);
  const screenO = interpolate(screenS, [0, 1], [0, 1]);
  const floatY = Math.sin(frame * 0.06) * 5;

  const features = [
    { icon: '🔗', text: 'Blockchain-verified records' },
    { icon: '💰', text: 'Real-time escrow tracking' },
    { icon: '📊', text: 'Public budget analytics' },
    { icon: '🗺️', text: 'Interactive project maps' },
  ];

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      {/* Screenshot */}
      <div
        style={{
          position: 'absolute',
          left: '35%',
          top: '50%',
          transform: `translate(-50%, calc(-50% + ${floatY}px)) scale(${screenScale})`,
          opacity: screenO,
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)',
        }}
      >
        <Img src={staticFile('images/06-transparency.png')} style={{ display: 'block', width: 1920, height: 1080 }} />
      </div>

      {/* Feature labels on right */}
      <div style={{ position: 'absolute', right: 80, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ fontFamily: FONTS.body, fontSize: 14, color: '#4ADE80', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>
          Step 6
        </div>
        <div style={{ fontFamily: FONTS.display, fontSize: 36, fontWeight: 700, color: COLORS.white, maxWidth: 360 }}>
          Public Transparency Portal
        </div>

        {features.map((f, i) => {
          const fS = spring({ frame: frame - 20 - i * 8, fps, config: { damping: 18 } });
          const o = interpolate(fS, [0, 1], [0, 1]);
          const x = interpolate(fS, [0, 1], [20, 0]);
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                opacity: o,
                transform: `translateX(${x}px)`,
              }}
            >
              <span style={{ fontSize: 24 }}>{f.icon}</span>
              <span style={{ fontFamily: FONTS.body, fontSize: 18, color: COLORS.text }}>{f.text}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
