# 005: Insert-mode shortcut strip

## User Story

As a visitor trying the interactive demo, when I enter insert mode by typing,
I want the shortcut strip to switch to insert-mode shortcuts so I know Esc
returns me to command mode (not just "finishes") and Enter adds a new child.

## Acceptance Criteria

- While in the interactive "Try it" demo, entering insert mode (pressing `b`,
  `s`, or `i`) replaces the shortcut strip's text with
  `Esc command mode · Enter new child`.
- Leaving insert mode (pressing Esc) switches the strip back to the existing
  command-mode shortcuts
  (`b add · s sibling · i edit · c colour · hjkl move · u undo`).
- This only applies to the interactive demo (the autoplay/pre-recorded demo
  before clicking "Try it" is unaffected).

## Technical Design
