import React from "react";

const Globe: React.FC = () => {
  return (
    <>
      <style>
        {`
          @keyframes earthRotate {
            0% { background-position: 0 0; }
            100% { background-position: 400px 0; }
          }
          @keyframes twinkling { 0%,100% { opacity:0.1; } 50% { opacity:1; } }
          @keyframes twinkling-slow { 0%,100% { opacity:0.1; } 50% { opacity:1; } }
          @keyframes twinkling-long { 0%,100% { opacity:0.1; } 50% { opacity:1; } }
          @keyframes twinkling-fast { 0%,100% { opacity:0.1; } 50% { opacity:1; } }
        `}
      </style>
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="relative w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] lg:w-[400px] lg:h-[400px]">
          {/* Stars */}
          <div className="absolute w-1 h-1 rounded-full bg-white" style={{ top: '10%', left: '5%', animation: 'twinkling 3s infinite' }} />
          <div className="absolute w-0.5 h-0.5 rounded-full bg-white" style={{ top: '20%', left: '85%', animation: 'twinkling-slow 5s infinite' }} />
          <div className="absolute w-1 h-1 rounded-full bg-white" style={{ top: '70%', left: '15%', animation: 'twinkling-long 7s infinite' }} />
          <div className="absolute w-0.5 h-0.5 rounded-full bg-white" style={{ top: '80%', left: '90%', animation: 'twinkling-fast 2s infinite' }} />
          <div className="absolute w-1 h-1 rounded-full bg-white" style={{ top: '40%', left: '95%', animation: 'twinkling 4s infinite 1s' }} />
          <div className="absolute w-0.5 h-0.5 rounded-full bg-white" style={{ top: '60%', left: '3%', animation: 'twinkling-slow 6s infinite 2s' }} />
          <div className="absolute w-1.5 h-1.5 rounded-full bg-white/80" style={{ top: '15%', left: '50%', animation: 'twinkling-long 8s infinite 0.5s' }} />

          {/* Globe sphere */}
          <div
            className="w-full h-full rounded-full overflow-hidden relative"
            style={{
              background: 'radial-gradient(circle at 35% 35%, #1a6b3c 0%, #0d4f2b 25%, #063d1f 50%, #042e17 75%, #021f0f 100%)',
              boxShadow: '0 0 60px rgba(16, 185, 129, 0.3), 0 0 120px rgba(16, 185, 129, 0.1), inset -20px -20px 60px rgba(0,0,0,0.6)',
            }}
          >
            {/* Continent-like patterns */}
            <div
              className="absolute inset-0 rounded-full opacity-30"
              style={{
                background: `
                  radial-gradient(ellipse 40% 30% at 30% 40%, rgba(34, 197, 94, 0.4) 0%, transparent 70%),
                  radial-gradient(ellipse 25% 35% at 65% 55%, rgba(34, 197, 94, 0.3) 0%, transparent 70%),
                  radial-gradient(ellipse 30% 20% at 50% 25%, rgba(34, 197, 94, 0.35) 0%, transparent 70%),
                  radial-gradient(ellipse 20% 25% at 75% 35%, rgba(34, 197, 94, 0.25) 0%, transparent 70%)
                `,
                animation: 'earthRotate 30s linear infinite',
              }}
            />
            {/* Grid lines */}
            <div
              className="absolute inset-0 rounded-full opacity-10"
              style={{
                background: `
                  repeating-linear-gradient(0deg, transparent, transparent 18%, rgba(255,255,255,0.1) 18%, rgba(255,255,255,0.1) 18.5%),
                  repeating-linear-gradient(90deg, transparent, transparent 18%, rgba(255,255,255,0.1) 18%, rgba(255,255,255,0.1) 18.5%)
                `,
              }}
            />
            {/* Highlight */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15) 0%, transparent 50%)',
              }}
            />
            {/* Atmosphere glow */}
            <div
              className="absolute -inset-2 rounded-full"
              style={{
                background: 'radial-gradient(circle, transparent 45%, rgba(16, 185, 129, 0.08) 55%, rgba(16, 185, 129, 0.15) 65%, transparent 75%)',
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Globe;
