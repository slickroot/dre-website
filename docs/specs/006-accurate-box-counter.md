# 006: Accurate box counter

## User Story

As a visitor watching the demo, I want the box counter in the bottom strip
to always show the true number of boxes on screen at every step, so the
count I see matches what I actually see drawn.

## Acceptance Criteria

- When the demo starts (before any box is added), the counter shows
  "0 boxes".
- When the first box is added, the counter shows "1 box".
- As additional boxes are added or removed during the demo, the counter
  always matches the actual number of boxes visible on screen (not off by
  one, and not counting the hidden root node).
- Singular/plural wording stays correct ("1 box" vs "N boxes").

## Technical Design

