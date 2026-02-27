interface Props {
  className?: string
}

/**
 * François shield logo — SVG recreation of the heraldic shield:
 * tricolor border (red / white / French-blue), navy coat lapels, amber jabot.
 */
export function LogoIcon({ className }: Props) {
  return (
    <svg
      viewBox="0 0 100 106"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="FrancoisAI"
    >
      {/* ── Shield border layers ─────────────────────────────── */}

      {/* Red outer */}
      <path
        d="M50 2C31 2 3 11 3 35v37C3 93 50 105 50 105s47-12 47-33V35C97 11 69 2 50 2z"
        fill="#C8382E"
      />
      {/* White gap */}
      <path
        d="M50 6.5C32 6.5 7.5 15 7.5 35v37C7.5 91 50 102 50 102s42.5-11 42.5-30V35C92.5 15 68 6.5 50 6.5z"
        fill="#F8F5EE"
      />
      {/* French-blue ring */}
      <path
        d="M50 11C33 11 12 18.5 12 36v36C12 88 50 99 50 99s38-11 38-27V36C88 18.5 67 11 50 11z"
        fill="#3361A8"
      />
      {/* White interior */}
      <path
        d="M50 15.5C34 15.5 16.5 22.5 16.5 37v35C16.5 85 50 96 50 96s33.5-11 33.5-24V37C83.5 22.5 66 15.5 50 15.5z"
        fill="white"
      />

      {/* ── Coat lapels (French blue) ─────────────────────────── */}

      {/* Left lapel */}
      <path
        d="M16.5 37v35C16.5 85 50 96 50 96V27C41 21 16.5 37 16.5 37z"
        fill="#3361A8"
      />
      {/* Right lapel */}
      <path
        d="M83.5 37v35C83.5 85 50 96 50 96V27C59 21 83.5 37 83.5 37z"
        fill="#3361A8"
      />

      {/* ── White shirt V ─────────────────────────────────────── */}
      <path d="M50 27L41 53 50 80 59 53z" fill="white" />

      {/* ── Jabot ─────────────────────────────────────────────── */}

      {/* Left wing */}
      <path
        d="M44 32C42 27 33 27 30 35c3 5 14 4 14 4z"
        fill="#D4813A"
        stroke="#7a3a0a"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
      {/* Right wing */}
      <path
        d="M56 32C58 27 67 27 70 35c-3 5-14 4-14 4z"
        fill="#D4813A"
        stroke="#7a3a0a"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
      {/* Centre knot */}
      <ellipse
        cx="50" cy="35.5"
        rx="7.5" ry="6.5"
        fill="#D4813A"
        stroke="#7a3a0a"
        strokeWidth="0.7"
      />
      {/* Knot crease details */}
      <path
        d="M44.5 33.5C46.5 35 50 36 50 36s3.5-1 5.5-2.5"
        stroke="#7a3a0a" strokeWidth="0.7" fill="none" strokeLinecap="round"
      />
      <line x1="50" y1="38" x2="50" y2="41" stroke="#7a3a0a" strokeWidth="0.8" strokeLinecap="round" />

      {/* Tier 1 — widest */}
      <path
        d="M43 41Q39 52 44.5 56h11Q61 52 57 41z"
        fill="#D4813A" stroke="#7a3a0a" strokeWidth="0.55"
      />
      <path d="M44 41Q50 45.5 56 41" stroke="#7a3a0a" strokeWidth="0.4" fill="none" strokeLinecap="round" />

      {/* Tier 2 */}
      <path
        d="M44.5 55Q41.5 65 46.5 69h7Q59 65 55.5 55z"
        fill="#D4813A" stroke="#7a3a0a" strokeWidth="0.55"
      />
      <path d="M45.5 55Q50 59 54.5 55" stroke="#7a3a0a" strokeWidth="0.4" fill="none" strokeLinecap="round" />

      {/* Tier 3 */}
      <path
        d="M46 68Q43.5 77 48.5 81h3Q54.5 77 54 68z"
        fill="#D4813A" stroke="#7a3a0a" strokeWidth="0.55"
      />

      {/* Tier 4 — narrowest */}
      <path
        d="M47.5 80Q45.5 88 50 90Q54.5 88 52.5 80z"
        fill="#D4813A" stroke="#7a3a0a" strokeWidth="0.55"
      />
    </svg>
  )
}
