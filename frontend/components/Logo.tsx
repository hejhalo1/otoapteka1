import { cn } from "@/lib/utils";

/** Logo: zielony pin lokalizacji z aptecznym krzyżem. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 48"
      className={cn("h-9 w-auto", className)}
      aria-hidden
      fill="none"
    >
      {/* Uwaga: w atrybutach SVG nie działa var(--...) — kolory na sztywno. */}
      <path
        d="M20 1C9.5 1 1 9.4 1 19.8 1 32.4 20 47 20 47s19-14.6 19-27.2C39 9.4 30.5 1 20 1z"
        fill="#279c53"
      />
      <path
        d="M20 1C9.5 1 1 9.4 1 19.8 1 32.4 20 47 20 47s19-14.6 19-27.2C39 9.4 30.5 1 20 1z"
        fill="url(#lg)"
        fillOpacity="0.25"
      />
      <rect x="16.4" y="10" width="7.2" height="19" rx="2.2" fill="white" />
      <rect x="10.5" y="15.9" width="19" height="7.2" rx="2.2" fill="white" />
      <defs>
        <linearGradient id="lg" x1="20" y1="1" x2="20" y2="47">
          <stop stopColor="white" stopOpacity="0.5" />
          <stop offset="0.6" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("text-xl font-extrabold tracking-tight text-ink", className)}>
      oto<span className="text-pharma">apteka</span>
      <span className="text-muted">.pl</span>
    </span>
  );
}
