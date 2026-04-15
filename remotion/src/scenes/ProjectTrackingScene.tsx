import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { COLORS, FONTS } from '../theme';

export const ProjectTrackingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleS = spring({ frame, fps, config: { damping: 20 } });
  const titleO = interpolate(titleS, [0, 1], [0, 1]);

  const milestones = [
    { title: 'Site Preparation', pct: 100, status: 'Verified ✓', payment: 'KES 190K Released' },
    { title: 'Foundation Work', pct: 100, status: 'Verified ✓', payment: 'KES 285K Released' },
    { title: 'Bridge Construction', pct: 65, status: 'In Progress', payment: 'Pending verification' },
    { title: 'Final Inspection', pct: 0, status: 'Upcoming', payment: 'KES 190K Escrow' },
  ];

  // Animated overall progress
  const progressPct = interpolate(frame, [20, 80], [0, 72], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ padding: '60px 100px' }}>
      <div style={{ opacity: titleO }}>
        <div style={{ fontFamily: FONTS.body, fontSize: 16, color: '#8B5CF6', fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase' }}>
          Step 5 — Project Execution
        </div>
        <div style={{ fontFamily: FONTS.display, fontSize: 48, fontWeight: 700, color: COLORS.white, marginTop: 8 }}>
          Milestone Tracking & Payments
        </div>
      </div>

      <div style={{ display: 'flex', gap: 40, marginTop: 50 }}>
        {/* Progress overview */}
        <div style={{ width: 360 }}>
          {(() => {
            const circleS = spring({ frame: frame - 10, fps, config: { damping: 20 } });
            const o = interpolate(circleS, [0, 1], [0, 1]);
            return (
              <div style={{ background: COLORS.darkCard, borderRadius: 16, padding: 36, textAlign: 'center', opacity: o }}>
                <div style={{ position: 'relative', width: 200, height: 200, margin: '0 auto' }}>
                  <svg width={200} height={200} viewBox="0 0 200 200">
                    <circle cx={100} cy={100} r={85} fill="none" stroke={COLORS.darkSurface} strokeWidth={12} />
                    <circle
                      cx={100} cy={100} r={85}
                      fill="none"
                      stroke={COLORS.primaryLight}
                      strokeWidth={12}
                      strokeLinecap="round"
                      strokeDasharray={`${progressPct * 5.34} 534`}
                      transform="rotate(-90 100 100)"
                    />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontFamily: FONTS.display, fontSize: 48, fontWeight: 800, color: COLORS.white }}>
                      {Math.round(progressPct)}%
                    </div>
                    <div style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.muted }}>Complete</div>
                  </div>
                </div>

                <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 700, color: COLORS.primaryLight }}>KES 475K</div>
                    <div style={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.muted }}>Released</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 700, color: COLORS.gold }}>KES 475K</div>
                    <div style={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.muted }}>In Escrow</div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Milestones */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {milestones.map((m, i) => {
            const mS = spring({ frame: frame - 20 - i * 8, fps, config: { damping: 18 } });
            const o = interpolate(mS, [0, 1], [0, 1]);
            const x = interpolate(mS, [0, 1], [30, 0]);

            return (
              <div
                key={i}
                style={{
                  background: COLORS.darkCard,
                  border: `1px solid ${m.pct === 100 ? '#4ADE8030' : COLORS.border}`,
                  borderRadius: 14,
                  padding: '22px 28px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  opacity: o,
                  transform: `translateX(${x}px)`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: m.pct === 100 ? '#4ADE8020' : m.pct > 0 ? `${COLORS.primaryLight}20` : COLORS.darkSurface,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: FONTS.display,
                      fontSize: 18,
                      fontWeight: 700,
                      color: m.pct === 100 ? '#4ADE80' : COLORS.muted,
                    }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <div style={{ fontFamily: FONTS.body, fontSize: 18, fontWeight: 600, color: COLORS.text }}>{m.title}</div>
                    <div style={{ fontFamily: FONTS.body, fontSize: 14, color: m.pct === 100 ? '#4ADE80' : m.pct > 0 ? COLORS.primaryLight : COLORS.muted }}>
                      {m.status}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.muted }}>{m.payment}</div>
                  {m.pct > 0 && m.pct < 100 && (
                    <div style={{ marginTop: 6, width: 120, height: 6, background: COLORS.darkSurface, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${m.pct}%`, height: '100%', background: COLORS.primaryLight, borderRadius: 3 }} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
