import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Globe from "@/components/ui/globe";
import { cn } from "@/lib/utils";

export interface ScrollGlobeSection {
  id: string;
  badge?: string;
  title: string;
  subtitle?: string;
  description: string;
  align?: 'left' | 'center' | 'right';
  features?: { title: string; description: string }[];
  actions?: { label: string; variant: 'primary' | 'secondary'; onClick?: () => void }[];
}

interface ScrollGlobeProps {
  sections: ScrollGlobeSection[];
  globeConfig?: {
    positions: {
      top: string;
      left: string;
      scale: number;
    }[];
  };
  className?: string;
}

const defaultGlobeConfig = {
  positions: [
    { top: "50%", left: "75%", scale: 1.4 },
    { top: "25%", left: "50%", scale: 0.9 },
    { top: "15%", left: "90%", scale: 2 },
    { top: "50%", left: "50%", scale: 1.8 },
  ]
};

const parsePercent = (str: string): number => parseFloat(str.replace('%', ''));

export function ScrollGlobe({ sections, globeConfig = defaultGlobeConfig, className }: ScrollGlobeProps) {
  const [activeSection, setActiveSection] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [globeTransform, setGlobeTransform] = useState("");
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const animationFrameId = useRef<number>();

  const calculatedPositions = useMemo(() => {
    return globeConfig.positions.map(pos => ({
      top: parsePercent(pos.top),
      left: parsePercent(pos.left),
      scale: pos.scale
    }));
  }, [globeConfig.positions]);

  const updateScrollPosition = useCallback(() => {
    const scrollTop = window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = Math.min(Math.max(scrollTop / docHeight, 0), 1);

    setScrollProgress(progress);

    const viewportCenter = window.innerHeight / 2;
    let newActiveSection = 0;
    let minDistance = Infinity;

    sectionRefs.current.forEach((ref, index) => {
      if (ref) {
        const rect = ref.getBoundingClientRect();
        const sectionCenter = rect.top + rect.height / 2;
        const distance = Math.abs(sectionCenter - viewportCenter);

        if (distance < minDistance) {
          minDistance = distance;
          newActiveSection = index;
        }
      }
    });

    const currentPos = calculatedPositions[newActiveSection];
    if (currentPos) {
      const transform = `translate3d(${currentPos.left}vw, ${currentPos.top}vh, 0) translate3d(-50%, -50%, 0) scale3d(${currentPos.scale}, ${currentPos.scale}, 1)`;
      setGlobeTransform(transform);
    }

    setActiveSection(newActiveSection);
  }, [calculatedPositions]);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        animationFrameId.current = requestAnimationFrame(() => {
          updateScrollPosition();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    updateScrollPosition();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [updateScrollPosition]);

  useEffect(() => {
    const initialPos = calculatedPositions[0];
    if (initialPos) {
      const initialTransform = `translate3d(${initialPos.left}vw, ${initialPos.top}vh, 0) translate3d(-50%, -50%, 0) scale3d(${initialPos.scale}, ${initialPos.scale}, 1)`;
      setGlobeTransform(initialTransform);
    }
  }, [calculatedPositions]);

  return (
    <div ref={undefined} className={cn("relative bg-[#030712] text-white overflow-x-hidden", className)}>
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 z-50 bg-black/20 backdrop-blur-sm">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-amber-400 transition-none"
          style={{ width: `${scrollProgress * 100}%` }}
        />
      </div>

      {/* Navigation dots */}
      <div className="fixed right-3 sm:right-4 lg:right-8 top-1/2 -translate-y-1/2 z-50">
        <div className="flex flex-col items-end gap-4 sm:gap-5 lg:gap-6">
          {sections.map((section, index) => (
            <div key={section.id} className="flex items-center gap-2 sm:gap-3 group">
              <div className={cn(
                "transition-all duration-500 pointer-events-none",
                activeSection === index ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
              )}>
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md rounded-full px-2 py-0.5 sm:px-3 sm:py-1 border border-white/10">
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] sm:text-xs font-medium text-white/90 whitespace-nowrap">
                    {section.badge || `Section ${index + 1}`}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  sectionRefs.current[index]?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                  });
                }}
                className={cn(
                  "relative w-2 h-2 sm:w-2.5 sm:h-2.5 lg:w-3 lg:h-3 rounded-full border-2 transition-all duration-300 hover:scale-125",
                  "before:absolute before:inset-0 before:rounded-full before:transition-all before:duration-300",
                  activeSection === index
                    ? "bg-emerald-400 border-emerald-400 shadow-lg shadow-emerald-400/30 before:animate-ping before:bg-emerald-400/20"
                    : "bg-transparent border-white/40 hover:border-emerald-400/60 hover:bg-emerald-400/10"
                )}
                aria-label={`Go to ${section.badge || `section ${index + 1}`}`}
              />
            </div>
          ))}
        </div>

        <div className="absolute top-0 bottom-0 right-[4px] sm:right-[5px] lg:right-[6px] w-px bg-gradient-to-b from-transparent via-white/20 to-transparent -z-10" />
      </div>

      {/* Globe */}
      <div className="fixed inset-0 z-10 pointer-events-none overflow-hidden">
        <div
          className="absolute w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] lg:w-[600px] lg:h-[600px] opacity-20 sm:opacity-25 lg:opacity-30"
          style={{
            transform: globeTransform,
            transition: 'transform 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            willChange: 'transform',
          }}
        >
          <Globe />
        </div>
      </div>

      {/* Sections */}
      {sections.map((section, index) => (
        <div
          key={section.id}
          ref={(el) => (sectionRefs.current[index] = el)}
          className={cn(
            "relative min-h-screen flex flex-col justify-center px-4 sm:px-6 md:px-8 lg:px-12 z-20 py-12 sm:py-16 lg:py-20",
            "w-full max-w-full overflow-hidden",
            section.align === 'center' && "items-center text-center",
            section.align === 'right' && "items-end text-right",
            section.align !== 'center' && section.align !== 'right' && "items-start text-left"
          )}
        >
          <div className="max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl space-y-4 sm:space-y-6 lg:space-y-8">
            {/* Badge */}
            {section.badge && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-300 text-xs sm:text-sm font-medium tracking-wide uppercase">
                  {section.badge}
                </span>
              </div>
            )}

            {/* Title */}
            <div>
              {section.subtitle ? (
                <div className="space-y-1 sm:space-y-2">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-white">
                    {section.title}
                  </h2>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 via-emerald-300 to-amber-400 bg-clip-text text-transparent">
                    {section.subtitle}
                  </h2>
                </div>
              ) : (
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight text-white">
                  {section.title}
                </h2>
              )}
            </div>

            {/* Description */}
            <div className="space-y-3 sm:space-y-4">
              <p className="text-sm sm:text-base lg:text-lg text-white/60 leading-relaxed max-w-xl">
                {section.description}
              </p>
              {index === 0 && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 text-xs sm:text-sm text-white/40 pt-2">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400/60 animate-pulse" />
                    Interactive Experience
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400/60 animate-pulse" />
                    Scroll to Explore
                  </span>
                </div>
              )}
            </div>

            {/* Features */}
            {section.features && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pt-4 sm:pt-6">
                {section.features.map((feature, featureIndex) => (
                  <div
                    key={featureIndex}
                    className="group p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-emerald-500/30 transition-all duration-300"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0 group-hover:shadow-lg group-hover:shadow-emerald-400/30 transition-shadow" />
                      <div>
                        <h4 className="text-white font-semibold text-sm sm:text-base mb-1">{feature.title}</h4>
                        <p className="text-white/50 text-xs sm:text-sm leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            {section.actions && (
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6">
                {section.actions.map((action, actionIndex) => (
                  <button
                    key={actionIndex}
                    onClick={action.onClick}
                    className={cn(
                      "relative px-5 py-2.5 sm:px-7 sm:py-3 rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 overflow-hidden",
                      action.variant === 'primary'
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-500 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-105"
                        : "bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:border-white/30 backdrop-blur-sm hover:scale-105"
                    )}
                  >
                    {action.label}
                    {action.variant === 'primary' && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ScrollGlobe;
