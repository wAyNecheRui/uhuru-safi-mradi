import { AbsoluteFill, useCurrentFrame, spring, interpolate, useVideoConfig, Sequence } from "remotion";
import { COLORS, FONTS } from "../theme";
import { AnimatedText } from "../components/AnimatedText";

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Kenya flag stripe animation
  const stripeWidth = interpolate(
    spring({ frame: frame - 10, fps, config: { damping: 25 } }),
    [0, 1], [0, 1920]
  );

  // Logo pulse
  const logoPulse = 1 + Math.sin(frame * 0.08) * 0.03;
  const logoAppear = spring({ frame: frame - 5, fps, config: { damping: 12 } });
  const logoScale = interpolate(logoAppear, [0, 1], [0.3, 1]);

  // Tagline
  const tagOpacity = interpolate(frame, [60, 80], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Decorative Kenya stripes */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: stripeWidth, height: 6, background: COLORS.primary }} />
      <div style={{ position: 'absolute', top: 6, left: 0, width: stripeWidth * 0.95, height: 4, background: COLORS.accent }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: stripeWidth, height: 6, background: COLORS.primary }} />
      <div style={{ position: 'absolute', bottom: 6, left: 0, width: stripeWidth * 0.95, height: 4, background: COLORS.accent }} />

      {/* Center content */}
      <div style={{ textAlign: 'center', transform: `scale(${logoScale * logoPulse})` }}>
        {/* Shield icon */}
        <div style={{
          width: 120, height: 120, borderRadius: 30, margin: '0 auto 30px',
          background: `linear-gradient(145deg, ${COLORS.primary}, ${COLORS.primaryLight})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 20px 60px ${COLORS.primary}60`,
          fontSize: 60,
        }}>
          🛡️
        </div>

        <AnimatedText text="UHURU SAFI" delay={15} fontSize={72} fontWeight={800} textAlign="center" color={COLORS.white} />
        <div style={{ height: 12 }} />
        <AnimatedText text="Kenya's Infrastructure Accountability Platform" delay={30} fontSize={26} fontWeight={400} color={COLORS.muted} textAlign="center" maxWidth={700} />
      </div>

      {/* Bottom tagline */}
      <div style={{
        position: 'absolute', bottom: 80, left: 0, right: 0, textAlign: 'center',
        opacity: tagOpacity,
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          background: `${COLORS.primary}20`, borderRadius: 40, padding: '12px 28px',
          border: `1px solid ${COLORS.primary}30`,
        }}>
          <span style={{ fontSize: 22 }}>🇰🇪</span>
          <span style={{ fontFamily: FONTS.body, fontSize: 16, color: COLORS.primaryLight, fontWeight: 500 }}>
            Every Report Tracked · Every Shilling Accounted
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
