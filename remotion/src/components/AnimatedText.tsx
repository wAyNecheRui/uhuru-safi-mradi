import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../theme";

interface AnimatedTextProps {
  text: string;
  delay?: number;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  fontWeight?: number;
  maxWidth?: number;
  textAlign?: 'left' | 'center' | 'right';
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text, delay = 0, fontSize = 48, color = COLORS.white,
  fontFamily = FONTS.display, fontWeight = 700, maxWidth, textAlign = 'left',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const appear = spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: 180 } });
  const y = interpolate(appear, [0, 1], [40, 0]);
  const opacity = interpolate(appear, [0, 1], [0, 1]);

  return (
    <div style={{
      fontSize, color, fontFamily, fontWeight, textAlign,
      transform: `translateY(${y}px)`,
      opacity,
      maxWidth: maxWidth || 'auto',
      lineHeight: 1.3,
    }}>
      {text}
    </div>
  );
};
