export function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  const display = count > 99 ? '99+' : String(count);
  return (
    <span className="inline-flex min-w-[20px] h-5 items-center justify-center rounded-full bg-accent-bg px-1.5 text-xs font-bold text-accent-fg">
      {display}
    </span>
  );
}
