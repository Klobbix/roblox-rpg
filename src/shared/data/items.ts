import { InventoryTab, EquipmentSlot, CombatStats } from "shared/types/player";

/** Item type categories */
export enum ItemType {
	Equipment = "Equipment",
	Consumable = "Consumable",
	Material = "Material",
	Tool = "Tool",
	Quest = "Quest",
	Currency = "Currency",
}

/** Rarity tiers with display colors */
export enum ItemRarity {
	Common = "Common",
	Uncommon = "Uncommon",
	Rare = "Rare",
	Epic = "Epic",
	Legendary = "Legendary",
}

/** RGB color values for each rarity tier */
export const RARITY_COLORS: Record<ItemRarity, Color3> = {
	[ItemRarity.Common]: Color3.fromRGB(200, 200, 200),
	[ItemRarity.Uncommon]: Color3.fromRGB(30, 255, 0),
	[ItemRarity.Rare]: Color3.fromRGB(0, 112, 255),
	[ItemRarity.Epic]: Color3.fromRGB(163, 53, 238),
	[ItemRarity.Legendary]: Color3.fromRGB(255, 128, 0),
};

/** Stat bonuses provided by equipment */
export interface StatBonuses {
	maxHp?: number;
	attack?: number;
	strength?: number;
	defense?: number;
}

/** Equipment-specific fields (only present on Equipment items) */
export interface EquipmentData {
	equipSlot: EquipmentSlot;
	statBonuses: StatBonuses;
	levelRequirement: number;
	/** Weapon attack speed in seconds (only for Weapon slot) */
	attackSpeed?: number;
}

/** Tool-specific fields (only present on Tool items) */
export interface ToolData {
	skillId: string;
	/** Tier affects gather speed: higher = faster */
	tier: number;
	/** Gathering speed multiplier (1.0 = normal, lower = faster) */
	speedMultiplier: number;
	/** Minimum skill level to use this tool */
	levelRequirement: number;
}

/** Definition for a single item type */
export interface ItemConfig {
	id: string;
	name: string;
	itemType: ItemType;
	rarity: ItemRarity;
	description: string;
	stackable: boolean;
	maxStack: number;
	/** Value in gold when sold to a merchant */
	sellPrice: number;
	/** Equipment data — only present for Equipment items */
	equipment?: EquipmentData;
	/** Tool data — only present for Tool items */
	tool?: ToolData;
}

/** Map ItemType to the inventory tab it belongs in */
export function getItemTab(itemType: ItemType): InventoryTab {
	switch (itemType) {
		case ItemType.Equipment:
		case ItemType.Tool:
			return InventoryTab.Equip;
		case ItemType.Consumable:
			return InventoryTab.Use;
		case ItemType.Material:
		case ItemType.Quest:
		case ItemType.Currency:
			return InventoryTab.Etc;
	}
}

/** Get total stat bonuses from a set of equipped items */
export function getEquipmentBonuses(
	equipment: Partial<Record<EquipmentSlot, { itemId: string }>>,
): CombatStats {
	const bonuses: CombatStats = { maxHp: 0, attack: 0, strength: 0, defense: 0 };

	for (const [, item] of pairs(equipment)) {
		const config = ItemConfigs[item.itemId];
		if (!config?.equipment) continue;
		const sb = config.equipment.statBonuses;
		bonuses.maxHp += sb.maxHp ?? 0;
		bonuses.attack += sb.attack ?? 0;
		bonuses.strength += sb.strength ?? 0;
		bonuses.defense += sb.defense ?? 0;
	}

	return bonuses;
}

/** Get attack speed from equipped weapon, or default */
export function getWeaponAttackSpeed(
	equipment: Partial<Record<EquipmentSlot, { itemId: string }>>,
	defaultSpeed: number,
): number {
	const weaponItem = equipment[EquipmentSlot.Weapon];
	if (!weaponItem) return defaultSpeed;

	const config = ItemConfigs[weaponItem.itemId];
	if (!config?.equipment?.attackSpeed) return defaultSpeed;

	return config.equipment.attackSpeed;
}

