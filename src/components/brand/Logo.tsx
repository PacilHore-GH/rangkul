import { cn } from "@/lib/utils";

export function RangkulMark({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <img
      src="/logorangkul.png"
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={cn("object-contain", className)}
    />
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
