import { classifySource, SOURCE_STYLES } from "@/lib/types";

export default function SourceBadge({ source, full = false }: { source?: string; full?: boolean }) {
  const kind = classifySource(source);
  const style = SOURCE_STYLES[kind];
  const label = full && source ? source : style.label;
  return (
    <span
      className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded leading-tight font-medium"
      style={{ background: style.bg, color: style.color }}
      title={source}
    >
      {label}
    </span>
  );
}
