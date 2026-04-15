import { useCurrentFrame, interpolate, spring, useVideoConfig, Img, staticFile } from 'remotion';

export const ScreenFrame: React.FC<{
  src: string;
  delay?: number;
  scale?: number;
  x?: number;
  y?: number;
}> = ({ src, delay = 0, scale = 0.55, x = 0, y = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: 150 } });
  const scaleVal = interpolate(s, [0, 1], [0.9, scale]);
  const opacity = interpolate(s, [0, 1], [0, 1]);

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${scaleVal})`,
        opacity,
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)',
      }}
    >
      <Img src={staticFile(src)} style={{ display: 'block', width: 1920, height: 1080 }} />
    </div>
  );
};
