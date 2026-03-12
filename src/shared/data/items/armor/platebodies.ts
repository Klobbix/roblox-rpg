import { ItemConfig, ItemRarity, ItemType } from "../types";
import { EquipmentSlot } from "../../../types";

export const PlatebodyConfigs: Record<string, ItemConfig> = {
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
};
