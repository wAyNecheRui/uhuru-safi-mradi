import { AbsoluteFill, useCurrentFrame, spring, interpolate, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../theme";
import { AnimatedText } from "../components/AnimatedText";
import { SectionLabel } from "../components/SectionLabel";

const roles = [
  { icon: '👥', title: 'Citizen', desc: 'Report issues, verify projects, register skills', color: COLORS.primary },
  { icon: '🏗️', title: 'Contractor', desc: 'Bid on projects, manage workforce, track payments', color: COLORS.gold },
  { icon: '🏛️', title: 'Government', desc: 'Oversee, approve budgets, release payments', color: COLORS.accent },
];

export const RoleSelectionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ padding: '80px 120px' }}>
      <SectionLabel label="Getting Started" />
      <AnimatedText text="Choose Your Role" fontSize={56} delay={5} />
      <div style={{ height: 8 }} />
      <AnimatedText text="Three roles, one transparent system" fontSize={20} delay={12} color={COLORS.muted} fontWeight={400} />

      <div style={{ display: 'flex', gap: 40, marginTop: 60 }}>
        {roles.map((role, i) => {
          const appear = spring({ frame: frame - 25 - i * 12, fps, config: { damping: 15, stiffness: 120 } });
          const y = interpolate(appear, [0, 1], [80, 0]);
          const opacity = interpolate(appear, [0, 1], [0, 1]);
          const isHighlight = frame > 80 + i * 15 && frame < 95 + i * 15;
          const glowIntensity = isHighlight ? 0.4 : 0;

          return (
            <div key={i} style={{
              flex: 1, borderRadius: 24, padding: 40,
              background: `linear-gradient(160deg, ${COLORS.darkCard}, ${COLORS.darkSurface})`,
              border: `1.5px solid ${isHighlight ? role.color : COLORS.border}`,
              transform: `translateY(${y}px) scale(${isHighlight ? 1.03 : 1})`,
              opacity,
              boxShadow: isHighlight
                ? `0 0 40px ${role.color}${Math.floor(glowIntensity * 255).toString(16).padStart(2, '0')}`
                : '0 10px 40px rgba(0,0,0,0.3)',
              transition: 'none',
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: 20,
                background: `${role.color}15`,
                border: `1px solid ${role.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 36, marginBottom: 24,
              }}>
                {role.icon}
              </div>
              <div style={{ fontFamily: FONTS.display, fontSize: 28, fontWeight: 700, color: COLORS.white, marginBottom: 12 }}>
                {role.title}
              </div>
              <div style={{ fontFamily: FONTS.body, fontSize: 16, color: COLORS.muted, lineHeight: 1.6 }}>
                {role.desc}
              </div>
              {/* Arrow indicator */}
              <div style={{
                marginTop: 20, display: 'flex', alignItems: 'center', gap: 8,
                color: role.color, fontFamily: FONTS.body, fontSize: 14, fontWeight: 600,
              }}>
                Select Role →
              </div>
            </div>
          );
        })}
      </div>

      {/* Onboarding note */}
      <div style={{
        position: 'absolute', bottom: 60, left: 120, right: 120,
        display: 'flex', alignItems: 'center', gap: 12,
        opacity: interpolate(frame, [110, 130], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
      }}>
        <div style={{
          background: `${COLORS.primary}20`, borderRadius: 12, padding: '10px 20px',
          border: `1px solid ${COLORS.primary}25`,
          fontFamily: FONTS.body, fontSize: 14, color: COLORS.primaryLight,
        }}>
          💡 First-time users get a step-by-step onboarding wizard tailored to their role
        </div>
      </div>
    </AbsoluteFill>
  );
};
