import { AbsoluteFill, useCurrentFrame, spring, interpolate, useVideoConfig, Sequence } from "remotion";
import { COLORS, FONTS } from "../theme";
import { AnimatedText } from "../components/AnimatedText";
import { SectionLabel } from "../components/SectionLabel";
import { StepIndicator } from "../components/StepIndicator";

const reportSteps = ['Title & Category', 'Location', 'Camera Evidence', 'Submit'];

export const CitizenReportScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Progress through steps based on frame
  const activeStep = frame < 50 ? 0 : frame < 90 ? 1 : frame < 140 ? 2 : 3;

  return (
    <AbsoluteFill style={{ padding: '60px 100px' }}>
      <SectionLabel label="Citizen Workflow" />
      <AnimatedText text="Report Infrastructure Issues" fontSize={48} delay={5} />

      <StepIndicator steps={reportSteps} activeStep={activeStep} x={0} y={160} />

      {/* Step content area */}
      <div style={{ position: 'absolute', top: 220, left: 100, right: 100, bottom: 80 }}>
        {/* Step 1: Title & Category */}
        <Sequence from={0} durationInFrames={50}>
          <FormMockup frame={frame} fps={fps} />
        </Sequence>

        {/* Step 2: Location Selector */}
        <Sequence from={50} durationInFrames={40}>
          <LocationMockup frame={frame - 50} fps={fps} />
        </Sequence>

        {/* Step 3: Camera */}
        <Sequence from={90} durationInFrames={50}>
          <CameraMockup frame={frame - 90} fps={fps} />
        </Sequence>

        {/* Step 4: Submit + Duplicate Detection */}
        <Sequence from={140} durationInFrames={70}>
          <SubmitMockup frame={frame - 140} fps={fps} />
        </Sequence>
      </div>
    </AbsoluteFill>
  );
};

const FormMockup: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const appear = spring({ frame, fps, config: { damping: 20 } });
  const opacity = interpolate(appear, [0, 1], [0, 1]);

  return (
    <div style={{ display: 'flex', gap: 40, opacity }}>
      {/* Mock form */}
      <div style={{
        flex: 1, borderRadius: 20, padding: 36,
        background: COLORS.darkCard, border: `1px solid ${COLORS.border}`,
      }}>
        <div style={{ fontFamily: FONTS.display, fontSize: 20, color: COLORS.white, marginBottom: 24 }}>
          📝 Report Details
        </div>
        {/* Title field */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.muted, marginBottom: 6 }}>Title</div>
          <div style={{
            height: 44, borderRadius: 10, background: COLORS.darkSurface, border: `1px solid ${COLORS.border}`,
            display: 'flex', alignItems: 'center', padding: '0 16px',
            fontFamily: FONTS.body, fontSize: 15, color: COLORS.white,
          }}>
            Collapsed drainage on Moi Avenue
          </div>
        </div>
        {/* Category */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.muted, marginBottom: 6 }}>Category</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {['🛣️ Roads', '💧 Water', '⚡ Electricity', '🏗️ Buildings'].map((cat, i) => (
              <div key={i} style={{
                padding: '8px 16px', borderRadius: 10, fontSize: 13,
                fontFamily: FONTS.body,
                background: i === 0 ? `${COLORS.primary}20` : COLORS.darkSurface,
                border: `1px solid ${i === 0 ? COLORS.primary : COLORS.border}`,
                color: i === 0 ? COLORS.primaryLight : COLORS.muted,
                fontWeight: i === 0 ? 600 : 400,
              }}>
                {cat}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Info card */}
      <div style={{
        width: 340, borderRadius: 20, padding: 28,
        background: `linear-gradient(160deg, ${COLORS.primary}15, transparent)`,
        border: `1px solid ${COLORS.primary}25`,
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
        <div style={{ fontFamily: FONTS.display, fontSize: 18, color: COLORS.white, marginBottom: 8 }}>Clear Title = Faster Action</div>
        <div style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.muted, lineHeight: 1.6 }}>
          Describe the specific problem and location. Avoid vague titles.
        </div>
      </div>
    </div>
  );
};

