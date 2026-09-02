export default function InfoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <article
        className={[
          "rounded-lg border border-line bg-surface p-6 shadow-[var(--shadow-card)] sm:p-9",
          "[&_h1]:text-3xl [&_h1]:font-black [&_h1]:tracking-tight [&_h1]:text-ink",
          "[&_h2]:mt-9 [&_h2]:border-t [&_h2]:border-line [&_h2]:pt-6 [&_h2]:text-lg [&_h2]:font-black [&_h2]:tracking-tight [&_h2]:text-ink",
          "[&_h3]:mt-5 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-ink",
          "[&_p]:mt-3 [&_p]:leading-relaxed [&_p]:text-ink-soft",
          "[&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul]:marker:text-pharma",
          "[&_li]:pl-1 [&_li]:leading-relaxed [&_li]:text-ink-soft",
          "[&_a]:font-semibold [&_a]:text-pharma [&_a]:underline [&_a]:underline-offset-2",
          "[&_strong]:font-bold [&_strong]:text-ink",
          "[&_.lead]:mt-4 [&_.lead]:text-lg [&_.lead]:text-ink-soft",
          "[&_.updated]:mt-2 [&_.updated]:text-sm [&_.updated]:text-muted",
        ].join(" ")}
      >
        {children}
      </article>
    </div>
  );
}
