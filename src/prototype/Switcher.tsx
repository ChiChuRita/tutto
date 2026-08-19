/**
 * PROTOTYPE — throwaway. Floating variant switcher for the table restyle.
 * Deliberately loud and unstyled-looking so it never reads as part of the
 * design being judged. Never rendered in a production build.
 */
import { useEffect } from "react";

export function Switcher({
  keys,
  names,
  current,
  onChange,
}: {
  keys: string[];
  names: Record<string, string>;
  current: string;
  onChange: (key: string) => void;
}) {
  const at = Math.max(0, keys.indexOf(current));
  const step = (by: number) =>
    onChange(keys[(at + by + keys.length) % keys.length]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      )
        return;
      if (event.key === "ArrowLeft") step(-1);
      if (event.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div
      style={{
        position: "fixed",
        bottom: 12,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: 4,
        borderRadius: 999,
        background: "#111",
        color: "#fff",
        boxShadow: "0 6px 24px rgb(0 0 0 / 0.45)",
        fontFamily: "ui-monospace, monospace",
        fontSize: 12,
      }}
    >
      <button
        style={arrow}
        onClick={() => step(-1)}
        aria-label="Vorherige Variante"
      >
        ←
      </button>
      <span style={{ padding: "0 10px", whiteSpace: "nowrap" }}>
        {current} — {names[current]}
      </span>
      <button
        style={arrow}
        onClick={() => step(1)}
        aria-label="Nächste Variante"
      >
        →
      </button>
    </div>
  );
}

const arrow: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 999,
  background: "#333",
  color: "#fff",
  fontSize: 14,
  lineHeight: 1,
};
