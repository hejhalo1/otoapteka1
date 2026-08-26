import { cn } from "@/lib/utils";

/**
 * Logo: pin lokalizacji (odwrócona łezka) z aptecznym krzyżem.
 * - `default`  — niebieski pin, biały krzyż (na jasnym tle).
 * - `onDark`   — biały pin, niebieski krzyż (na niebieskim tle, np. stopka).
 */
export function LogoMark({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "onDark";
}) {
  const onDark = variant === "onDark";
  const pin = onDark ? "#ffffff" : "#0b4f9e";
  const cross = onDark ? "#0b4f9e" : "#ffffff";

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
        fill={pin}
      />
      {!onDark && (
        <path
          d="M20 1C9.5 1 1 9.4 1 19.8 1 32.4 20 47 20 47s19-14.6 19-27.2C39 9.4 30.5 1 20 1z"
          fill="url(#lg)"
          fillOpacity="0.25"
        />
      )}
      <rect x="16.4" y="10" width="7.2" height="19" rx="2.2" fill={cross} />
      <rect x="10.5" y="15.9" width="19" height="7.2" rx="2.2" fill={cross} />
      {!onDark && (
        <defs>
          <linearGradient id="lg" x1="20" y1="1" x2="20" y2="47">
            <stop stopColor="white" stopOpacity="0.5" />
            <stop offset="0.6" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
    </svg>
  );
}

export function Wordmark({
  className,
  tone = "default",
}: {
  className?: string;
  tone?: "default" | "onDark";
}) {
  if (tone === "onDark") {
    return (
      <span className={cn("text-xl font-extrabold tracking-tight text-white", className)}>
        oto<span>apteka</span>
        <span className="text-white/60">.pl</span>
      </span>
    );
  }
  return (
    <span className={cn("text-xl font-extrabold tracking-tight text-ink", className)}>
      oto<span className="text-pharma">apteka</span>
      <span className="text-muted">.pl</span>
    </span>
  );
}
