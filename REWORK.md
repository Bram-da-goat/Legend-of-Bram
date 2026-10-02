# The Legend of Bram — browser edition

The game is now a Vite / Three.js browser game. No installation is required. The old installer files have been left alone, but Electron, its build configuration, and desktop-only tests are no longer part of the active project.

## New visual direction

A storybook diorama: articulated, faceted 3D characters; visible handheld weapons; cel-shaded surfaces; blue and teal timber-framed cottages; fir trees, wildflowers, a warm meadow, and misty mountains. The interface uses pixel-art panels, crisp borders, pixel sprites, and the locally bundled VT323 font (SIL OFL; license in `public/fonts`). No external image or font service is required.

Bram, goblins, orcs, Calder, villagers, bats, and rock creatures use actual meshes. Walking moves their limbs; weapon strikes have separate wind-up and recovery poses. The hundred-undead phase uses lighter models for performance.

## Preserved game

The meadow, Calder’s three phases, Starfall portal and shops, crafting, altar blessings, house/cellar/cave progression, five hidden memories, contracts, and optional Sentinel ending remain. Goblins and orcs keep their previous drops, bats have 200 HP and their wing/shard drops, and the club keeps 200 base damage, 3 range, and 6 AOE.

WASD/arrows move; Shift runs; E interacts; J opens the journal. Click to place Bram in battle; Space starts the wave; Q casts Earthshatter; X allows one paused reposition. Weapons can be selected during preparation or at Mira’s shop.

## Reliability improvements

- A browser save lock prevents a second tab from overwriting an active journey.
- A good backup is retained if the primary save becomes corrupt.
- Existing V4 browser save keys remain unchanged.
- Battle camera fitting reserves space for interface panels and adapts to the window.
- Returning from encounters still checks for a clear landing point.
- Cave movement is restricted to the passage rather than allowing shortcuts outside its walls.
- The game pauses simulation in background tabs.
- Startup failures show a recovery screen instead of leaving unresponsive buttons.
- A runtime exception stops the current animation loop rather than repeating every frame.

Saves belong to the browser and site address. Export from the journal to move a save to another browser/address. Previous desktop JSON exports can be restored from the browser journal; desktop saves do not automatically transfer into browser storage.

## Project layout

- `src/main.js`: browser startup, single-tab lock, and recovery UI.
- `src/game.js`: world, story, combat, and interface coordination.
- `src/story.js`: quest definitions and cinematic dialogue.
- `src/models.js`: 3D models, materials, rigs, and animations.
- `src/presentation.js`: decorative scenery and battle camera fitting.
- `src/campaign.mjs`: testable progression, crafting, rewards, and save migration.
- `src/save-store.mjs`: browser persistence and backup recovery.
- `tests/`: progression, saves, model/camera checks, and isolated browser gameplay tests.

## Run and verify

`npm install`, then `npm run dev`: http://127.0.0.1:5174/

`npm test`: unit/regression tests.

`npm run test:browser`: full browser checks. Requires Playwright; set `BRAM_PLAYWRIGHT_PATH` when using a bundled installation and `BRAM_CHROME` for an alternative Chrome executable. The test uses a separate profile, never a player’s saves.

`npm run build`: creates the browser release in `dist/`. Relative paths work with the existing GitHub Pages repository. Publication requires an explicit request; building locally does not update the public website.
