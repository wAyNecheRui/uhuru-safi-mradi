import { AbsoluteFill, useCurrentFrame, spring, interpolate, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../theme";
import { AnimatedText } from "../components/AnimatedText";
import { SectionLabel } from "../components/SectionLabel";

export const MapTransparencyScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Floating pins
  const pins = [
    { x: 350, y: 280, label: 'Nairobi', color: COLORS.primary, delay: 15 },
    { x: 280, y: 340, label: 'Mombasa', color: COLORS.gold, delay: 25 },
    { x: 420, y: 230, label: 'Kisumu', color: COLORS.accent, delay: 35 },
    { x: 380, y: 380, label: 'Nakuru', color: COLORS.primaryLight, delay: 45 },
    { x: 320, y: 200, label: 'Eldoret', color: COLORS.gold, delay: 55 },
  ];

  return (
    <AbsoluteFill style={{ padding: '60px 100px' }}>
      <SectionLabel label="Transparency" />
      <AnimatedText text="Full Public Accountability" fontSize={48} delay={5} />

      <div style={{ display: 'flex', gap: 50, marginTop: 40 }}>
        {/* Map area */}
        <div style={{
          flex: 1, height: 450, borderRadius: 24, overflow: 'hidden',
          background: `linear-gradient(160deg, #0d2818, #0a1f14, #071510)`,
          border: `1px solid ${COLORS.primary}25`,
          position: 'relative',
        }}>
          {/* Kenya outline (simplified) */}
          <svg viewBox="0 0 600 600" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <path
              d="M280,120 L340,100 L400,130 L430,180 L450,250 L440,320 L420,380 L380,430 L340,460 L300,450 L260,400 L240,340 L250,280 L260,200 Z"
              fill="none"
              stroke={COLORS.primary}
              strokeWidth="1.5"
              opacity="0.3"
            />
            {/* Grid lines */}
            {[150, 200, 250, 300, 350, 400].map(y => (
              <line key={`h${y}`} x1="200" y1={y} x2="480" y2={y} stroke={COLORS.primary} strokeWidth="0.3" opacity="0.15" />
            ))}
            {[250, 300, 350, 400, 450].map(x => (
              <line key={`v${x}`} x1={x} y1="100" x2={x} y2="470" stroke={COLORS.primary} strokeWidth="0.3" opacity="0.15" />
            ))}
          </svg>

          {/* Animated pins */}
          {pins.map((pin, i) => {
            const pinAppear = spring({ frame: frame - pin.delay, fps, config: { damping: 12 } });
            const pinScale = interpolate(pinAppear, [0, 1], [0, 1]);
            const pulse = 1 + Math.sin((frame - pin.delay) * 0.1) * 0.15;
            return (
              <div key={i} style={{
                position: 'absolute', left: pin.x, top: pin.y,
                transform: `translate(-50%, -50%) scale(${pinScale})`,
              }}>
                <div style={{
                  width: 16 * pulse, height: 16 * pulse, borderRadius: '50%',
                  background: `${pin.color}40`,
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                }} />
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: pin.color, border: '2px solid white',
                  position: 'relative', zIndex: 1,
                }} />
                <div style={{
                  position: 'absolute', top: -24, left: '50%', transform: 'translateX(-50%)',
                  fontFamily: FONTS.body, fontSize: 11, color: COLORS.white,
                  whiteSpace: 'nowrap', background: 'rgba(0,0,0,0.6)',
                  padding: '2px 8px', borderRadius: 4,
                }}>
                  {pin.label}
                </div>
              </div>
            );
          })}

          {/* Legend */}
          <div style={{
            position: 'absolute', bottom: 16, left: 16,
            display: 'flex', gap: 16, background: 'rgba(0,0,0,0.6)',
            borderRadius: 10, padding: '8px 14px',
          }}>
            {[
              { color: COLORS.primary, label: 'Completed' },
              { color: COLORS.gold, label: 'In Progress' },
              { color: COLORS.accent, label: 'Pending' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: item.color }} />
                <span style={{ fontFamily: FONTS.body, fontSize: 11, color: COLORS.muted }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Transparency features */}
        <div style={{ width: 420 }}>
          {[
            { icon: '🌍', title: 'Public Portal', desc: 'Anyone can view projects, budgets, and contractor performance — no login required' },
            { icon: '🔔', title: 'Real-time Notifications', desc: 'Citizens, contractors, and officials get instant updates at every workflow step' },
            { icon: '📶', title: 'Offline Support', desc: 'Works offline — actions queue and sync automatically when back online' },
            { icon: '🔗', title: 'Blockchain Audit', desc: 'Every payment transaction is immutably recorded for full accountability' },
          ].map((feature, i) => {
            const fAppear = spring({ frame: frame - 20 - i * 10, fps, config: { damping: 18 } });
            return (
              <div key={i} style={{
                marginBottom: 14, borderRadius: 16, padding: '18px 22px',
                background: COLORS.darkCard, border: `1px solid ${COLORS.border}`,
                display: 'flex', gap: 14, alignItems: 'flex-start',
                opacity: interpolate(fAppear, [0, 1], [0, 1]),
                transform: `translateX(${interpolate(fAppear, [0, 1], [30, 0])}px)`,
              }}>
                <span style={{ fontSize: 24, flexShrink: 0 }}>{feature.icon}</span>
                <div>
                  <div style={{ fontFamily: FONTS.display, fontSize: 15, color: COLORS.white, fontWeight: 600, marginBottom: 4 }}>
                    {feature.title}
                  </div>
                  <div style={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.muted, lineHeight: 1.5 }}>
                    {feature.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
