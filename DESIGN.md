# Design

## Visual Theme

IELTS Pressure Lab uses an Exam Command Center direction: dense, restrained product UI with clear telemetry, structured skill lanes, and pressure-state semantics. The surface should feel like a focused exam operations console, borrowing from the selected active drill cockpit and adaptive training map probes.

## Color

Use OKLCH tokens. Neutrals carry the architecture; teal marks primary action and active learning, amber marks pressure or warnings, red marks locks and critical states, and indigo is reserved for subtle brand/control support.

```css
--bg: oklch(0.985 0 0);
--bg-strong: oklch(0.12 0 0);
--surface: oklch(1 0 0);
--surface-soft: oklch(0.955 0.007 210);
--surface-dark: oklch(0.18 0.012 230);
--ink: oklch(0.18 0.018 245);
--muted: oklch(0.46 0.018 245);
--primary: oklch(0.57 0.118 184);
--accent: oklch(0.72 0.16 76);
--danger: oklch(0.58 0.19 28);
--indigo: oklch(0.40 0.15 270);
```

## Typography

Use one tuned system sans stack for the app: `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `system-ui`, sans-serif. Product typography uses fixed rem sizes, tabular numerals for telemetry, and no decorative display fonts.

## Components

Core components are timers, skill lanes, level chips, pressure meters, pace bars, module cards, session telemetry, and variant controls. Every interactive element needs default, hover, focus-visible, active, disabled, and selected states.

## Layout

The desktop structure uses a persistent top control bar and variant-specific product layouts. Mobile collapses to a single-column task stream while preserving the variant switcher and primary action.

## Motion

Motion is limited to state feedback: selected variants, active timers, progress fills, hover press feedback, and panel transitions. All motion must respect `prefers-reduced-motion`.
