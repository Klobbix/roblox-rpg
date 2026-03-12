import { EquipmentSlot } from "shared/types/player";
import { ItemConfig, ItemType, ItemRarity } from "../types";

const HOLD = new CFrame(0.42, -0.55, -1.05).mul(CFrame.Angles(0, 0, math.rad(-5)));

export const PickaxeConfigs: Record<string, ItemConfig> = {
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
		viewmodel: {
			holdOffset: new CFrame(1.0, -0.5, -1.2),
			swingStyle: "chop",
			swingDuration: 0.5,
			modelName: "BronzePickaxe",
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
		viewmodel: {
			holdOffset: HOLD,
			swingStyle: "chop",
			swingDuration: 0.48,
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
		viewmodel: {
			holdOffset: HOLD,
			swingStyle: "chop",
			swingDuration: 0.45,
		},
	},
};
