import { useTheme } from "../context/ThemeContext"

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="relative flex-shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-400"
    >
      {/* Track */}
      <span
        className="flex items-center w-14 h-7 rounded-full transition-all duration-500 ease-in-out px-0.5"
        style={{
          background: isDark
            ? "linear-gradient(135deg, #09090b 0%, #1e1b4b 100%)"
            : "linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)",
          boxShadow: isDark
            ? "inset 0 1px 3px rgba(0,0,0,0.5), 0 0 0 1px #312e81"
            : "inset 0 1px 3px rgba(0,0,0,0.08), 0 0 0 1px #c4b5fd",
        }}
      >
        {/* Stars (dark mode decoration) */}
        <span
          className="absolute inset-0 rounded-full overflow-hidden pointer-events-none transition-opacity duration-500"
          style={{ opacity: isDark ? 1 : 0 }}
          aria-hidden="true"
        >
          {[
            { top: "25%", left: "18%", size: 1.5 },
            { top: "55%", left: "28%", size: 1 },
            { top: "35%", left: "38%", size: 1 },
          ].map((s, i) => (
            <span
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                top: s.top,
                left: s.left,
                width: s.size,
                height: s.size,
                opacity: 0.7,
                animation: `pulse-soft ${2 + i * 0.7}s ease-in-out infinite`,
                animationDelay: `${i * 0.4}s`,
              }}
            />
          ))}
        </span>

        {/* Thumb */}
        <span
          className="relative flex items-center justify-center w-6 h-6 rounded-full shadow-md transition-all duration-500"
          style={{
            transform: isDark ? "translateX(28px)" : "translateX(0px)",
            transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
            background: isDark
              ? "linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)"
              : "linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)",
            boxShadow: isDark
              ? "0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)"
              : "0 2px 8px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.9)",
          }}
        >
          {/* Sun icon */}
          <span
            className="absolute transition-all duration-400"
            style={{
              opacity: isDark ? 0 : 1,
              transform: isDark ? "scale(0.4) rotate(90deg)" : "scale(1) rotate(0deg)",
              transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            aria-hidden="true"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="4" fill="#fbbf24" stroke="none" />
              {[0,45,90,135,180,225,270,315].map((deg) => (
                <line
                  key={deg}
                  x1={12 + 6.5 * Math.cos(deg * Math.PI / 180)}
                  y1={12 + 6.5 * Math.sin(deg * Math.PI / 180)}
                  x2={12 + 9 * Math.cos(deg * Math.PI / 180)}
                  y2={12 + 9 * Math.sin(deg * Math.PI / 180)}
                  stroke="#d97706"
                  strokeWidth="2"
                />
              ))}
            </svg>
          </span>

          {/* Moon icon */}
          <span
            className="absolute transition-all duration-400"
            style={{
              opacity: isDark ? 1 : 0,
              transform: isDark ? "scale(1) rotate(0deg)" : "scale(0.4) rotate(-90deg)",
              transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            aria-hidden="true"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#c4b5fd" stroke="none">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          </span>
        </span>
      </span>
    </button>
  )
}
