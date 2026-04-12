import { AbsoluteFill, useCurrentFrame, spring, interpolate, useVideoConfig, Sequence } from "remotion";
import { COLORS, FONTS } from "../theme";
import { AnimatedText } from "../components/AnimatedText";
import { SectionLabel } from "../components/SectionLabel";

export const ContractorScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ padding: '60px 100px' }}>
      <SectionLabel label="Contractor Workflow" color={COLORS.gold} />
      <AnimatedText text="Bid, Build & Get Paid" fontSize={48} delay={5} />

      <div style={{ position: 'absolute', top: 180, left: 100, right: 100, bottom: 60 }}>
        {/* First half: Bidding */}
        <Sequence from={0} durationInFrames={90}>
          <BiddingMockup frame={frame} fps={fps} />
        </Sequence>

        {/* Second half: Workforce & Bulk Pay */}
        <Sequence from={90} durationInFrames={90}>
          <WorkforceMockup frame={frame - 90} fps={fps} />
        </Sequence>
      </div>
    </AbsoluteFill>
  );
};

const BiddingMockup: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const appear = spring({ frame, fps, config: { damping: 20 } });

  // Score bars animate
  const scoreFill = interpolate(frame, [20, 60], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const scores = [
    { label: 'Price (40%)', value: 85, color: COLORS.primary },
    { label: 'Technical (35%)', value: 92, color: COLORS.primaryLight },
    { label: 'Experience (15%)', value: 78, color: COLORS.gold },
    { label: 'AGPO Bonus (10%)', value: 100, color: COLORS.accent },
  ];

  return (
    <div style={{ display: 'flex', gap: 40, opacity: interpolate(appear, [0, 1], [0, 1]) }}>
      {/* Bid form */}
      <div style={{
        flex: 1, borderRadius: 20, padding: 32,
        background: COLORS.darkCard, border: `1px solid ${COLORS.border}`,
      }}>
        <div style={{ fontFamily: FONTS.display, fontSize: 20, color: COLORS.white, marginBottom: 20 }}>
          📄 Submit Your Bid
        </div>
        {[
          { label: 'Bid Amount', value: 'KES 2,450,000' },
          { label: 'Duration', value: '45 working days' },
          { label: 'Technical Approach', value: 'Reinforced concrete drainage...' },
        ].map((field, i) => (
          <div key={i} style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.muted, marginBottom: 4 }}>{field.label}</div>
            <div style={{
              height: 40, borderRadius: 10, background: COLORS.darkSurface,
              border: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center',
              padding: '0 14px', fontFamily: FONTS.body, fontSize: 14, color: COLORS.white,
            }}>
              {field.value}
            </div>
          </div>
        ))}
      </div>

      {/* Scoring breakdown */}
      <div style={{
        width: 420, borderRadius: 20, padding: 32,
        background: COLORS.darkCard, border: `1px solid ${COLORS.gold}30`,
      }}>
        <div style={{ fontFamily: FONTS.display, fontSize: 20, color: COLORS.white, marginBottom: 24 }}>
          📊 Bid Scoring Matrix
        </div>
        {scores.map((score, i) => (
          <div key={i} style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.muted }}>{score.label}</span>
              <span style={{ fontFamily: FONTS.display, fontSize: 14, color: score.color, fontWeight: 700 }}>
                {Math.round(score.value * scoreFill / 100)}%
              </span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: COLORS.darkSurface }}>
              <div style={{
                height: '100%', borderRadius: 3,
                width: `${score.value * scoreFill / 100}%`,
                background: score.color,
              }} />
            </div>
          </div>
        ))}
        <div style={{
          marginTop: 12, padding: '10px 16px', borderRadius: 10,
          background: `${COLORS.primary}15`, border: `1px solid ${COLORS.primary}30`,
          fontFamily: FONTS.body, fontSize: 13, color: COLORS.primaryLight,
        }}>
          Total Score: <strong>{Math.round(88.5 * scoreFill / 100)}/100</strong>
        </div>
      </div>
    </div>
  );
};

const WorkforceMockup: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const appear = spring({ frame, fps, config: { damping: 20 } });

  const workers = [
    { name: 'John Kamau', skill: 'Mason', rate: 'KES 1,500/day', status: 'Active' },
    { name: 'Mary Wanjiku', skill: 'Plumber', rate: 'KES 1,800/day', status: 'Active' },
    { name: 'Peter Odhiambo', skill: 'Electrician', rate: 'KES 2,000/day', status: 'Active' },
    { name: 'Grace Akinyi', skill: 'Labourer', rate: 'KES 1,200/day', status: 'Active' },
  ];

  return (
    <div style={{ display: 'flex', gap: 40, opacity: interpolate(appear, [0, 1], [0, 1]) }}>
      {/* Worker list */}
      <div style={{
        flex: 1, borderRadius: 20, padding: 32,
        background: COLORS.darkCard, border: `1px solid ${COLORS.border}`,
      }}>
        <div style={{ fontFamily: FONTS.display, fontSize: 20, color: COLORS.white, marginBottom: 20 }}>
          👷 Workforce Management
        </div>
        {workers.map((w, i) => {
          const rowAppear = spring({ frame: frame - i * 6, fps, config: { damping: 20 } });
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12,
              padding: '10px 14px', borderRadius: 12,
              background: COLORS.darkSurface, border: `1px solid ${COLORS.border}`,
              opacity: interpolate(rowAppear, [0, 1], [0, 1]),
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 18,
                background: `${COLORS.primary}20`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16,
              }}>
                👤
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.white }}>{w.name}</div>
                <div style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.muted }}>{w.skill} · {w.rate}</div>
              </div>
              <div style={{
                width: 18, height: 18, borderRadius: 4, border: `2px solid ${COLORS.primary}`,
                background: `${COLORS.primary}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, color: 'white',
              }}>
                ✓
              </div>
            </div>
          );
        })}
      </div>

      {/* Bulk payment */}
      <div style={{
        width: 380, borderRadius: 20, padding: 32,
        background: `${COLORS.gold}08`, border: `1px solid ${COLORS.gold}30`,
      }}>
        <div style={{ fontSize: 36, marginBottom: 16 }}>💰</div>
        <div style={{ fontFamily: FONTS.display, fontSize: 22, color: COLORS.white, marginBottom: 12 }}>
          Bulk Payment
        </div>
        <div style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.muted, lineHeight: 1.6, marginBottom: 20 }}>
          Pay all selected workers at once from the project escrow. No need to process individually.
        </div>
        <div style={{
          padding: '14px 20px', borderRadius: 12,
          background: `${COLORS.gold}20`, border: `1px solid ${COLORS.gold}40`,
          fontFamily: FONTS.display, fontSize: 15, color: COLORS.gold,
          textAlign: 'center', fontWeight: 600,
        }}>
          Pay 4 Workers — KES 6,500 →
        </div>
        <div style={{
          marginTop: 12, fontFamily: FONTS.body, fontSize: 12, color: COLORS.muted, textAlign: 'center',
        }}>
          Demo Mode · All payments simulated
        </div>
      </div>
    </div>
  );
};
