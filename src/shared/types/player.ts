/** Combat-related stats */
export interface CombatStats {
	maxHp: number;
	attack: number;
	strength: number;
	defense: number;
}

/** Progress tracking for a single skill */
export interface SkillProgress {
	level: number;
	exp: number;
}

/** A single inventory slot */
export interface InventoryItem {
	itemId: string;
	quantity: number;
}

/** Equipment slot identifiers */
export enum EquipmentSlot {
	Head = "Head",
	Body = "Body",
	Legs = "Legs",
	Feet = "Feet",
	Hands = "Hands",
	Weapon = "Weapon",
	Shield = "Shield",
	Ring = "Ring",
	Amulet = "Amulet",
	Cape = "Cape",
}

/** MapleStory-style inventory tabs */
export enum InventoryTab {
	Equip = "Equip",
	Use = "Use",
	Etc = "Etc",
}

/** A single tab's inventory data */
export interface TabInventory {
	slots: (InventoryItem | undefined)[];
	/** Current max slots (expandable via consumable) */
	slotCount: number;
}

/** Default starting slots per tab */
export const DEFAULT_TAB_SLOTS = 24;
/** How many slots each expansion scroll adds */
export const SLOTS_PER_EXPANSION = 8;
/** Maximum slots a tab can be expanded to */
export const MAX_TAB_SLOTS = 96;

/** All inventory tab keys for iteration */
export const INVENTORY_TABS: readonly InventoryTab[] = [
	InventoryTab.Equip,
	InventoryTab.Use,
	InventoryTab.Etc,
];

/** Complete player save data */
export interface PlayerProfile {
	version: number;
	combatLevel: number;
	combatExp: number;
	gold: number;
	skills: Record<string, SkillProgress>;
	inventory: Record<InventoryTab, TabInventory>;
	equipment: Partial<Record<EquipmentSlot, InventoryItem>>;
}

function createDefaultTab(): TabInventory {
	return { slots: [], slotCount: DEFAULT_TAB_SLOTS };
}

/** Default profile for new players */
export const DEFAULT_PROFILE: PlayerProfile = {
	version: 2,
	combatLevel: 1,
	combatExp: 0,
	gold: 0,
	skills: {},
	inventory: {
		[InventoryTab.Equip]: createDefaultTab(),
		[InventoryTab.Use]: createDefaultTab(),
		[InventoryTab.Etc]: createDefaultTab(),
	},
	equipment: {},
};
