import { cn } from "@/lib/utils";

// Rangkul logo: outer embrace + inner heart + circular support (per 01_BRAND_AND_PRODUCT).
// Placeholder mark — swap with the official asset when available.
export function RangkulMark({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* Outer embracing circle */}
      <path
        d="M20 4 C 28.837 4 36 11.163 36 20 C 36 25.5 33.2 30.3 29 33"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M20 36 C 11.163 36 4 28.837 4 20 C 4 14.5 6.8 9.7 11 7"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* Inner heart */}
      <path
        d="M20 27 L 13.5 20.5 C 11.5 18.5 11.5 15.3 13.5 13.3 C 15.5 11.3 18.7 11.3 20 13.3 C 21.3 11.3 24.5 11.3 26.5 13.3 C 28.5 15.3 28.5 18.5 26.5 20.5 L 20 27 Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function RangkulLogo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2 text-brand", className)}>
      <RangkulMark size={28} />
      {showText && (
        <span className="text-[20px] font-semibold tracking-tight text-text-primary">Rangkul</span>
      )}
    </div>
  );
}
