# Tale - Roblox MMORPG

## Project Overview
Tale is a RuneScape-inspired MMORPG built on Roblox. Each "map" is a separate Roblox experience that players can travel between. Maps contain combat zones with mob spawners, towns with NPCs/merchants/quest givers, and skill-gathering areas.

## Tech Stack
- **Language:** TypeScript via [roblox-ts](https://roblox-ts.com/docs) (compiles to Luau)
- **Sync:** Rojo syncs compiled output to Roblox Studio
- **Build:** `npm run build` (rbxtsc) or `npm run watch` (rbxtsc -w)
- **Linting:** ESLint with roblox-ts and Prettier plugins

## Project Structure
```
src/
  client/          → StarterPlayerScripts (UI, input, local rendering)
  server/          → ServerScriptService (game logic, data, authority)
  shared/          → ReplicatedStorage (types, configs, utilities)
out/               → Compiled Luau output (git-ignored)
```

### roblox-ts Conventions
- Client scripts: `*.client.ts` in `src/client/`
- Server scripts: `*.server.ts` in `src/server/`
- Shared modules: `*.ts` in `src/shared/` (no `.client`/`.server` suffix)
- Roblox API types come from `@rbxts/*` packages (typeRoots: `node_modules/@rbxts`)
- Do NOT use `try/catch` — roblox-ts uses `pcall`/`xpcall` patterns. Use `opcall` or manual pcall wrappers.
- Do NOT use `Map`/`Set` iteration order guarantees — Luau tables have no guaranteed order.
- Prefer `interface` over `type` for object shapes (better Luau compilation).

## Architecture Principles

### Server Authority
- **All game logic runs on the server.** Client is for rendering, input, and UI only.
- Never trust client data. Validate every RemoteEvent/RemoteFunction payload on the server.
- Use server-side hit detection for combat. Client can predict but server confirms.
- Inventory, stats, currency, and progression are server-authoritative.

### Data-Driven Design
- Define mobs, items, loot tables, quests, skills, and zones as **data configs** in `src/shared/data/`.
- Use TypeScript interfaces to enforce config schemas.
- Game systems read from configs — avoid hardcoding behavior per entity.
- Configs are shared so both client (for UI/display) and server (for logic) can reference them.

### Networking
- Use RemoteEvents for fire-and-forget actions (attacks, movement).
- Use RemoteFunctions sparingly — only for request-response patterns that need a return value.
- **Batch and throttle** network calls. Never send per-frame updates.
- Define a clear network contract in `src/shared/network/` with typed remote definitions.
- Use namespace-based remote organization (e.g., `Combat.DealDamage`, `Inventory.EquipItem`).

### Database / DataStore
- Use ProfileService or a similar pattern for player data persistence.
- **Minimize DataStore calls** — load on join, save on leave, and auto-save on interval.
- Never read from DataStore mid-gameplay; cache player data in memory on the server.
- Use session-locking to prevent data duplication across servers.
- Structure player data as a single serializable profile object.

### Performance
- Use object pooling for mobs, projectiles, and VFX.
- Avoid `Instance.new()` in hot paths — clone from templates in ReplicatedStorage.
- Debounce client inputs before sending to server.
- Use CollectionService tags for batch entity management.
- Limit `Heartbeat`/`RenderStepped` connections — consolidate into single loops.

## Code Style
- **TypeScript strict mode** is enabled. No `any` types.
- Follow ESLint + Prettier config in the repo.
- Use `PascalCase` for classes/interfaces/enums, `camelCase` for functions/variables, `UPPER_SNAKE` for constants.
- Keep files small and focused. One class or system per file.
- Use barrel exports (`index.ts`) for module folders.
- Prefer composition over inheritance for game systems.

## Design Patterns
- **ECS-like approach:** Separate data (components) from behavior (systems) where practical.
- **Service pattern on server:** Singleton services manage subsystems (CombatService, InventoryService, etc.).
- **Controller pattern on client:** Controllers handle client-side subsystems (UIController, InputController, etc.).
- **Observer pattern:** Events/signals for decoupled communication between systems.
- **Factory pattern:** For creating mobs, items, and other entities from data configs.
- **State machines:** For mob AI, player states, and quest progression.

## Multi-Map Architecture
- Each map is a standalone Roblox experience (separate Place within a Universe).
- Player data travels with the player via TeleportService + DataStore.
- Use MessagingService for cross-server communication (friends, parties, global events).
- Shared codebase — maps differ by their data configs and Roblox Studio level design.

## Security / Anti-Cheat
- Rate-limit all client-to-server remotes.
- Validate action feasibility server-side (range checks, cooldowns, inventory state).
- Sanity-check stat changes — reject impossible values.
- Log suspicious activity for review.
- Never expose server-only data configs to the client (e.g., exact loot table weights, mob stat internals beyond what UI needs).
