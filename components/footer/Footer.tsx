/**
 * Footer — the oversized wordmark closing the page.
 * The mark is clipped to the section, so it reads as a plate the page
 * ends on rather than a line of text.
 */
export function Footer() {
  return (
    <footer className="relative overflow-hidden px-6 pb-10 pt-16 sm:px-10 lg:px-14 xl:px-20">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-8 border-b border-ink-300 pb-10">
          <div className="flex flex-col gap-2">
            <span className="text-[0.6875rem] font-medium uppercase tracking-[0.3em] text-ink-500">
              Get in touch
            </span>
            <a
              href="mailto:shilpa@lemnisca.bio"
              className="text-lg font-medium text-ink transition-opacity duration-150 ease-in hover:opacity-70"
            >
              shilpa@lemnisca.bio
            </a>
            <span className="text-sm text-ink-500">
              Shilpa Nargund · Co-founder &amp; CTO
            </span>
          </div>

          <div className="flex flex-col gap-2 text-sm text-ink-500">
            <span className="text-[0.6875rem] font-medium uppercase tracking-[0.3em] text-ink-500">
              Built by
            </span>
            <span className="text-ink-700">
              Gaurav Deshmukh · Anmol Goel · Shilpa Nargund
            </span>
            <a
              href="https://trellis.lemnisca.bio"
              className="text-ink-700 transition-opacity duration-150 ease-in hover:opacity-70"
            >
              trellis.lemnisca.bio
            </a>
          </div>
        </div>

        <div className="flex flex-wrap items-end justify-center gap-x-5 pt-14">
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
