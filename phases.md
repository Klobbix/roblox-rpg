# Tale MVP — Development Phases

## Phase 1: Core Framework
Set up the foundational architecture that all systems build on.

- [x] **Project structure** — Organize `src/` into `client/`, `server/`, `shared/` with subfolders: `services/`, `controllers/`, `data/`, `network/`, `types/`, `utils/`
- [x] **Networking layer** — Typed remote event/function definitions in `shared/network/`. Wrapper that handles serialization, rate-limiting, and validation. Namespace remotes by system (Combat, Inventory, etc.)
- [x] **Player data system** — ProfileService-style DataStore wrapper with session locking, auto-save, and structured player profile type. Load on join, cache in memory, save on leave.
- [x] **Entity system** — Base entity management using CollectionService tags. Factory functions to spawn entities from data configs. Object pooling for reusable instances.
- [x] **Game loop** — Server-side tick loop for updating mobs, spawners, and world systems. Client-side render loop for interpolation and UI updates.

## Phase 2: Character & Combat
Get a player into the world, moving, and fighting.

- [x] **Character stats** — Define stat types (HP, Attack, Defense, Strength, etc.) in shared data. Server-authoritative stat calculation from base + level + equipment bonuses.
- [x] **Leveling & EXP** — EXP curve config (scaling formula per level). Grant EXP on mob kill and skill actions. Level-up detection and stat recalculation. Client notification on level-up.
- [x] **Basic combat system** — Server-side hit validation (range check, cooldown check, target alive check). Damage formula: `damage = f(attackerStats, defenderStats, weapon)`. Attack cooldowns based on weapon speed. Death and respawn handling.
- [x] **Mob system** — Mob data configs: `{ id, name, level, stats, attackSpeed, aggroRange, respawnTime, lootTableId }`. Mob AI state machine: Idle → Aggro → Chase → Attack → Reset → Idle. Leash distance (return to spawn if pulled too far). Health bars (client-side UI from server-replicated HP).
- [x] **Spawner system** — Spawner configs: `{ mobId, count, radius, respawnDelay }`. Server tracks alive mobs per spawner, respawns on death timer. Data-driven — place spawner instances in Studio, tag them, config maps to mob data.

How Mob Spawning Works

Mobs are entirely server-generated — MobService.createMobModel() builds the model in code (a red box + ball head). There are no Studio models involved. You never place a mob directly; you place a Spawner Part that references configs.

The two configs you need to define

1. src/shared/data/mobs.ts — the mob itself
   iron_golem: {
   id: "iron_golem",
   name: "Iron Golem",
   level: 10,
   stats: { maxHp: 80, attack: 12, strength: 10, defense: 8 },
   attackSpeed: 3.5,   // seconds between attacks
   aggroRange: 12,     // studs; 0 = passive
   leashRange: 40,     // studs from spawn before resetting
   attackRange: 5,     // studs to melee
   walkSpeed: 8,       // studs/sec
   respawnTime: 30,    // seconds (informational; respawnDelay on spawner drives this)
   lootTableId: "iron_golem_drops",
   }

2. src/shared/data/spawners.ts — the spawner config
   spawn_iron_golems: {
   id: "spawn_iron_golems",
   mobId: "iron_golem",   // must match MobConfig.id
   count: 2,              // max alive at once
   radius: 15,            // spread radius in studs
   respawnDelay: 30,      // seconds after death to respawn
   }

3. Loot table in src/shared/data/loot.ts — add an entry matching lootTableId.

  ---
Placing it in Studio

In your Workspace, place any BasePart where you want the spawner center:

┌───────────────────────────┬─────────────────────────────────────────────────────┐
│         Property          │                        Value                        │
├───────────────────────────┼─────────────────────────────────────────────────────┤
│ CollectionService Tag     │ Spawner                                             │
├───────────────────────────┼─────────────────────────────────────────────────────┤
│ Attribute SpawnerConfigId │ "spawn_iron_golems" (must match SpawnerConfigs key) │
└───────────────────────────┴─────────────────────────────────────────────────────┘

That's it. On server start, SpawnerService finds all Parts tagged Spawner, reads their SpawnerConfigId attribute, and calls registerSpawner() with the part's position. If no tagged parts are found it falls back to the hardcoded test spawners
near the origin.


