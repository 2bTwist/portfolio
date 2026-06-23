/* Palette definitions. A single default is server-rendered as :root vars in
   globals.css (no JS needed); the runtime switcher returns in Phase 2 as an
   additive client enhancement over that default.

   The Cream default's --muted / --accent were darkened from the prototype to
   pass the axe color-contrast invariant (4.5:1 on body text and button labels).
   Latte / Frappe are kept for the Phase 2 switcher and get the same treatment
   when switching returns. */

export type Palette = {
  name: string;
  vars: Record<string, string>;
};

export const DEFAULT_PALETTE_INDEX = 0;

export const PALETTES: Palette[] = [
  {
    name: "Cream",
    vars: {
      "--bg": "#f3ecdd",
      "--surface": "#fbf6ea",
      "--text": "#463f33",
      "--muted": "#726552",
      "--accent": "#a04c39",
      "--accent-press": "#823c2c",
      "--on-accent": "#fdf6ee",
      "--border": "#e3d8c2",
      "--border-press": "#cabfa6",
      "--term-bg": "#26211c",
      "--term-text": "#ece0cd",
      "--term-muted": "#a1907a",
      "--term-accent": "#e0936f",
    },
  },
  {
    name: "Latte",
    vars: {
      "--bg": "#eef1f5",
      "--surface": "#ffffff",
      "--text": "#4c4f69",
      "--muted": "#6c6f85",
      "--accent": "#7a36d6",
      "--accent-press": "#6c28c4",
      "--on-accent": "#ffffff",
      "--border": "#dce0e8",
      "--border-press": "#bcc0cc",
      "--term-bg": "#211f31",
      "--term-text": "#e6e1f4",
      "--term-muted": "#9892b0",
      "--term-accent": "#c6a8f0",
    },
  },
  {
    name: "Frappe (soft dark)",
    vars: {
      "--bg": "#303446",
      "--surface": "#292c3c",
      "--text": "#c6d0f5",
      "--muted": "#a5adce",
      "--accent": "#ef9f76",
      "--accent-press": "#c87f5d",
      "--on-accent": "#232634",
      "--border": "#414559",
      "--border-press": "#51576d",
      "--term-bg": "#21242f",
      "--term-text": "#c6d0f5",
      "--term-muted": "#a5adce",
      "--term-accent": "#f0a884",
    },
  },
];
