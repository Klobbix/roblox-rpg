import * as ServerNetwork from "server/network/server-network";
import {
	PlayerDataService,
	EntityService,
	MobService,
	SpawnerService,
	CombatService,
	LevelingService,
	GameLoopService,
	InventoryService,
	GroundItemService,
	LootService,
	EquipmentService,
	SkillService,
	GatheringService,
} from "server/services";
import { onServerEvent } from "server/network/server-network";

print("[Server] Initializing...");

// 1. Network must be first — creates remotes that other systems and clients depend on
ServerNetwork.initialize();

// 2. Player data — connects PlayerAdded/Removing listeners
PlayerDataService.initialize();

// 3. Entity management
EntityService.initialize();

// 4. Leveling (no game loop, called by combat service)
LevelingService.initialize();

// 5. Inventory service (item add/remove/move)
InventoryService.initialize();

// 6. Ground item service (spawn, despawn, pickup — registers game loop)
GroundItemService.initialize();

// 7. Loot service (loot tables, drop rolling)
LootService.initialize();

// 7.5. Equipment service (equip/unequip — before combat so callback can be wired)
EquipmentService.initialize();

// 7.6. Skill service (skill EXP, tool lookup)
SkillService.initialize();

// 7.7. Gathering service (nodes, depletion, respawn — registers game loop)
GatheringService.initialize();

// 8. Mob service (registers AI game loop system)
MobService.initialize();

// 9. Spawner service (finds/creates spawners, spawns initial mobs)
SpawnerService.initialize();

// 10. Combat service (registers combat game loop system, wires mob attack callback)
CombatService.initialize();

// 11. Game loop — starts Heartbeat tick (all systems must be registered before this)
GameLoopService.initialize();

// --- Remote Event Handlers ---

onServerEvent("EngageCombat", (player, data) => {
	CombatService.engageCombat(player, data.mobId);
});

onServerEvent("DisengageCombat", (player) => {
	CombatService.disengageCombat(player);
});

onServerEvent("PickupItem", (player, data) => {
	const result = GroundItemService.pickupGroundItem(player, data.groundItemId);
	if (result) {
		InventoryService.addItem(player, result.itemId, result.quantity);
	}
});

onServerEvent("DropItem", (player, data) => {
	const removed = InventoryService.removeFromSlot(player, data.tab, data.slotIndex, data.quantity);
	if (removed) {
		const rootPart = player.Character?.FindFirstChild("HumanoidRootPart") as Part | undefined;
		if (rootPart) {
			const dropPos = rootPart.Position.add(rootPart.CFrame.LookVector.mul(3));
			GroundItemService.spawnGroundItem(removed.itemId, removed.quantity, dropPos);
		}
	}
});

onServerEvent("MoveItem", (player, data) => {
	InventoryService.moveItem(player, data.tab, data.fromSlot, data.toSlot);
});

onServerEvent("UseItem", (player, data) => {
	InventoryService.useItem(player, data.tab, data.slotIndex, data.targetTab);
});

onServerEvent("EquipItem", (player, data) => {
	EquipmentService.equipItem(player, data.slotIndex);
});

onServerEvent("UnequipItem", (player, data) => {
	EquipmentService.unequipItem(player, data.equipSlot);
});

onServerEvent("StartGather", (player, data) => {
	GatheringService.startGather(player, data.nodeId);
});

onServerEvent("CancelGather", (player) => {
	GatheringService.cancelGather(player);
});

print("[Server] All systems ready");