export const ItemConfigs: Record<string, ItemConfig> = {
	// --- Chicken drops ---
	raw_chicken: {
		id: "raw_chicken",
		name: "Raw Chicken",
		itemType: ItemType.Material,
		rarity: ItemRarity.Common,
		description: "A piece of raw chicken meat.",
		stackable: true,
		maxStack: 99,
		sellPrice: 2,
	},
	feather: {
		id: "feather",
		name: "Feather",
		itemType: ItemType.Material,
		rarity: ItemRarity.Common,
		description: "A soft feather. Used in crafting.",
		stackable: true,
		maxStack: 99,
		sellPrice: 1,
	},

	// --- Goblin drops ---
	goblin_mail: {
		id: "goblin_mail",
		name: "Goblin Mail",
		itemType: ItemType.Equipment,
		rarity: ItemRarity.Common,
		description: "Crude armor worn by goblins.",
		stackable: false,
		maxStack: 1,
		sellPrice: 15,
		equipment: {
			equipSlot: EquipmentSlot.Body,
			statBonuses: { defense: 3 },
			levelRequirement: 1,
		},
	},
	bronze_dagger: {
		id: "bronze_dagger",
		name: "Bronze Dagger",
		itemType: ItemType.Equipment,
		rarity: ItemRarity.Common,
		description: "A short bronze dagger.",
		stackable: false,
		maxStack: 1,
		sellPrice: 10,
		equipment: {
			equipSlot: EquipmentSlot.Weapon,
			statBonuses: { attack: 2, strength: 1 },
			levelRequirement: 1,
			attackSpeed: 2.0,
		},
	},
	gold_coins: {
		id: "gold_coins",
		name: "Gold Coins",
		itemType: ItemType.Currency,
		rarity: ItemRarity.Common,
		description: "A small pile of gold coins.",
		stackable: true,
		maxStack: 9999,
		sellPrice: 0,
	},

	// --- Skeleton drops ---
	bones: {
		id: "bones",
		name: "Bones",
		itemType: ItemType.Material,
		rarity: ItemRarity.Common,
		description: "A pile of bones.",
		stackable: true,
		maxStack: 99,
		sellPrice: 3,
	},
	iron_sword: {
		id: "iron_sword",
		name: "Iron Sword",
		itemType: ItemType.Equipment,
		rarity: ItemRarity.Uncommon,
		description: "A sturdy iron sword.",
		stackable: false,
		maxStack: 1,
		sellPrice: 50,
		equipment: {
			equipSlot: EquipmentSlot.Weapon,
			statBonuses: { attack: 5, strength: 4 },
			levelRequirement: 5,
			attackSpeed: 2.4,
		},
	},
	skull: {
		id: "skull",
		name: "Skull",
		itemType: ItemType.Material,
		rarity: ItemRarity.Uncommon,
		description: "A grim skull. Some collectors may want this.",
		stackable: true,
		maxStack: 99,
		sellPrice: 10,
	},

	// --- Inventory expansion ---
	slot_expansion_scroll: {
		id: "slot_expansion_scroll",
		name: "Slot Expansion Scroll",
		itemType: ItemType.Consumable,
		rarity: ItemRarity.Rare,
		description: "Use on an inventory tab to add 8 extra slots. Can expand up to 96 slots per tab.",
		stackable: true,
		maxStack: 10,
		sellPrice: 500,
	},

	// --- Additional equipment ---
	bronze_helm: {
		id: "bronze_helm",
		name: "Bronze Helm",
		itemType: ItemType.Equipment,
		rarity: ItemRarity.Common,
		description: "A simple bronze helmet.",
		stackable: false,
		maxStack: 1,
		sellPrice: 8,
		equipment: {
			equipSlot: EquipmentSlot.Head,
			statBonuses: { defense: 2 },
			levelRequirement: 1,
		},
	},
	iron_platebody: {
		id: "iron_platebody",
		name: "Iron Platebody",
		itemType: ItemType.Equipment,
		rarity: ItemRarity.Uncommon,
		description: "A solid iron platebody.",
		stackable: false,
		maxStack: 1,
		sellPrice: 80,
		equipment: {
			equipSlot: EquipmentSlot.Body,
			statBonuses: { defense: 8, maxHp: 5 },
			levelRequirement: 5,
		},
	},
	iron_shield: {
		id: "iron_shield",
		name: "Iron Shield",
		itemType: ItemType.Equipment,
		rarity: ItemRarity.Uncommon,
		description: "A sturdy iron shield.",
		stackable: false,
		maxStack: 1,
		sellPrice: 40,
		equipment: {
			equipSlot: EquipmentSlot.Shield,
			statBonuses: { defense: 5 },
			levelRequirement: 5,
		},
	},
	leather_boots: {
		id: "leather_boots",
		name: "Leather Boots",
		itemType: ItemType.Equipment,
		rarity: ItemRarity.Common,
		description: "Simple leather boots.",
		stackable: false,
		maxStack: 1,
		sellPrice: 5,
		equipment: {
			equipSlot: EquipmentSlot.Feet,
			statBonuses: { defense: 1 },
			levelRequirement: 1,
		},
	},
	leather_gloves: {
		id: "leather_gloves",
		name: "Leather Gloves",
		itemType: ItemType.Equipment,
		rarity: ItemRarity.Common,
		description: "Simple leather gloves.",
		stackable: false,
		maxStack: 1,
		sellPrice: 5,
		equipment: {
			equipSlot: EquipmentSlot.Hands,
			statBonuses: { attack: 1 },
			levelRequirement: 1,
		},
	},
	bronze_legs: {
		id: "bronze_legs",
		name: "Bronze Platelegs",
		itemType: ItemType.Equipment,
		rarity: ItemRarity.Common,
		description: "Bronze platelegs.",
		stackable: false,
		maxStack: 1,
		sellPrice: 12,
		equipment: {
			equipSlot: EquipmentSlot.Legs,
			statBonuses: { defense: 2 },
			levelRequirement: 1,
		},
	},

	// ===== TOOLS =====

	// --- Pickaxes (Mining) ---
	bronze_pickaxe: {
		id: "bronze_pickaxe",
		name: "Bronze Pickaxe",
		itemType: ItemType.Tool,
		rarity: ItemRarity.Common,
		description: "A basic bronze pickaxe for mining.",
		stackable: false,
		maxStack: 1,
		sellPrice: 10,
		tool: { skillId: "mining", tier: 1, speedMultiplier: 1.0, levelRequirement: 1 },
	},
	iron_pickaxe: {
		id: "iron_pickaxe",
		name: "Iron Pickaxe",
		itemType: ItemType.Tool,
		rarity: ItemRarity.Uncommon,
		description: "A solid iron pickaxe. Mines faster.",
		stackable: false,
		maxStack: 1,
		sellPrice: 50,
		tool: { skillId: "mining", tier: 2, speedMultiplier: 0.75, levelRequirement: 10 },
	},
	steel_pickaxe: {
		id: "steel_pickaxe",
		name: "Steel Pickaxe",
		itemType: ItemType.Tool,
		rarity: ItemRarity.Rare,
		description: "A sturdy steel pickaxe. Much faster mining.",
		stackable: false,
		maxStack: 1,
		sellPrice: 200,
		tool: { skillId: "mining", tier: 3, speedMultiplier: 0.5, levelRequirement: 30 },
	},

	// --- Hatchets (Woodcutting) ---
	bronze_hatchet: {
		id: "bronze_hatchet",
		name: "Bronze Hatchet",
		itemType: ItemType.Tool,
		rarity: ItemRarity.Common,
		description: "A basic bronze hatchet for woodcutting.",
		stackable: false,
		maxStack: 1,
		sellPrice: 10,
		tool: { skillId: "woodcutting", tier: 1, speedMultiplier: 1.0, levelRequirement: 1 },
	},
	iron_hatchet: {
		id: "iron_hatchet",
		name: "Iron Hatchet",
		itemType: ItemType.Tool,
		rarity: ItemRarity.Uncommon,
		description: "A solid iron hatchet. Chops faster.",
		stackable: false,
		maxStack: 1,
		sellPrice: 50,
		tool: { skillId: "woodcutting", tier: 2, speedMultiplier: 0.75, levelRequirement: 10 },
	},
	steel_hatchet: {
		id: "steel_hatchet",
		name: "Steel Hatchet",
		itemType: ItemType.Tool,
		rarity: ItemRarity.Rare,
		description: "A sturdy steel hatchet. Much faster chopping.",
		stackable: false,
		maxStack: 1,
		sellPrice: 200,
		tool: { skillId: "woodcutting", tier: 3, speedMultiplier: 0.5, levelRequirement: 30 },
	},

	// --- Fishing Rods ---
	fishing_rod: {
		id: "fishing_rod",
		name: "Fishing Rod",
		itemType: ItemType.Tool,
		rarity: ItemRarity.Common,
		description: "A simple fishing rod.",
		stackable: false,
		maxStack: 1,
		sellPrice: 10,
		tool: { skillId: "fishing", tier: 1, speedMultiplier: 1.0, levelRequirement: 1 },
	},
	steel_fishing_rod: {
		id: "steel_fishing_rod",
		name: "Steel Fishing Rod",
		itemType: ItemType.Tool,
		rarity: ItemRarity.Rare,
		description: "A high-quality steel fishing rod. Much faster catches.",
		stackable: false,
		maxStack: 1,
		sellPrice: 200,
		tool: { skillId: "fishing", tier: 3, speedMultiplier: 0.5, levelRequirement: 20 },
	},

	// ===== GATHERING MATERIALS =====

	copper_ore: {
		id: "copper_ore",
		name: "Copper Ore",
		itemType: ItemType.Material,
		rarity: ItemRarity.Common,
		description: "A chunk of copper ore.",
		stackable: true,
		maxStack: 99,
		sellPrice: 5,
	},
	tin_ore: {
		id: "tin_ore",
		name: "Tin Ore",
		itemType: ItemType.Material,
		rarity: ItemRarity.Common,
		description: "A chunk of tin ore.",
		stackable: true,
		maxStack: 99,
		sellPrice: 5,
	},
	iron_ore: {
		id: "iron_ore",
		name: "Iron Ore",
		itemType: ItemType.Material,
		rarity: ItemRarity.Uncommon,
		description: "A chunk of iron ore.",
		stackable: true,
		maxStack: 99,
		sellPrice: 15,
	},
	logs: {
		id: "logs",
		name: "Logs",
		itemType: ItemType.Material,
		rarity: ItemRarity.Common,
		description: "A bundle of normal logs.",
		stackable: true,
		maxStack: 99,
		sellPrice: 4,
	},
	oak_logs: {
		id: "oak_logs",
		name: "Oak Logs",
		itemType: ItemType.Material,
		rarity: ItemRarity.Uncommon,
		description: "A bundle of sturdy oak logs.",
		stackable: true,
		maxStack: 99,
		sellPrice: 12,
	},
	raw_shrimp: {
		id: "raw_shrimp",
		name: "Raw Shrimp",
		itemType: ItemType.Material,
		rarity: ItemRarity.Common,
		description: "A freshly caught shrimp.",
		stackable: true,
		maxStack: 99,
		sellPrice: 3,
	},
	raw_trout: {
		id: "raw_trout",
		name: "Raw Trout",
		itemType: ItemType.Material,
		rarity: ItemRarity.Uncommon,
		description: "A freshly caught trout.",
		stackable: true,
		maxStack: 99,
		sellPrice: 10,
	},
};
