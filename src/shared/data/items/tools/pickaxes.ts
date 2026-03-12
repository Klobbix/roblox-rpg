import { EquipmentSlot } from "shared/types/player";
import { ItemConfig, ItemType, ItemRarity } from "../types";

export const PickaxeConfigs: Record<string, ItemConfig> = {
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
		equipment: {
			equipSlot: EquipmentSlot.Weapon,
			statBonuses: { attack: 2, strength: 1 },
			levelRequirement: 1,
			attackSpeed: 2.0,
		},
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
		equipment: {
			equipSlot: EquipmentSlot.Weapon,
			statBonuses: { attack: 2, strength: 1 },
			levelRequirement: 1,
			attackSpeed: 2.0,
		},
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
		equipment: {
			equipSlot: EquipmentSlot.Weapon,
			statBonuses: { attack: 2, strength: 1 },
			levelRequirement: 1,
			attackSpeed: 2.0,
		},
	}
};
