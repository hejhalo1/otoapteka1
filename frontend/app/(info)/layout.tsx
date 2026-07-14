export default function InfoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <article className="rounded-2xl border bg-surface p-6 shadow-[var(--shadow-card)] sm:p-8 [&_h1]:text-2xl [&_h1]:font-extrabold [&_h1]:text-ink [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-ink [&_p]:mt-3 [&_p]:text-ink-soft [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-ink-soft [&_li]:mt-1">
      {children}
      </article>
    </div>
  );
}
