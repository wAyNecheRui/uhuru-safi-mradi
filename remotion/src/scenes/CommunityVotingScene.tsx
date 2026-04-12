import { AbsoluteFill, useCurrentFrame, spring, interpolate, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../theme";
import { AnimatedText } from "../components/AnimatedText";
import { SectionLabel } from "../components/SectionLabel";

export const CommunityVotingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animate vote count
  const voteCount = Math.min(3, Math.floor(interpolate(frame, [30, 100], [0, 3], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })));
  const progressWidth = interpolate(frame, [30, 100], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const thresholdReached = frame > 100;

  return (
    <AbsoluteFill style={{ padding: '60px 100px' }}>
      <SectionLabel label="Community Validation" />
      <AnimatedText text="Community Voting System" fontSize={48} delay={5} />
      <div style={{ height: 8 }} />
      <AnimatedText text="3 verified votes needed to prioritize a report" fontSize={18} delay={12} color={COLORS.muted} fontWeight={400} />

      <div style={{ display: 'flex', gap: 50, marginTop: 50 }}>
        {/* Voting card */}
        <div style={{
          flex: 1, borderRadius: 24, padding: 40,
          background: COLORS.darkCard, border: `1px solid ${COLORS.border}`,
        }}>
          {/* Report preview */}
          <div style={{
            padding: '16px 20px', borderRadius: 14,
            background: COLORS.darkSurface, border: `1px solid ${COLORS.border}`,
            marginBottom: 28,
          }}>
            <div style={{ fontFamily: FONTS.display, fontSize: 18, color: COLORS.white, marginBottom: 6 }}>
              Collapsed drainage on Moi Avenue
            </div>
            <div style={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.muted }}>
              📍 Nairobi · Westlands · Kangemi Ward
            </div>
          </div>

          {/* Vote progress */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.muted }}>Community Votes</span>
              <span style={{ fontFamily: FONTS.display, fontSize: 16, color: thresholdReached ? COLORS.primaryLight : COLORS.white, fontWeight: 700 }}>
                {voteCount}/3
              </span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: COLORS.darkSurface, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 4,
                width: `${progressWidth}%`,
                background: thresholdReached
                  ? `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.primaryLight})`
                  : `linear-gradient(90deg, ${COLORS.gold}, ${COLORS.gold}cc)`,
              }} />
            </div>
          </div>

          {/* Voter avatars */}
          <div style={{ display: 'flex', gap: 12 }}>
            {[0, 1, 2].map(i => {
              const voterAppear = spring({ frame: frame - 40 - i * 20, fps, config: { damping: 12 } });
              return (
                <div key={i} style={{
                  width: 44, height: 44, borderRadius: 22,
                  background: i < voteCount ? `${COLORS.primary}30` : COLORS.darkSurface,
                  border: `2px solid ${i < voteCount ? COLORS.primary : COLORS.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transform: `scale(${interpolate(voterAppear, [0, 1], [0, 1])})`,
                  fontSize: 18,
                }}>
                  {i < voteCount ? '✓' : '?'}
                </div>
              );
            })}
          </div>

          {/* Threshold badge */}
          {thresholdReached && (
            <div style={{
              marginTop: 24, padding: '12px 20px', borderRadius: 12,
              background: `${COLORS.primary}20`, border: `1px solid ${COLORS.primary}40`,
              fontFamily: FONTS.body, fontSize: 14, color: COLORS.primaryLight, fontWeight: 600,
              opacity: interpolate(spring({ frame: frame - 105, fps, config: { damping: 15 } }), [0, 1], [0, 1]),
            }}>
              ✅ Threshold reached — Escalated to Government Review
            </div>
          )}
        </div>

        {/* Info panel */}
        <div style={{ width: 380 }}>
          <div style={{
            borderRadius: 20, padding: 28, marginBottom: 20,
            background: `${COLORS.primary}10`, border: `1px solid ${COLORS.primary}20`,
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🗳️</div>
            <div style={{ fontFamily: FONTS.display, fontSize: 18, color: COLORS.white, marginBottom: 8 }}>
              Democracy in Action
            </div>
            <div style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.muted, lineHeight: 1.6 }}>
              Citizens validate reports from their area. 3 votes = government review priority.
            </div>
          </div>

          <div style={{
            borderRadius: 20, padding: 28,
            background: COLORS.darkCard, border: `1px solid ${COLORS.border}`,
          }}>
            <div style={{ fontFamily: FONTS.display, fontSize: 16, color: COLORS.white, marginBottom: 12 }}>
              Priority Impact
            </div>
            {['Affects 500+ people', 'Safety hazard', 'Critical infrastructure'].map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
                fontFamily: FONTS.body, fontSize: 13, color: COLORS.muted,
              }}>
                <span style={{ color: COLORS.accent }}>●</span> {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
