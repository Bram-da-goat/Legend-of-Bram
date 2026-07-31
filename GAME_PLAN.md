# Game Plan: Original Fantasy Tower-Defense RPG

## Vision

Create a 3D RPG set in an original fantasy world, inspired by the sense of party-building and progression found in classic Final Fantasy games. Battles use a real-time tower-defense structure rather than traditional turn-based combat. A competitive PvP mode will build on the same combat rules once the single-player experience is fun and stable.

## Core Pillars

- **RPG progression:** Heroes, classes, abilities, equipment, experience, and meaningful build choices.
- **Tactical party defense:** Place and coordinate party heroes as defensive units against enemy waves on strategically varied maps.
- **Original worldbuilding:** A distinct setting with its own regions, factions, history, magic, creatures, and visual identity.
- **Competitive play:** PvP that rewards strategy and mastery without undermining the single-player campaign.
- **Controller-first delivery:** A Steam release designed for controller play as well as keyboard and mouse.

## Confirmed Battle Design

- The player does not build conventional towers. Each party member is a placeable defensive hero with a combat role, position, abilities, and equipment.
- Before each enemy wave, the player has a 30-second preparation phase to position the active party and prepare defenses.
- After preparation, enemies travel along the tower-defense path while placed heroes fight automatically and/or use player-directed abilities.
- Items and equipment change how heroes perform in battle, supporting distinct party builds and strategies.

## Confirmed PvP Design

- PvP is an alternating attack-and-defense match between two players.
- While defending, a player positions their party against minions travelling along the defense path.
- While attacking, the opposing player selects or sends minions through that path.
- When the defender clears all enemies, the players switch roles.
- Each player begins with 10 lives. The first player to run out of lives loses.

## Technical Direction

- **Runtime:** Vite local development server, viewable in Codex's in-app preview.
- **Rendering:** Three.js, with a modular scene, camera, lighting, terrain, and effects system.
- **Visual direction:** Stylized isometric 3D with a polished, diorama-like feel: appealing shapes, rich color, readable silhouettes, and soft lighting rather than realism. Tunic is a reference for the general level of charm and clarity, not an asset or design template to copy.
- **Controls:** Controller-first input design with complete keyboard-and-mouse support; gameplay and UI must be usable without precision mouse placement.
- **Release target:** Steam for the first public release.
- **Code organization:** Separate rendering, combat simulation, units, maps/pathfinding, UI, persistence, and networking modules.
- **Multiplayer:** A server-backed system, introduced only after the single-player simulation is complete and predictable.

## Delivery Milestones

### 1. Development Foundation

- Set up Node.js, Vite, and Three.js.
- Replace the current 2D canvas game with a basic 3D scene.
- Add a stable local dev workflow and confirm it runs in the in-app preview.

**Done when:** The project starts with `npm run dev` and displays a 3D test scene locally.

### 2. Single-Player Vertical Slice

- Build one small playable map with an enemy path.
- Add a small party of placeable hero defenders and one enemy type.
- Implement the 30-second preparation phase, spawning, path following, damage, equipment effects, and win/loss states.

**Done when:** A player can position a party during preparation and complete a short, repeatable defense encounter from start to finish using a controller.

**Current implementation:** Reset as a focused one-character prototype. Bram, the Stoneguard, is the only playable hero. He explores the 3D Meadow of Cinders, triggers an Ash Raider patrol encounter, then becomes the single placeable defender at Ember Gate. The battle retains the preparation, enemy-wave, automatic combat, lives, victory/defeat, and return-to-world loop.

### 3. RPG Systems

- Define hero classes, stats, abilities, equipment, experience, and unlocks.
- Add a roster or party system.
- Create rewards and upgrades between battles.

**Done when:** Players can make meaningful persistent build choices that affect battle performance.

### 4. Tower-Defense Depth

- Add additional tower/unit types and enemy archetypes.
- Add bosses, status effects, resource rules, and varied objectives.
- Add map mechanics such as chokepoints, elevation, or destructible defenses where they improve tactics.

**Done when:** Different map and build decisions support multiple viable strategies.

### 5. Campaign and Presentation

- Build original regions, missions, world-map progression, narrative framing, menus, and settings.
- Add saving, sound, effects, input support, and accessibility basics.

**Done when:** The game has a coherent, polished single-player loop with saved progress.

**Current implementation:** The first overworld slice, the Meadow of Cinders, is playable before combat. Players move their party marker with WASD or arrow keys and can trigger an Ash Raider Patrol encounter that transitions into the Ember Gate defense battle. This establishes the intended RPG loop: explore -> encounter -> prepare party -> defend.

### 6. PvP

- Prototype the alternating attacker/defender match using the existing combat rules.
- Implement role switching when a defender clears the active enemy group.
- Implement 10-life scoring and a clear end-of-match condition.
- For live PvP, implement the backend, matchmaking/lobbies, authoritative game state, reconnects, and anti-cheat boundaries.

**Done when:** Competitive matches reliably switch attack/defense roles, correctly track lives, feel fair, and do not compromise the core game loop.

### 7. Balance and Release

- Playtest and tune units, maps, rewards, and difficulty.
- Optimize rendering and loading performance.
- Create a production build and deployment plan.

**Done when:** The game meets its performance, stability, and fun targets for the first public release.

## Decisions to Make

1. What is the world's central premise, and which regions, factions, and magic rules define it?
2. During the wave, how much direct control should the player have over hero abilities: fully automatic, manual ability triggers, or hybrid?
3. How many party heroes can a player bring and place in an early match?
4. How should the attacker choose minions: a fixed escalating deck, a resource budget, cards, or another system?
5. What does losing a life mean mechanically: an enemy reaching a goal, damage based on the minion type, or a fixed one-life penalty?
6. What is the desired camera angle and player interaction style for controller placement: fixed isometric, rotatable isometric, or third-person tactical?

## Current Status

- Node.js, Vite, and Three.js are installed.
- The Vite development server is running at `http://localhost:5173/`.
- The first 3D vertical slice is implemented and browser-verified with no console errors.
- Next: expand progression, add another map/enemy type, and define the controller placement flow.
