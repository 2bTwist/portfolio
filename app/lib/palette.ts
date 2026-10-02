/* Palette definitions. A single default is server-rendered as :root vars in
   globals.css (no JS needed); the runtime switcher returns in Phase 2 as an
   additive client enhancement over that default.

   The Cream default's --muted / --accent were darkened from the prototype to
   pass the axe color-contrast invariant (4.5:1 on body text and button labels).
   Latte / Frappe are kept for the Phase 2 switcher and get the same treatment
   when switching returns.

   --text and --muted are set a step deeper than the prototype so long-form copy
   stands off the tinted page instead of blending into it; --text-strong is the
   heading and emphasis ink above them. */

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
      "--text": "#3a3329",
      "--text-strong": "#221d16",
      "--muted": "#5f5343",
      "--accent": "#a04c39",
      "--accent-press": "#823c2c",
      "--on-accent": "#fdf6ee",
      "--border": "#e3d8c2",
      "--border-press": "#cabfa6",
      "--term-bg": "#26211c",
      "--term-text": "#ece0cd",
      "--term-muted": "#a1907a",
      "--term-accent": "#e0936f",
      "--dot-close": "#cf5b4e",
      "--dot-min": "#d9a441",
      "--dot-max": "#6fa85f",
    },
  },
  {
    name: "Latte",
    vars: {
      "--bg": "#eef1f5",
      "--surface": "#ffffff",
      "--text": "#3a3d54",
      "--text-strong": "#1e2030",
      "--muted": "#56596e",
      "--accent": "#7a36d6",
      "--accent-press": "#6c28c4",
      "--on-accent": "#ffffff",
      "--border": "#dce0e8",
      "--border-press": "#bcc0cc",
      "--term-bg": "#211f31",
      "--term-text": "#e6e1f4",
      "--term-muted": "#9892b0",
      "--term-accent": "#c6a8f0",
      "--dot-close": "#d20f39",
      "--dot-min": "#df8e1d",
      "--dot-max": "#40a02b",
    },
  },
  {
    name: "Frappe (soft dark)",
    vars: {
      "--bg": "#303446",
      "--surface": "#292c3c",
      "--text": "#d3daf6",
      "--text-strong": "#eef1fd",
      "--muted": "#b4bbda",
      "--accent": "#ef9f76",
      "--accent-press": "#c87f5d",
      "--on-accent": "#232634",
      "--border": "#414559",
      "--border-press": "#51576d",
      "--term-bg": "#21242f",
      "--term-text": "#c6d0f5",
      "--term-muted": "#a5adce",
      "--term-accent": "#f0a884",
      "--dot-close": "#e78284",
      "--dot-min": "#e5c890",
      "--dot-max": "#a6d189",
    },
  },
];
