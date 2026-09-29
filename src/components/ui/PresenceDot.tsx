export function PresenceDot({ online }: { online: boolean }) {
  return (
    <span
      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-bg ${
        online ? "bg-green-500" : "border border-border"
      }`}
      aria-label={online ? "Online" : "Offline"}
    />
  );
}
