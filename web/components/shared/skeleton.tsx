interface Props {
  className?: string;
  width?: number | string;
  height?: number | string;
}

export function Skeleton({ className = "", width, height }: Props) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height: height ?? 16 }}
      aria-hidden
    />
  );
}
