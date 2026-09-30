export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="var(--brand)" />
      <path d="M9 19.5 16 12.5l7 7" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.5 24h9" stroke="#fff" strokeOpacity=".55" strokeWidth="3" strokeLinecap="round" />
      <circle cx="16" cy="7.4" r="1.9" fill="#fff" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark size={32} />
      <span className="text-2xl font-semibold tracking-tight">
        push<span className="text-brand">bid</span>
      </span>
    </span>
  );
}
