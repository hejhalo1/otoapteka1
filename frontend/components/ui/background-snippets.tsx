// Dekoracyjne tło: subtelna siatka + miękkie poświaty w barwach serwisu
// (granatowy #0b4f9e w prawym górnym rogu, teal #0891b2 po lewej). Dostosowane
// z gotowego snippetu (oryginał miał szary grid i fioletową poświatę).
export function GridGlowBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full bg-white bg-[linear-gradient(to_right,#e6ecf4_1px,transparent_1px),linear-gradient(to_bottom,#e6ecf4_1px,transparent_1px)] bg-[size:6rem_4rem]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_100%_200px,rgba(11,79,158,0.16),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_600px_at_0%_320px,rgba(8,145,178,0.10),transparent)]" />
    </div>
  );
}

// Alias zgodny z konwencją snippetu (demo używa `Component`).
export const Component = GridGlowBackground;
