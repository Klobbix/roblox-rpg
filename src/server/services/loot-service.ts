import { MobConfigs } from "shared/data/mobs";
import { LootTable } from "shared/data/loot-tables";
import * as GroundItemService from "./ground-item-service";
import * as InventoryService from "./inventory-service";

// --- Public API ---

/** Roll loot for a killed mob and drop it on the ground. */
export function rollAndDropLoot(configId: string, position: Vector3, killer: Player): void {
	const mobConfig = MobConfigs[configId];
	if (!mobConfig) return;

	const drops = rollLoot(mobConfig.loot);

	for (const drop of drops) {
		// Gold coins go directly into the player's gold balance
		if (drop.itemId === "gold_coins") {
			InventoryService.addGold(killer, drop.quantity);
			continue;
		}

		// Spawn all loot as ground items with ownership priority for the killer
		const offset = new Vector3(math.random() * 4 - 2, 0, math.random() * 4 - 2);
		GroundItemService.spawnGroundItem(drop.itemId, drop.quantity, position.add(offset), killer);
	}
}

/** Roll a loot table and return the items dropped. Server-only logic. */
export function rollLoot(loot: LootTable): { itemId: string; quantity: number }[] {
	const results: { itemId: string; quantity: number }[] = [];

	for (let roll = 0; roll < loot.rolls; roll++) {
		// Each entry is rolled independently (not mutually exclusive)
		for (const entry of loot.entries) {
			// weight is the % chance of dropping
			const chance = math.random() * 100;
			if (chance <= entry.weight) {
				const qty =
					entry.minQty === entry.maxQty
						? entry.minQty
						: math.random(entry.minQty, entry.maxQty);

				// Merge with existing result for same item
				let found = false;
				for (const existing of results) {
					if (existing.itemId === entry.itemId) {
						existing.quantity += qty;
						found = true;
						break;
					}
				}
				if (!found) {
					results.push({ itemId: entry.itemId, quantity: qty });
				}
			}
		}
	}

	return results;
}

// --- Initialize ---

export function initialize(): void {
	print("[LootService] Initialized");
}
