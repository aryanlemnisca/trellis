/**
 * Footer — the oversized wordmark closing the page.
 * The mark is clipped to the section, so it reads as a plate the page
 * ends on rather than a line of text.
 */
export function Footer() {
  return (
    <footer className="relative overflow-hidden px-6 pb-10 pt-24 sm:px-10 lg:px-14 xl:px-20">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-wrap items-end justify-center gap-x-5">
          <span className="text-[clamp(4rem,17vw,15rem)] font-semibold leading-[0.78] tracking-[-0.045em] text-ink">
            TRELLIS
          </span>
          <span className="flex items-baseline gap-3 pb-2">
            <span className="text-[clamp(0.875rem,1.4vw,1.375rem)] text-ink-500">
              by
            </span>
            <span className="text-[clamp(1.75rem,5vw,4.25rem)] font-medium leading-none tracking-[-0.03em] text-ink">
              Lemnisca
            </span>
          </span>
        </div>
      </div>
    </footer>
  );
}
