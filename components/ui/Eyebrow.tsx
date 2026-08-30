import type { ReactNode } from "react";

/**
 * Eyebrow — the section label, in a frosted pill.
 *
 * Deliberately NOT a <Glass> panel. These sit on the white sections,
 * where a refracting panel has nothing behind it to bend and reads as
 * nothing — and at this size the spec's zRadius would swallow the whole
 * surface anyway. The frost here is plain CSS: a wash of ink, a
 * hairline, and a blur of whatever passes underneath. Styled from
 * `.eyebrow` in globals.css so the recipe lives in one place.
 */
export function Eyebrow({
  children,
  onBoard = false,
  className,
}: {
  children: ReactNode;
  /** Invert for the dark board — a wash of paper instead of ink. */
  onBoard?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`eyebrow${onBoard ? " eyebrow-board" : ""}${
        className ? ` ${className}` : ""
      }`}
    >
      {children}
    </span>
  );
}
