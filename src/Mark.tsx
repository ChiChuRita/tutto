/**
 * The app's marks: six flat drawings that let a tile or a row say what it is
 * before its words do.
 *
 * The same vocabulary the Card faces already speak — one colour, `currentColor`,
 * a 24×24 box, drawn in this repo and traced from nothing. `Card.tsx` holds the
 * Cards' own marks and this holds everything else's; they are deliberately not
 * one module, because a Card's mark is part of the printed deck and these are
 * part of the app.
 *
 * No dependency. An icon package is not the answer to six shapes, and it would
 * arrive with a thousand more and a second drawing style.
 */
export type MarkName =
  /** A Roll, a Turn, the game itself. */
  | "die"
  /** A win, and the Seat in front. */
  | "crown"
  /** The Kleeblatt, and luck in general. */
  | "clover"
  /** A streak, and the Feuerwerk. */
  | "flame"
  /** A Game still running, waiting on somebody. */
  | "hourglass"
  /** A Seat, an opponent, a Player at the table. */
  | "person";

/**
 * A `switch` and not a lookup object, for the same reason `Mark` in `Card.tsx`
 * is one: `noImplicitReturns` makes a name added to the union above a compile
 * error here, where a lookup would have rendered an empty square.
 */
function drawing(name: MarkName) {
  switch (name) {
    case "die":
      // A die at rest with three pips, which is the fewest that still reads as
      // a die rather than as a rounded square.
      return (
        <>
          <rect
            x="3"
            y="3"
            width="18"
            height="18"
            rx="4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle cx="8.5" cy="8.5" r="1.7" />
          <circle cx="12" cy="12" r="1.7" />
          <circle cx="15.5" cy="15.5" r="1.7" />
        </>
      );
    case "crown":
      return (
        <path d="M3 8.2l4.2 3.1L12 4.6l4.8 6.7L21 8.2l-1.7 10.2a1 1 0 0 1-1 .8H5.7a1 1 0 0 1-1-.8Z" />
      );
    case "clover":
      // Four leaves on the diagonals and a stem — the same clover the Kleeblatt
      // Card wears, drawn again at this size rather than shared, because the
      // Card's is printed at 1.9em and this is 1em.
      return (
        <>
          <circle cx="15.4" cy="7.2" r="4.2" />
          <circle cx="15.4" cy="14.2" r="4.2" />
          <circle cx="8.6" cy="14.2" r="4.2" />
          <circle cx="8.6" cy="7.2" r="4.2" />
          <path
            d="M12 15.6c.4 2.8-.1 4.6-1.5 5.9"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </>
      );
    case "flame":
      return (
        <path d="M12.6 2.1c.3 3 1.9 4 3.5 5.7 1.6 1.6 2.7 3.3 2.7 5.6a6.8 6.8 0 0 1-13.6 0c0-2 .8-3.6 2-4.9.2 1 .8 1.8 1.7 2.1.6-3.6 2-6.2 3.7-8.5Z" />
      );
    case "hourglass":
      return (
        <path d="M6 2.6h12a1 1 0 0 1 0 2h-.4v1.7c0 2-1.1 3.8-2.9 4.8v1.8c1.8 1 2.9 2.8 2.9 4.8v1.7h.4a1 1 0 0 1 0 2H6a1 1 0 0 1 0-2h.4v-1.7c0-2 1.1-3.8 2.9-4.8v-1.8c-1.8-1-2.9-2.8-2.9-4.8V4.6H6a1 1 0 0 1 0-2Z" />
      );
    case "person":
      return (
        <>
          <circle cx="12" cy="7.4" r="4.3" />
          <path d="M3.6 21.4a8.4 8.4 0 0 1 16.8 0 1 1 0 0 1-1 1H4.6a1 1 0 0 1-1-1Z" />
        </>
      );
  }
}

/**
 * One mark, at the size of the type around it.
 *
 * `aria-hidden` by default and that is the safe way round: nearly every mark in
 * this app sits beside the word it is about, and read out it would say the word
 * twice. Where a mark stands alone, pass a `label` — there is no third option,
 * so a mark cannot silently become the only way to know something.
 */
export function Mark({
  name,
  className = "",
  label,
}: {
  name: MarkName;
  className?: string;
  /** Only for a mark with no words beside it. */
  label?: string;
}) {
  return (
    <>
      <svg
        aria-hidden
        className={`inline-block h-[1em] w-[1em] ${className}`}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        {drawing(name)}
      </svg>
      {label !== undefined && <span className="sr-only">{label}</span>}
    </>
  );
}

/**
 * The box a mark sits in on a row.
 *
 * It was a circle — a well of the tile's own hue with the mark in the saturated
 * one, which was the shape the whole five-hue tile family was built on. That
 * family is gone (`tiles.ts`), and a circle was the last round thing left on a
 * sheet where every single other object is a rectangle with a rule round it: the
 * fields, the boxes, the cards, the stamps, the dice. One circle in that company
 * does not read as a highlight, it reads as something from another app.
 *
 * So it is a ruled box, the size it always was, and the mark is inked in it.
 * Written once here rather than per caller, so every mark in the app is the same
 * size in the same box.
 */
export function MarkWell({
  name,
  className,
  label,
}: {
  name: MarkName;
  /** The field's own `bg-*` and `text-*` pair. */
  className: string;
  label?: string;
}) {
  return (
    <span
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-tile text-lg shadow-soft ${className}`}
    >
      <Mark name={name} label={label} />
    </span>
  );
}
