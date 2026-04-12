import { AbsoluteFill, useCurrentFrame, spring, interpolate, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../theme";

export const ClosingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleAppear = spring({ frame: frame - 10, fps, config: { damping: 15 } });
  const subtitleAppear = spring({ frame: frame - 30, fps, config: { damping: 20 } });
  const badgesAppear = spring({ frame: frame - 50, fps, config: { damping: 18 } });

  const pulse = 1 + Math.sin(frame * 0.06) * 0.02;

  return (
    <AbsoluteFill style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Radial glow */}
      <div style={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        background: `radial-gradient(circle, ${COLORS.primary}15, transparent 70%)`,
        top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
      }} />

      {/* Logo */}
      <div style={{
        width: 100, height: 100, borderRadius: 26,
        background: `linear-gradient(145deg, ${COLORS.primary}, ${COLORS.primaryLight})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 50, marginBottom: 32,
        transform: `scale(${interpolate(titleAppear, [0, 1], [0.5, 1]) * pulse})`,
        boxShadow: `0 20px 60px ${COLORS.primary}50`,
      }}>
        🛡️
      </div>

      {/* Title */}
      <div style={{
        fontFamily: FONTS.display, fontSize: 64, fontWeight: 800, color: COLORS.white,
        opacity: interpolate(titleAppear, [0, 1], [0, 1]),
        transform: `translateY(${interpolate(titleAppear, [0, 1], [30, 0])}px)`,
        textAlign: 'center',
      }}>
        UHURU SAFI
      </div>

      <div style={{ height: 16 }} />

      {/* Tagline */}
      <div style={{
        fontFamily: FONTS.body, fontSize: 22, color: COLORS.muted,
        opacity: interpolate(subtitleAppear, [0, 1], [0, 1]),
        transform: `translateY(${interpolate(subtitleAppear, [0, 1], [20, 0])}px)`,
        textAlign: 'center', maxWidth: 600,
      }}>
        Every report tracked. Every shilling accounted.
        <br />Every citizen has a voice.
      </div>

      <div style={{ height: 40 }} />

      {/* Feature badges */}
      <div style={{
        display: 'flex', gap: 16,
        opacity: interpolate(badgesAppear, [0, 1], [0, 1]),
        transform: `translateY(${interpolate(badgesAppear, [0, 1], [15, 0])}px)`,
      }}>
        {['🗳️ Community Voting', '🔒 Escrow Payments', '📍 GPS Evidence', '📊 Full Transparency'].map((badge, i) => (
          <div key={i} style={{
            padding: '10px 20px', borderRadius: 12,
            background: `${COLORS.primary}12`, border: `1px solid ${COLORS.primary}25`,
            fontFamily: FONTS.body, fontSize: 14, color: COLORS.primaryLight,
            fontWeight: 500,
          }}>
            {badge}
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div style={{
        position: 'absolute', bottom: 40, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', gap: 20,
        opacity: interpolate(frame, [80, 100], [0, 0.6], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
      }}>
        <span style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.muted }}>
          🇰🇪 Built for Kenya · Scalable Worldwide
        </span>
      </div>
    </AbsoluteFill>
  );
};
