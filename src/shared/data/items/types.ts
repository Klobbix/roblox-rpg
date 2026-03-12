import { EquipmentSlot } from "shared/types/player";

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

/** Equipment-specific fields */
export interface EquipmentData {
	equipSlot: EquipmentSlot;
	statBonuses: StatBonuses;
	levelRequirement: number;
	/** Weapon attack speed in seconds (only for Weapon slot) */
	attackSpeed?: number;
}

// --- Viewmodel ---

export type SwingStyle = "slash" | "stab" | "chop" | "cast";

/** First-person viewmodel config embedded in an item definition. */
export interface ViewmodelConfig {
	/** Position+rotation of the weapon root relative to the camera */
	holdOffset: CFrame;
	swingStyle: SwingStyle;
	/** Full swing cycle duration in seconds */
	swingDuration: number;
	/** Name of a Model inside ReplicatedStorage.Viewmodels to clone and display in-hand */
	modelName?: string;
}

/** Tool-specific fields */
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
	/** Equipment data — present on Equipment items and equippable Tools */
	equipment?: EquipmentData;
	/** Tool data — only present for Tool items */
	tool?: ToolData;
	/** First-person viewmodel — present on any item that shows a model in hand */
	viewmodel?: ViewmodelConfig;
}
