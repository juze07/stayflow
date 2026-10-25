import { useId, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

type AzulejoPatternProps = {
  columns?: number;
  rows?: number;
  /** Anima a entrada dos azulejos e um brilho lento em onda. */
  animated?: boolean;
  className?: string;
};

/**
 * Padrão de azulejos em SVG. Os quartos de círculo nos cantos juntam-se entre
 * azulejos vizinhos e formam círculos completos, como num painel real.
 * Puramente decorativo (aria-hidden); sem JavaScript.
 */
export function AzulejoPattern({ columns = 10, rows = 12, animated = false, className }: AzulejoPatternProps) {
  const id = useId().replace(/:/g, "");
  const tiles = Array.from({ length: columns * rows }, (_, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    return { index, wave: row + column };
  });

  return (
    <div aria-hidden className={cn("pointer-events-none select-none", className)}>
      <svg width="0" height="0" className="absolute">
        <defs>
          <g id={`${id}-lines`}>
            <path d="M0 10A10 10 0 0 0 10 0M30 0A10 10 0 0 0 40 10M40 30A10 10 0 0 0 30 40M10 40A10 10 0 0 0 0 30" />
            <path d="M20 3 37 20 20 37 3 20Z" />
            <circle cx="20" cy="20" r="2.5" />
          </g>
          <path id={`${id}-star`} d="M20 9A11 11 0 0 0 31 20 11 11 0 0 0 20 31 11 11 0 0 0 9 20 11 11 0 0 0 20 9Z" />
        </defs>
      </svg>
      <div className="grid h-full w-full" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {tiles.map(({ index, wave }) => (
          <div
            key={index}
            className={cn("aspect-square", animated && "animate-tile-in")}
            style={animated ? ({ animationDelay: `${wave * 45}ms` } as CSSProperties) : undefined}
          >
            <svg viewBox="0 0 40 40" className="size-full overflow-visible">
              <use href={`#${id}-lines`} fill="none" stroke="currentColor" strokeWidth="1" opacity=".28" />
              <use
                href={`#${id}-flower`}
                fill="currentColor"
                className={animated ? "animate-tile-glow" : undefined}
                opacity={animated ? undefined : 0.18}
                style={animated ? { animationDelay: `${wave * 260}ms` } : undefined}
              />
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
}
