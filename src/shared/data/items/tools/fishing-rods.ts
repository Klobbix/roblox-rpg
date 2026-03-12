import { EquipmentSlot } from "shared/types/player";
import { ItemConfig, ItemType, ItemRarity } from "../types";

export const FishingRodConfigs: Record<string, ItemConfig> = {
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
		equipment: {
			equipSlot: EquipmentSlot.Weapon,
			statBonuses: { attack: 2, strength: 1 },
			levelRequirement: 1,
			attackSpeed: 2.0,
		},
		viewmodel: {
			holdOffset: new CFrame(0.40, -0.50, -0.90),
			swingStyle: "cast",
			swingDuration: 0.90,
		},
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
		equipment: {
			equipSlot: EquipmentSlot.Weapon,
			statBonuses: { attack: 2, strength: 1 },
			levelRequirement: 1,
			attackSpeed: 2.0,
		},
		viewmodel: {
			holdOffset: new CFrame(0.40, -0.50, -0.90),
			swingStyle: "cast",
			swingDuration: 0.85,
		},
	},
};
