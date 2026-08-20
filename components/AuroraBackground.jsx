// components/AuroraBackground.jsx
export default function AuroraBackground() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: "#050308",
        zIndex: 0,
      }}
    >
      <div className="aurora-blob blob-1" />
      <div className="aurora-blob blob-2" />
      <div className="aurora-blob blob-3" />

      <style jsx>{`
        .aurora-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          opacity: 0.65;
          mix-blend-mode: screen;
          will-change: transform;
        }
        .blob-1 {
          width: 60vw;
          height: 60vw;
          top: -15%;
          left: -10%;
          background: radial-gradient(circle, #a855f7 0%, transparent 70%);
          animation: drift1 22s ease-in-out infinite;
        }
        .blob-2 {
          width: 55vw;
          height: 55vw;
          bottom: -20%;
          right: -10%;
          background: radial-gradient(circle, #7c3aed 0%, transparent 70%);
          animation: drift2 26s ease-in-out infinite;
        }
        .blob-3 {
          width: 40vw;
          height: 40vw;
          top: 30%;
          left: 35%;
          background: radial-gradient(circle, #c084fc 0%, transparent 70%);
          animation: drift3 18s ease-in-out infinite;
        }
        @keyframes drift1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(8vw, 6vh) scale(1.15); }
        }
        @keyframes drift2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-6vw, -8vh) scale(1.1); }
        }
        @keyframes drift3 {
          0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
          50% { transform: translate(-40%, -55%) rotate(20deg); }
        }
      `}</style>
    </div>
  );
}