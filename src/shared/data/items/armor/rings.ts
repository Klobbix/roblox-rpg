import { ItemConfig, ItemRarity, ItemType } from "../types";
import { EquipmentSlot } from "../../../types";

export const RingConfigs: Record<string, ItemConfig> = {
	bronze_ring: {
		id: "bronze_ring",
		name: "Bronze Ring",
		itemType: ItemType.Equipment,
		rarity: ItemRarity.Common,
		description: "A ring made of bronze.",
		stackable: false,
		maxStack: 1,
		sellPrice: 5,
		equipment: {
			equipSlot: EquipmentSlot.Ring,
			statBonuses: { defense: 1 },
			levelRequirement: 1,
		},
	},
};