const LocationMockup: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const appear = spring({ frame, fps, config: { damping: 20 } });
  return (
    <div style={{ display: 'flex', gap: 40, opacity: interpolate(appear, [0, 1], [0, 1]) }}>
      <div style={{
        flex: 1, borderRadius: 20, padding: 36,
        background: COLORS.darkCard, border: `1px solid ${COLORS.border}`,
      }}>
        <div style={{ fontFamily: FONTS.display, fontSize: 20, color: COLORS.white, marginBottom: 24 }}>
          📍 IEBC Administrative Location
        </div>
        {/* Cascading dropdowns */}
        {['County → Nairobi', 'Constituency → Westlands', 'Ward → Kangemi'].map((item, i) => {
          const itemAppear = spring({ frame: frame - i * 8, fps, config: { damping: 18 } });
          return (
            <div key={i} style={{
              marginBottom: 16, height: 48, borderRadius: 12,
              background: COLORS.darkSurface, border: `1px solid ${COLORS.primary}40`,
              display: 'flex', alignItems: 'center', padding: '0 18px',
              fontFamily: FONTS.body, fontSize: 15, color: COLORS.white,
              opacity: interpolate(itemAppear, [0, 1], [0, 1]),
              transform: `translateX(${interpolate(itemAppear, [0, 1], [30, 0])}px)`,
            }}>
              {item}
            </div>
          );
        })}

        {/* GPS verification */}
        <div style={{
          marginTop: 16, padding: '12px 18px', borderRadius: 12,
          background: `${COLORS.primary}15`, border: `1px solid ${COLORS.primary}30`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>✅</span>
          <span style={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.primaryLight }}>
            GPS verified: Location matches selection
          </span>
        </div>
      </div>

      {/* Map placeholder */}
      <div style={{
        width: 380, height: 320, borderRadius: 20, overflow: 'hidden',
        background: `linear-gradient(160deg, #1a3a2a, #0d1f17)`,
        border: `1px solid ${COLORS.primary}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        <div style={{ fontSize: 80, opacity: 0.3 }}>🗺️</div>
        <div style={{
          position: 'absolute', bottom: 16, left: 16, right: 16,
          background: 'rgba(0,0,0,0.6)', borderRadius: 10, padding: '8px 14px',
          fontFamily: FONTS.body, fontSize: 12, color: COLORS.muted,
        }}>
          Interactive map with GPS pin
        </div>
      </div>
    </div>
  );
};

const CameraMockup: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const appear = spring({ frame, fps, config: { damping: 20 } });
  const shutterFlash = frame > 25 && frame < 28 ? 0.4 : 0;

  return (
    <div style={{ display: 'flex', gap: 40, opacity: interpolate(appear, [0, 1], [0, 1]) }}>
      {/* Camera viewfinder */}
      <div style={{
        flex: 1, height: 380, borderRadius: 20, overflow: 'hidden',
        background: '#1a1a2e', border: `2px solid ${COLORS.primary}`,
        position: 'relative',
      }}>
        {/* Viewfinder grid */}
        <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr 1fr 1fr' }}>
          {Array(9).fill(0).map((_, i) => (
            <div key={i} style={{ border: '0.5px solid rgba(255,255,255,0.1)' }} />
          ))}
        </div>

        {/* Shutter flash */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `rgba(255,255,255,${shutterFlash})`,
        }} />

        {/* Camera label */}
        <div style={{
          position: 'absolute', top: 16, left: 16, display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(0,0,0,0.6)', borderRadius: 8, padding: '6px 14px',
        }}>
          <div style={{ width: 8, height: 8, borderRadius: 4, background: '#ef4444' }} />
          <span style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.white }}>📸 In-App Camera</span>
        </div>

        {/* Bottom bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 70,
          background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 28,
            border: '3px solid white', background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 22, background: 'white' }} />
          </div>
        </div>

        {/* GPS tag */}
        <div style={{
          position: 'absolute', bottom: 80, left: 16,
          background: 'rgba(0,0,0,0.6)', borderRadius: 8, padding: '4px 10px',
          fontFamily: FONTS.body, fontSize: 11, color: COLORS.primaryLight,
        }}>
          📍 -1.2921, 36.8219 · GPS Tagged
        </div>
      </div>

      {/* Photo evidence panel */}
      <div style={{
        width: 340, borderRadius: 20, padding: 28,
        background: COLORS.darkCard, border: `1px solid ${COLORS.border}`,
      }}>
        <div style={{ fontFamily: FONTS.display, fontSize: 18, color: COLORS.white, marginBottom: 16 }}>
          📸 Evidence Captured
        </div>
        {['Photo 1 — GPS verified', 'Photo 2 — GPS verified', 'Photo 3 — Uploading...'].map((p, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
            padding: '10px 14px', borderRadius: 10,
            background: COLORS.darkSurface, border: `1px solid ${COLORS.border}`,
          }}>
            <span style={{ fontSize: 14 }}>{i < 2 ? '✅' : '⏳'}</span>
            <span style={{ fontFamily: FONTS.body, fontSize: 13, color: i < 2 ? COLORS.white : COLORS.muted }}>
              {p}
            </span>
          </div>
        ))}
        <div style={{
          marginTop: 16, padding: '10px 14px', borderRadius: 10,
          background: `${COLORS.gold}15`, border: `1px solid ${COLORS.gold}30`,
          fontFamily: FONTS.body, fontSize: 12, color: COLORS.gold,
        }}>
          💡 GPS-tagged photos create verifiable evidence
        </div>
      </div>
    </div>
  );
};

const SubmitMockup: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const appear = spring({ frame, fps, config: { damping: 20 } });
  const duplicateAppear = spring({ frame: frame - 20, fps, config: { damping: 18 } });

  return (
    <div style={{ display: 'flex', gap: 40, opacity: interpolate(appear, [0, 1], [0, 1]) }}>
      {/* Submit panel */}
      <div style={{
        flex: 1, borderRadius: 20, padding: 36,
        background: COLORS.darkCard, border: `1px solid ${COLORS.border}`,
      }}>
        <div style={{ fontFamily: FONTS.display, fontSize: 20, color: COLORS.white, marginBottom: 20 }}>
          ✅ Ready to Submit
        </div>
        <div style={{
          padding: '14px 20px', borderRadius: 12,
          background: `${COLORS.primary}20`, border: `1px solid ${COLORS.primary}40`,
          fontFamily: FONTS.body, fontSize: 15, color: COLORS.primaryLight,
          textAlign: 'center', fontWeight: 600,
        }}>
          Submit Report →
        </div>
        <div style={{
          marginTop: 16, fontFamily: FONTS.body, fontSize: 13, color: COLORS.muted, lineHeight: 1.6,
        }}>
          Your report will be visible to your community for validation and voting.
        </div>
      </div>

      {/* Duplicate detection */}
      <div style={{
        width: 400, borderRadius: 20, padding: 28,
        background: `${COLORS.gold}08`, border: `1px solid ${COLORS.gold}30`,
        opacity: interpolate(duplicateAppear, [0, 1], [0, 1]),
        transform: `translateY(${interpolate(duplicateAppear, [0, 1], [20, 0])}px)`,
      }}>
        <div style={{ fontFamily: FONTS.display, fontSize: 18, color: COLORS.gold, marginBottom: 12 }}>
          ⚠️ Similar Report Detected
        </div>
        <div style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.muted, lineHeight: 1.6, marginBottom: 16 }}>
          A similar report exists 200m from your location. Consider voting on it instead to help prioritize it faster.
        </div>
        <div style={{
          padding: '10px 16px', borderRadius: 10,
          background: COLORS.darkSurface, border: `1px solid ${COLORS.border}`,
          fontFamily: FONTS.body, fontSize: 13, color: COLORS.white,
        }}>
          "Broken drainage near Moi Avenue" — 12 votes
        </div>
      </div>
    </div>
  );
};
