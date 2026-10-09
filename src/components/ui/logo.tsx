import { cn } from "@/lib/utils";

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  /** Render only the mark, without the "Hirely" wordmark. */
  markOnly?: boolean;
  subtext?: string;
}

export function Logo({
  size = "md",
  markOnly,
  subtext,
  className,
  ...props
}: LogoProps) {
  const s = {
    sm: { mark: 26, text: "text-[1.15rem]", subtext: "text-[10px]" },
    md: { mark: 30, text: "text-[1.35rem]", subtext: "text-xs" },
    lg: { mark: 36, text: "text-[1.65rem]", subtext: "text-sm" },
  }[size];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 select-none leading-none",
        className,
      )}
      {...props}
    >
      <LogoMark size={s.mark} />

      {!markOnly && (
        <span
          className={cn(
            "font-brand font-extrabold tracking-[-0.04em] text-foreground",
            s.text,
          )}
        >
          Hirely
        </span>
      )}

      {subtext && (
        <span
          className={cn(
            "self-center border-l pl-2 font-mono font-medium uppercase tracking-widest text-muted-foreground",
            s.subtext,
          )}
        >
          {subtext}
        </span>
      )}
    </div>
  );
}

/** An "H" whose crossbar is a bridge — a candidate and a team, connected. */
export function LogoMark({
  size = 30,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <rect width="32" height="32" rx="9" fill="var(--primary)" />
      <rect x="8.5" y="8" width="4" height="16" rx="2" fill="var(--primary-foreground)" />
      <rect x="19.5" y="8" width="4" height="16" rx="2" fill="var(--primary-foreground)" />
      <path
        d="M11 18.5C13.2 13.8 18.8 13.8 21 18.5"
        stroke="var(--primary-foreground)"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
