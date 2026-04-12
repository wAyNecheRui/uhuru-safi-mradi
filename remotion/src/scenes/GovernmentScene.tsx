import { AbsoluteFill, useCurrentFrame, spring, interpolate, useVideoConfig, Sequence } from "remotion";
import { COLORS, FONTS } from "../theme";
import { AnimatedText } from "../components/AnimatedText";
import { SectionLabel } from "../components/SectionLabel";

export const GovernmentScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ padding: '60px 100px' }}>
      <SectionLabel label="Government Official" color={COLORS.accentLight} />
      <AnimatedText text="Oversight & Accountability" fontSize={48} delay={5} />

      <div style={{ position: 'absolute', top: 180, left: 100, right: 100, bottom: 60 }}>
        <Sequence from={0} durationInFrames={90}>
          <BulkApprovalMockup frame={frame} fps={fps} />
        </Sequence>
        <Sequence from={90} durationInFrames={90}>
          <EscrowMockup frame={frame - 90} fps={fps} />
        </Sequence>
      </div>
    </AbsoluteFill>
  );
};

const BulkApprovalMockup: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const appear = spring({ frame, fps, config: { damping: 20 } });

  const reports = [
    { title: 'Collapsed drainage — Kangemi', votes: 15, priority: 'High' },
    { title: 'Broken water pipe — Kibera', votes: 23, priority: 'Critical' },
    { title: 'Street light outage — Parklands', votes: 8, priority: 'Medium' },
    { title: 'Road pothole — Eastleigh', votes: 31, priority: 'High' },
  ];

  const selectAll = frame > 40;

  return (
    <div style={{ display: 'flex', gap: 40, opacity: interpolate(appear, [0, 1], [0, 1]) }}>
      <div style={{
        flex: 1, borderRadius: 20, padding: 32,
        background: COLORS.darkCard, border: `1px solid ${COLORS.border}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontFamily: FONTS.display, fontSize: 20, color: COLORS.white }}>
            📋 Pending Reports
          </div>
          <div style={{
            padding: '8px 18px', borderRadius: 10,
            background: selectAll ? `${COLORS.primary}20` : COLORS.darkSurface,
            border: `1px solid ${selectAll ? COLORS.primary : COLORS.border}`,
            fontFamily: FONTS.body, fontSize: 13,
            color: selectAll ? COLORS.primaryLight : COLORS.muted,
            fontWeight: 600,
          }}>
            {selectAll ? '✓ All Selected' : 'Select All'}
          </div>
        </div>

        {reports.map((r, i) => {
          const rowAppear = spring({ frame: frame - 10 - i * 5, fps, config: { damping: 20 } });
          const priorityColor = r.priority === 'Critical' ? COLORS.accent : r.priority === 'High' ? COLORS.gold : COLORS.muted;
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10,
              padding: '12px 16px', borderRadius: 12,
              background: selectAll ? `${COLORS.primary}08` : COLORS.darkSurface,
              border: `1px solid ${selectAll ? COLORS.primary + '40' : COLORS.border}`,
              opacity: interpolate(rowAppear, [0, 1], [0, 1]),
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: 4,
                border: `2px solid ${selectAll ? COLORS.primary : COLORS.border}`,
                background: selectAll ? COLORS.primary : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, color: 'white',
              }}>
                {selectAll && '✓'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.white }}>{r.title}</div>
                <div style={{ fontFamily: FONTS.body, fontSize: 11, color: COLORS.muted }}>
                  {r.votes} community votes
                </div>
              </div>
              <div style={{
                padding: '4px 10px', borderRadius: 6, fontSize: 11,
                fontFamily: FONTS.body, fontWeight: 600,
                background: `${priorityColor}20`, color: priorityColor,
              }}>
                {r.priority}
              </div>
            </div>
          );
        })}

        {/* Bulk approve button */}
        {selectAll && (
          <div style={{
            marginTop: 16, padding: '14px 20px', borderRadius: 12,
            background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryLight})`,
            fontFamily: FONTS.display, fontSize: 15, color: COLORS.white,
            textAlign: 'center', fontWeight: 600,
            opacity: interpolate(spring({ frame: frame - 50, fps, config: { damping: 15 } }), [0, 1], [0, 1]),
          }}>
            ✅ Approve All 4 Reports
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ width: 340 }}>
        {[
          { label: 'Pending', value: '24', icon: '📬', color: COLORS.gold },
          { label: 'Active Projects', value: '18', icon: '🏗️', color: COLORS.primary },
          { label: 'Budget Utilized', value: '67%', icon: '💰', color: COLORS.primaryLight },
        ].map((stat, i) => {
          const statAppear = spring({ frame: frame - 15 - i * 8, fps, config: { damping: 18 } });
          return (
            <div key={i} style={{
              marginBottom: 14, borderRadius: 16, padding: '18px 22px',
              background: COLORS.darkCard, border: `1px solid ${COLORS.border}`,
              display: 'flex', alignItems: 'center', gap: 14,
              opacity: interpolate(statAppear, [0, 1], [0, 1]),
              transform: `translateX(${interpolate(statAppear, [0, 1], [30, 0])}px)`,
            }}>
              <span style={{ fontSize: 28 }}>{stat.icon}</span>
              <div>
                <div style={{ fontFamily: FONTS.display, fontSize: 24, color: stat.color, fontWeight: 800 }}>{stat.value}</div>
                <div style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.muted }}>{stat.label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const EscrowMockup: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const appear = spring({ frame, fps, config: { damping: 20 } });
  const fillProgress = interpolate(frame, [10, 60], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{ display: 'flex', gap: 40, opacity: interpolate(appear, [0, 1], [0, 1]) }}>
      {/* Escrow visualization */}
      <div style={{
        flex: 1, borderRadius: 20, padding: 36,
        background: COLORS.darkCard, border: `1px solid ${COLORS.border}`,
      }}>
        <div style={{ fontFamily: FONTS.display, fontSize: 20, color: COLORS.white, marginBottom: 24 }}>
          🔒 Escrow-Based Payment System
        </div>

        {/* Flow diagram */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {[
            { icon: '🏛️', label: 'Gov Funds', done: fillProgress > 20 },
            { icon: '→', label: '', done: false },
            { icon: '🔒', label: 'Escrow', done: fillProgress > 50 },
            { icon: '→', label: '', done: false },
            { icon: '✅', label: 'Milestone', done: fillProgress > 70 },
            { icon: '→', label: '', done: false },
            { icon: '💰', label: 'Contractor', done: fillProgress > 90 },
          ].map((step, i) => (
            <div key={i} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              flex: step.icon === '→' ? 0.5 : 1,
            }}>
              <div style={{
                fontSize: step.icon === '→' ? 20 : 32,
                opacity: step.done || step.icon === '→' ? 1 : 0.4,
                color: step.done ? COLORS.primaryLight : COLORS.muted,
              }}>
                {step.icon}
              </div>
              {step.label && (
                <div style={{
                  fontFamily: FONTS.body, fontSize: 11, color: COLORS.muted, marginTop: 6,
                }}>
                  {step.label}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 30, height: 10, borderRadius: 5, background: COLORS.darkSurface }}>
          <div style={{
            height: '100%', borderRadius: 5,
            width: `${fillProgress}%`,
            background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.primaryLight}, ${COLORS.gold})`,
          }} />
        </div>

        <div style={{
          marginTop: 16, fontFamily: FONTS.body, fontSize: 13, color: COLORS.muted,
        }}>
          Funds are locked in escrow and only released upon verified milestone completion
        </div>
      </div>

      {/* Bulk milestone release */}
      <div style={{
        width: 360, borderRadius: 20, padding: 28,
        background: `${COLORS.accent}08`, border: `1px solid ${COLORS.accent}25`,
      }}>
        <div style={{ fontFamily: FONTS.display, fontSize: 18, color: COLORS.white, marginBottom: 16 }}>
          ⚡ Bulk Payment Release
        </div>
        {['Milestone 1 — Verified ✅', 'Milestone 2 — Verified ✅', 'Milestone 3 — Pending ⏳'].map((m, i) => (
          <div key={i} style={{
            padding: '10px 14px', borderRadius: 10, marginBottom: 8,
            background: COLORS.darkSurface, border: `1px solid ${COLORS.border}`,
            fontFamily: FONTS.body, fontSize: 13, color: i < 2 ? COLORS.white : COLORS.muted,
          }}>
            {m}
          </div>
        ))}
        <div style={{
          marginTop: 16, padding: '12px 18px', borderRadius: 10,
          background: `${COLORS.accent}20`, border: `1px solid ${COLORS.accent}40`,
          fontFamily: FONTS.display, fontSize: 14, color: COLORS.accentLight,
          textAlign: 'center', fontWeight: 600,
        }}>
          Release 2 Payments — KES 980,000
        </div>
      </div>
    </div>
  );
};
