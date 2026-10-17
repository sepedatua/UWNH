# AGENTS.md — Uncharted Waters: New Horizons Remake

Welcome to the **Uncharted Waters: New Horizons (大航海時代II)** remake project.
This document serves as the persistent architectural guide, operational manual, and project ruleset for Antigravity IDE agents across all workstations (Office, Home, etc.).

---

## 1. Project Overview & Architecture

This project is a browser-based, high-fidelity remake of Koei's classic 16-bit RPG *Uncharted Waters: New Horizons* (DOS / Genesis / SNES).

### Repository Structure
- **`temp_uw2/`**: Main frontend web application (TypeScript + Vite + React 18 + HTML5 Canvas).
- **`wbs_roadmap.md`**: Master Work Breakdown Structure and sprint roadmap. **Always consult this file for current task progress and completed milestones.**
- **`New-Horizons_DOS_EN/`**: Original DOS game assets, ROM data, and authentic Koei binary DAT tables (`COLONY.DAT`, `PORT.DAT`, `ITEM.DAT`, etc.).
- **`server/` & `database/`**: PHP 8.2+ backend and MariaDB schema for optional multiplayer trade/invest atomic sync.
- **`deploy/`**: Deployment configurations for Hetzner VPS / LAMP stack.

---

## 2. Frontend Development Stack (`temp_uw2/`)

- **Runtime & Package Manager**: Node.js `>=24.15.0`, **`pnpm`** (configured via `pnpm@12.8.1`). Always run package commands with `pnpm`.
- **Framework & Build**: React 18, Vite 8, TypeScript ~6.0.
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`), custom retro CSS overlays (`src/interface/global.css`).
- **Game Engine**: Dual-layer architecture:
  - **Canvas Layer (`src/game/`)**: High-performance 2D HTML5 canvas for the high seas viewport, port walking grid, tilemaps, dynamic ship sprites, Fog of War line-of-sight masks, and emerald green village markers.
  - **React Interface Layer (`src/interface/`)**: Authentic 16-bit parchment HUDs, dialogue bubbles, facility dialogs (`Building.tsx`), World Atlas (`WorldAtlasModal.tsx`), Discovery modals, and Fleet management.
- **Testing**: Vitest (`vitest`), Playwright (`@playwright/test`), React Testing Library.

---

## 3. Essential Commands (Run inside `temp_uw2/`)

```powershell
# 1. Install dependencies
pnpm install

# 2. Start local development server (http://localhost:5173)
pnpm start

# 3. Type checking
pnpm run typecheck

# 4. Unit & Regression Tests
pnpm test

# 5. Linting & Formatting
pnpm run lint
pnpm run prettier

# 6. E2E Tests (Playwright)
pnpm run test:e2e
```

---

## 4. Key Architectural Patterns & Conventions

### A. Dual Engine Separation
- **`src/game/`**: Pure TypeScript simulation engines, spatial math, pathfinding, and canvas renderers. Keep React hooks and DOM manipulations out of this directory.
- **`src/interface/`**: React components for modals, menus, and HUD overlays. Components should observe or dispatch to game state stores and utility engines.

### B. Cylindrical World Map Coordinates
- The world map is $2160 \times 1080$ tiles.
- **X-axis wraps around**: Moving east past tile `2159` wraps to `0`, and vice versa. Always use cylindrical distance calculation functions (`worldUtils.ts`, `atlasMapGenerator.ts`, `sharedUtils.ts`) when measuring distances or plotting routes.

### C. State & Persistence
- Single-player progression is persisted to `localStorage` across multiple save slots (`SaveLoadModal.tsx`, `saveLoadUtils.ts`).
- New features requiring persistence (e.g., discovered villages, supply ports, crew duty assignments, discovered colonies) must be registered in the save slot serializer so that saving and loading maintains state parity.

### D. Authentic 16-bit Koei Aesthetics
- Maintain authentic Koei color palettes, parchment UI dialogs, pixel-aligned borders, and nostalgic sound effects via the central `SoundManager`.
- Avoid modern generic UI patterns that break the 16th-century Age of Discovery ambiance.

---

## 5. Development Workflow & Rules for Agents

1. **Check `wbs_roadmap.md` First**: Before starting any new milestone or task, review [wbs_roadmap.md](file:///d:/BACKUP-KANTOR/Documents/New%20folder/wbs_roadmap.md) to understand dependencies, historical design decisions, and acceptance criteria.
2. **Update the Roadmap**: When completing a task or milestone, update the corresponding checkboxes `[x]` in `wbs_roadmap.md` with concise completion summaries.
3. **Preserve Green Tests**: Always run `pnpm test` and `pnpm run typecheck` inside `temp_uw2/` before declaring tasks complete to prevent regressions in earlier milestones.
4. **Non-destructive Commits**: Ensure all changes are committed with clear, conventional commit messages (e.g., `feat:`, `fix:`, `docs:`, `test:`).