### Manual Studio Setup (Phase 2)
- [ ] **Replace placeholder mob models** — Current mobs are simple Part-based placeholders. Create proper mob Models in Studio (or import meshes) and store them in ServerStorage. Update `mob-service.ts` `createMobModel()` to clone templates instead of building from Parts.
- [ ] **Place spawner Parts** — To use data-driven spawners, add Parts in Workspace tagged `"Spawner"` with a `SpawnerConfigId` string attribute (e.g., `"spawn_goblins"`). Without these, the system auto-creates test spawners near the origin.
- [ ] **Tune combat numbers** — Playtest and adjust EXP curve, damage formula, mob stats, and attack speeds in `shared/data/stats.ts` and `shared/data/mobs.ts`.

## Phase 3: Loot & Inventory
Players earn and manage items.

- [x] **Item data configs** — Item definitions: `{ id, name, type, icon, stackable, maxStack, rarity, description }`. Item types: Equipment, Consumable, Material, Tool, Quest, Currency. Rarity tiers with color coding.
- [x] **Loot table system** — Loot table configs: `{ entries: [{ itemId, weight, minQty, maxQty }] }`. Roll function: weighted random selection, supports multiple rolls per kill. Mobs reference loot tables by ID. Server-only weights — client never sees drop chances.
- [x] **Inventory system** — Fixed-size inventory grid (e.g., 28 slots, RuneScape-style). Server-authoritative add/remove/move/stack operations. Overflow protection (drop or reject if full). Serialized in player profile for persistence.
- [x] **Inventory UI** — Client-side grid display. Drag-and-drop or click to move items. Right-click context menu (Use, Drop, Examine). Item tooltips with stats and description.
- [x] **Ground items** — Dropped items appear in world with despawn timer. Pickup via interaction (server validates proximity and inventory space). Loot ownership timer (killer gets priority, then public).

## Phase 4: Equipment
Gear up and get stronger.

- [x] **Equipment data** — Extend item configs for equipment: `{ slot, statBonuses: { attack?, defense?, strength?, hp? }, levelRequirement, skillRequirements? }`. Equipment slots: Head, Body, Legs, Feet, Hands, Weapon, Shield, Ring, Amulet, Cape.
- [x] **Equip/unequip system** — Server validates: correct slot, meets level/skill requirements, item exists in inventory. Equipping moves item from inventory to equipment slot (and vice versa). Stat recalculation on equip change.
- [x] **Equipment UI** — Character paper-doll display showing equipped items. Click equipment slot to unequip. Visual update on character model (stretch goal for MVP — can use simple part-based indicators).
- [x] **Combat stat integration** — Damage and defense formulas pull from equipment bonuses. Weapon determines attack speed and damage type.

## Phase 5: Skills & Tools
Gathering and non-combat progression.

- [x] **Skill data configs** — Skills: Mining, Woodcutting, Fishing (MVP set). Skill definitions: `{ id, name, tools: ToolId[], gatherNodes: NodeId[] }`. Skill EXP curves (can share or differ from combat leveling).
- [x] **Tool system** — Tool items: Pickaxe, Hatchet, Fishing Rod with tier progression (Bronze → Iron → Steel → ...). Tool configs: `{ tier, skillId, speed, levelRequirement }`. Better tools = faster gather speed. Server validates player has correct tool equipped/in-inventory.
- [x] **Gathering nodes** — Node data configs: `{ id, name, skillId, levelRequired, expReward, lootTableId, respawnTime, toolRequired }`. Nodes placed in Studio, tagged via CollectionService. Server-side interaction: validate proximity, skill level, tool ownership. Depletion and respawn timer. Gather animation on client (timed to server tick).
- [x] **Skill UI** — Skills tab showing all skills, current level, EXP bar, EXP to next level. Floating EXP drop text on gather.

Manual Studio Setup (Phase 5)
- [ ] Place Parts/Models in Workspace tagged "GatherNode" with a NodeConfigId string attribute (e.g., "copper_rock", "normal_tree", "fishing_spot"). Without these, the server auto-creates test nodes near origin.


## Phase 6: NPCs & Towns
Bring the world to life.

