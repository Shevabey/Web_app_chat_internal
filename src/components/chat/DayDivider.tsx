export function DayDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center my-4">
      <span className="text-xs font-semibold text-fg-muted bg-surface px-3 py-1 rounded-full">
        {label}
      </span>
    </div>
  );
}
