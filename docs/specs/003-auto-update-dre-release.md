# 003 - Auto-update to the latest dre release

## User Story

The dre website always shows the newest dre release from slickroot/dre. A daily check picks up a new release and publishes it to the website by itself, so I don't copy files by hand.

## Acceptance Criteria

- The website checks for a new dre release once a day.
- When a new release exists, the website is updated to it automatically, with no approval step.
- If the check or download fails, the website keeps working with the version it already has, and there is no notification.

## Technical Design
