# WNY Moving — Employee Availability Calendar

A black-and-white, dark-mode availability calendar for tracking which employees are available to work each day.

## Features

- **Monthly calendar view** with previous/next month navigation and a "Today" button
- **Add and remove employees** — each shows as a selectable chip with initials
- **Three availability states**, cycled by clicking:
  - **Available** (solid white badge)
  - **Partial** (striped badge — e.g. AM or PM only)
  - **Unavailable** (dark badge, name struck through)
- **Daily headcount** — each day shows how many employees are available (e.g. `3/5`)
- **Automatic saving** — all data persists in the browser via `localStorage`

## Usage

Open `index.html` in any browser — no server, build step, or dependencies required.

1. Type an employee name and click **+ Add**
2. Click an employee chip to select them
3. Click any day on the calendar to cycle that employee's status: Available → Partial → Unavailable → cleared
4. Or click a name badge directly on a day to cycle just that mark
5. Click the **×** on a chip to remove an employee and all their marks

Data is stored per-browser. To share a schedule across devices, host the file and have everyone use the same machine/browser, or export can be added later.
