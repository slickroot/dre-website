# 002 - macOS window bar colours

## User Story

A visitor opens the dre website and sees the terminal window in the hero with a macOS-style window bar. The three buttons on the bar are coloured red, yellow and green, left to right, instead of all grey.

## Acceptance Criteria

- The first button is red, the second yellow and the third green, in that order from left to right.
- The colours are the standard macOS ones.
- The buttons do nothing on hover or click.

## Technical Design

**Scope:** `index.html` only. The window bar is `.term-bar` with three `<span class="dot">` elements sharing one grey rule.

**Markup:** give each dot a modifier class that names its role, in left-to-right order:
- `<span class="dot dot-close"></span>`
- `<span class="dot dot-min"></span>`
- `<span class="dot dot-max"></span>`

The colour follows the role, not the position, so it survives reordering. Positional selectors (`:nth-child`) are not used.

**CSS:** three modifier rules override the base `.dot` background, with the hex written directly on each rule. No new custom properties, since each colour has one consumer and is never themed.
- `.dot-close` → `#ff5f57` (red)
- `.dot-min` → `#febc2e` (yellow)
- `.dot-max` → `#28c840` (green)

The base `.dot` rule (size, radius, grey fallback) stays as is.

**Inert by design:** the dots stay `<span>`s with no handlers and no `:hover` rule. There is no `cursor: pointer` and no `button` element. The parent `role="img"` already hides them from assistive tech.

**Verification:** none. The change is three CSS rules and a class on each span, so there is no test or manual-check step in this design.