- [x] **NPC system** — NPC data configs: `{ id, name, type: "merchant" | "questGiver" | "dialogue", dialogueId?, shopId? }`. NPCs placed in Studio, tagged, mapped to configs. Client interaction (click/proximity prompt) → server validates → opens UI.
- [x] **Dialogue system** — Dialogue trees defined as data: `{ nodes: [{ text, options: [{ label, nextNodeId?, action? }] }] }`. Actions: open shop, start quest, give item, teleport. Client renders dialogue UI, server processes actions.
- [x] **Merchant / shop system** — Shop configs: `{ id, name, items: [{ itemId, price, stock? }] }`. Buy: server validates currency, inventory space, deducts gold, adds item. Sell: server calculates sell price (percentage of buy), removes item, adds gold.
- [x] **Currency** — Gold as primary currency stored in player profile. Display in UI HUD. All transactions server-authoritative.

### Manual Studio Setup (Phase 6)
- [ ] **Place NPC Parts/Models** — Tag a Part or Model in Workspace with `"NPC"` and set a `NPCConfigId` string attribute (e.g., `"general_store_owner"`, `"weapon_smith"`). For Models, a PrimaryPart must be set. A ProximityPrompt is added automatically — do not add one manually. Without tagged instances, the system auto-creates test NPCs near the origin.
- [ ] **Replace placeholder NPC models** — Current NPCs are simple Part-based placeholders. Create proper NPC Models in Studio, set a PrimaryPart, tag them `"NPC"`, and set the `NPCConfigId` attribute.
- [ ] **Tune shop prices** — Playtest and adjust buy prices in `shared/data/shops.ts` and sell prices in `shared/data/items.ts`.

## Phase 7: Map System & Teleportation
Connect multiple maps together.

- [x] **Map data configs** — Map definitions: `{ id, name, placeId, recommendedLevel, connections: [{ targetMapId, spawnPoint }] }`. Each map is a separate Roblox Place within the same Universe.
- [x] **Teleportation** — TeleportService to move players between Places. Save player data before teleport. Load and validate data on arrival. Spawn at correct entry point based on origin map.
- [x] **Zone definitions** — Zones within a map tagged in Studio. Zone configs: `{ id, name, type: "combat" | "town" | "gathering", mapId }`. Used for UI display (zone name on enter), music, and mob spawner association.
- [x] **Map UI** — World map showing discovered maps and connections. Minimap or zone indicator in HUD.

### Manual Studio Setup (Phase 7)
- [ ] **Configure Place IDs** — Set real `placeId` values in `shared/data/maps.ts` for each map. Create Places in the Roblox Universe. PlaceId 0 is a dev placeholder.
- [ ] **Place Zone volumes** — Add transparent Parts in Workspace tagged `"Zone"` with a `ZoneConfigId` string attribute (e.g., `"lumbridge_town"`, `"chicken_field"`). Without these, the system auto-creates test zones.
- [ ] **Place Map Portals** — Add Parts tagged `"MapPortal"` with `MapId` and `ConnectionId` string attributes. Without these, the system auto-creates a test portal.
- [ ] **Place Spawn Points** — Add Parts named after spawn point IDs (e.g., `"from_meadows"`, `"from_forest"`) so arriving players teleport to the correct location.

## Phase 8: Polish & Integration
Connect all systems and prepare for playtesting.

- [x] **HUD** — Health bar, EXP bar, minimap/zone name, currency display, quick-access buttons.
- [ ] **Death & respawn** — On death: respawn at nearest town, keep inventory (MVP — no item loss). Short respawn timer. Clear combat state.
- [ ] **Save integrity** — Validate saved data on load (handle schema migrations). Backup profiles periodically. Handle edge cases: disconnect during combat, teleport failures, double-login.
- [ ] **Basic anti-cheat** — Remote rate limiting, server-side validation on all actions, stat sanity checks, speed checks on movement.
- [ ] **Playtesting pass** — Create one complete map with: 3-5 mob types at varying levels, a town with merchant and quest giver, mining/woodcutting/fishing nodes, zone transitions. Balance EXP curves, damage formulas, loot rates. Test full loop: spawn → level → loot → equip → gather → shop → teleport.
- 