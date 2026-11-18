
"use client";

import { useEffect, useState } from "react";

export default function SplashScreen({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showSplash, setShowSplash] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 2300);

    const hideTimer = setTimeout(() => {
      setShowSplash(false);
    }, 2800);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <>
      {children}

      {showSplash && (
        <div className={`splash-screen ${fadeOut ? "splash-hide" : ""}`}>
          <div className="splash-content">

            <div className="food-icons">
              <span className="food food-one">🍟</span>
              <span className="food food-two">🥤</span>
              <span className="food food-three">🍿</span>
              <span className="food food-four">🍪</span>
            </div>

            <div className="noodle-bowl">
              <div className="steam steam-one" />
              <div className="steam steam-two" />
              <div className="steam steam-three" />
              🍜
            </div>

            <h1 className="splash-logo">
              Hostel<span>Hub</span>
            </h1>

            <p className="splash-tagline">
              YOUR CRAVINGS, OUR MISSION.
            </p>

            <div className="loading-track">
              <div className="loading-progress" />
            </div>

            <p className="loading-text">
              Preparing your snack experience...
            </p>

          </div>
        </div>
      )}

      <style jsx global>{`
        .splash-screen {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #111111;
          color: white;
          transition: opacity 0.5s ease, visibility 0.5s ease;
        }

        .splash-hide {
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
        }

        .splash-content {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 30px;
        }

        .noodle-bowl {
          position: relative;
          font-size: 100px;
          animation: bowlBounce 0.8s ease-in-out infinite alternate;
        }

        .steam {
          position: absolute;
          top: -12px;
          width: 8px;
          height: 30px;
          border-radius: 50%;
          border-left: 3px solid #f5b83d;
          opacity: 0;
          animation: steamRise 1.5s ease-in-out infinite;
        }

        .steam-one { left: 38%; }
        .steam-two { left: 50%; animation-delay: 0.4s; }
        .steam-three { left: 62%; animation-delay: 0.8s; }

        .splash-logo {
          margin-top: 18px;
          font-size: 42px;
          font-weight: 800;
          letter-spacing: -2px;
          animation: logoReveal 0.8s ease both;
        }

        .splash-logo span {
          color: #f5b83d;
        }

        .splash-tagline {
          margin-top: 8px;
          color: #c9b99c;
          font-size: 11px;
          letter-spacing: 3px;
          animation: logoReveal 1s ease both;
        }

        .food-icons {
          position: absolute;
          inset: -45px -110px;
          pointer-events: none;
        }

        .food {
          position: absolute;
          font-size: 35px;
          animation: foodFloat 2s ease-in-out infinite alternate;
        }

        .food-one { top: 15%; left: 0; }
        .food-two { top: 10%; right: 0; animation-delay: 0.3s; }
        .food-three { bottom: 10%; left: 5%; animation-delay: 0.6s; }
        .food-four { bottom: 5%; right: 5%; animation-delay: 0.9s; }

        .loading-track {
          width: 220px;
          height: 5px;
          margin-top: 35px;
          overflow: hidden;
          border-radius: 20px;
          background: #39332a;
        }

        .loading-progress {
          width: 0;
          height: 100%;
          border-radius: 20px;
          background: #f5b83d;
          animation: loading 2.3s ease forwards;
        }

        .loading-text {
          margin-top: 15px;
          color: #aaa096;
          font-size: 12px;
        }

        @keyframes bowlBounce {
          from { transform: translateY(0) rotate(-4deg); }
          to { transform: translateY(-13px) rotate(4deg); }
        }

        @keyframes steamRise {
          0% { transform: translateY(10px); opacity: 0; }
          50% { opacity: 0.8; }
          100% { transform: translateY(-30px); opacity: 0; }
        }

        @keyframes foodFloat {
          from { transform: translateY(8px) rotate(-10deg); }
          to { transform: translateY(-12px) rotate(10deg); }
        }

        @keyframes logoReveal {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes loading {
          from { width: 0; }
          to { width: 100%; }
        }

        @media (max-width: 480px) {
          .noodle-bowl { font-size: 85px; }
          .splash-logo { font-size: 36px; }
          .food-icons { inset: -35px -75px; }
          .food { font-size: 27px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .noodle-bowl, .food, .steam, .splash-logo,
          .splash-tagline, .loading-progress {
            animation: none;
          }
          .loading-progress { width: 100%; }
        }
      `}</style>
    </>
  );
}
