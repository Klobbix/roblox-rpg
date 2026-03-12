import { EquipmentSlot } from "shared/types/player";
import { ItemConfig, ItemType, ItemRarity } from "../types";

const HOLD = new CFrame(0.42, -0.52, -1.0).mul(CFrame.Angles(0, 0, math.rad(-5)));

export const HatchetConfigs: Record<string, ItemConfig> = {
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
		equipment: {
			equipSlot: EquipmentSlot.Weapon,
			statBonuses: { attack: 2, strength: 1 },
			levelRequirement: 1,
			attackSpeed: 2.0,
		},
		viewmodel: {
			holdOffset: HOLD,
			swingStyle: "chop",
			swingDuration: 0.42,
		},
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
		equipment: {
			equipSlot: EquipmentSlot.Weapon,
			statBonuses: { attack: 2, strength: 1 },
			levelRequirement: 1,
			attackSpeed: 2.0,
		},
		viewmodel: {
			holdOffset: HOLD,
			swingStyle: "chop",
			swingDuration: 0.40,
		},
	},
};
