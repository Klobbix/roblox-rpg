import {
	PlayerProfile,
	CombatStats,
	InventoryTab,
	TabInventory,
	EquipmentSlot,
	InventoryItem,
} from "shared/types/player";

/** Events fired from client → server. */
export interface ServerEventDefinitions {
	/** Player swings their equipped item at a target. */
	Swing: { targetId: string; targetType: "mob" | "node" };

	// Inventory
	PickupItem: { groundItemId: string };
	DropItem: { tab: InventoryTab; slotIndex: number; quantity: number };
	MoveItem: { tab: InventoryTab; fromSlot: number; toSlot: number };
	UseItem: { tab: InventoryTab; slotIndex: number; targetTab: InventoryTab };

	// Equipment
	EquipItem: { slotIndex: number };
	UnequipItem: { equipSlot: EquipmentSlot };

	// NPCs
	InteractNPC: { npcId: string };
	SelectDialogueOption: { optionIndex: number };
	CloseDialogue: undefined;

	// Shopping
	BuyItem: { shopId: string; itemIndex: number; quantity: number };
	SellItem: { tab: InventoryTab; slotIndex: number; quantity: number };
	CloseShop: undefined;

	// Teleportation
	RequestTeleport: { portalId: string };
}

/** Events fired from server → client. */
export interface ClientEventDefinitions {
	// Player data
	PlayerDataLoaded: PlayerProfile;
	PlayerDataError: string;

	// Combat
	DamageDealt: { mobId: string; damage: number };
	DamageTaken: { damage: number; currentHp: number; maxHp: number };

	// Progression
	ExpGained: { amount: number; totalExp: number; level: number };
	LevelUp: { newLevel: number; stats: CombatStats };

	// Mob / death
	MobDied: { mobId: string; expReward: number };
	PlayerDied: { respawnTime: number };
	PlayerRespawned: { hp: number; maxHp: number };

	// Inventory
	InventoryTabUpdated: { tab: InventoryTab; tabData: TabInventory };
	InventoryFull: { itemId: string; tab: InventoryTab };

	// Equipment
	EquipmentUpdated: { equipment: Partial<Record<EquipmentSlot, InventoryItem>> };
	EquipFailed: { reason: string };

	// Skills / Gathering
	SkillExpGained: { skillId: string; amount: number; totalExp: number; level: number };
	SkillLevelUp: { skillId: string; newLevel: number };
	GatherComplete: { nodeId: string; itemId: string; quantity: number };
	GatherFailed: { reason: string };
	NodeHit: { nodeId: string; currentHits: number; hitsRequired: number };
	NodeDepleted: { nodeId: string };
	NodeRespawned: { nodeId: string };

	// Ground items
	GroundItemSpawned: {
		groundItemId: string;
		itemId: string;
		quantity: number;
		position: { x: number; y: number; z: number };
	};
	GroundItemRemoved: { groundItemId: string };

	// NPCs / Dialogue
	DialogueOpened: {
		npcId: string;
		npcName: string;
		nodeId: string;
		text: string;
		options: { label: string }[];
	};
	DialogueClosed: undefined;

	// Shopping
	ShopOpened: {
		shopId: string;
		shopName: string;
		items: { itemId: string; buyPrice: number; stock: number }[];
	};
	ShopClosed: undefined;
	ShopError: { reason: string };

	// Currency
	GoldUpdated: { gold: number };

	// Zones / Maps
	ZoneChanged: { zoneId: string; zoneName: string; zoneType: string };
	TeleportStarted: { targetMapId: string; mapName: string };
	TeleportFailed: { reason: string };
}

/**
 * Name arrays must match their interface keys.
 * Used for eager remote creation to avoid race conditions.
 */
export const SERVER_EVENT_NAMES: readonly (keyof ServerEventDefinitions)[] = [
	"Swing",
	"PickupItem",
	"DropItem",
	"MoveItem",
	"UseItem",
	"EquipItem",
	"UnequipItem",
	"InteractNPC",
	"SelectDialogueOption",
	"CloseDialogue",
	"BuyItem",
	"SellItem",
	"CloseShop",
	"RequestTeleport",
];

export const CLIENT_EVENT_NAMES: readonly (keyof ClientEventDefinitions)[] = [
	"PlayerDataLoaded",
	"PlayerDataError",
	"DamageDealt",
	"DamageTaken",
	"ExpGained",
	"LevelUp",
	"MobDied",
	"PlayerDied",
	"PlayerRespawned",
	"InventoryTabUpdated",
	"InventoryFull",
	"EquipmentUpdated",
	"EquipFailed",
	"SkillExpGained",
	"SkillLevelUp",
	"GatherComplete",
	"GatherFailed",
	"NodeHit",
	"NodeDepleted",
	"NodeRespawned",
	"GroundItemSpawned",
	"GroundItemRemoved",
	"DialogueOpened",
	"DialogueClosed",
	"ShopOpened",
	"ShopClosed",
	"ShopError",
	"GoldUpdated",
	"ZoneChanged",
	"TeleportStarted",
	"TeleportFailed",
];

/** Folder names used in ReplicatedStorage for remote organization */
export const REMOTES_FOLDER = "Remotes";
export const TO_SERVER_FOLDER = "ToServer";
export const TO_CLIENT_FOLDER = "ToClient";
