/**
 * One small line-art icon per loop stage, keyed by name. Borrowed from
 * the Trellis poster/brochure's loop diagram, redrawn as plain stroke
 * paths so they stay inside the board's monochrome palette — no fill,
 * `currentColor`, same weight as the connector lines.
 */

const ICON_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Frame() {
  return (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="12" r="6.5" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <path d="M12 2v3.4M12 18.6V22M2 12h3.4M18.6 12H22" />
    </svg>
  );
}

function Design() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M9.5 2.5h5" />
      <path d="M10.2 2.5v5.4l-5 10.2a2 2 0 0 0 1.8 2.9h10a2 2 0 0 0 1.8-2.9l-5-10.2V2.5" />
      <path d="M7.4 15h9.2" />
    </svg>
  );
}

function Integrate() {
  return (
    <svg {...ICON_PROPS}>
      <ellipse cx="12" cy="5.5" rx="7" ry="2.6" />
      <path d="M5 5.5v13c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6v-13" />
      <path d="M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6" />
    </svg>
  );
}

function Model() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M3 20h18" />
      <path d="M4 16l5-5.5 4 3 7-8" />
      <circle cx="4" cy="16" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="10.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="13" cy="13.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="20" cy="5.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function Optimize() {
  return (
    <svg {...ICON_PROPS}>
      <circle cx="10.3" cy="10.3" r="6.3" />
      <circle cx="10.3" cy="10.3" r="2.1" />
      <path d="M14.9 14.9L21 21" />
    </svg>
  );
}

function Learn() {
  return (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="7.5" r="3.2" />
      <path d="M5 21c0-4.4 3.1-7 7-7s7 2.6 7 7" />
    </svg>
  );
}

export const LOOP_ICONS: Record<string, () => React.ReactNode> = {
  Frame,
  Design,
  Integrate,
  Model,
  Optimize,
  Learn,
};
