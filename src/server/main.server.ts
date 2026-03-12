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
	NPCService,
	ShopService,
	ZoneService,
	MapTeleportService,
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

// 7.8. NPC service (NPC spawning, dialogue management)
NPCService.initialize();

// 7.9. Shop service (buy/sell — wires NPC callbacks)
ShopService.initialize();

// 7.10. Zone service (zone detection — registers game loop)
ZoneService.initialize();

// 7.11. Teleport service (portals, map transitions)
MapTeleportService.initialize();

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

// NPC / Dialogue
onServerEvent("InteractNPC", (player, data) => {
	NPCService.interactNPC(player, data.npcId);
});

onServerEvent("SelectDialogueOption", (player, data) => {
	NPCService.selectDialogueOption(player, data.optionIndex);
});

onServerEvent("CloseDialogue", (player) => {
	NPCService.closeDialogue(player);
});

// Shopping
onServerEvent("BuyItem", (player, data) => {
	ShopService.buyItem(player, data.shopId, data.itemIndex, data.quantity);
});

onServerEvent("SellItem", (player, data) => {
	ShopService.sellItem(player, data.tab, data.slotIndex, data.quantity);
});

onServerEvent("CloseShop", (player) => {
	ShopService.closeShop(player);
});

// Teleportation
onServerEvent("RequestTeleport", (player, data) => {
	MapTeleportService.requestTeleport(player, data.portalId);
});

print("[Server] All systems ready");
