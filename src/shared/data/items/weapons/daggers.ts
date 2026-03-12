import { ItemConfig, ItemRarity, ItemType } from "../types";
import { EquipmentSlot } from "../../../types";

export const DaggerConfigs: Record<string, ItemConfig> = {
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
};