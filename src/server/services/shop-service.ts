import { Players } from "@rbxts/services";
import { ShopConfigs, SELL_PRICE_MULTIPLIER } from "shared/data/shops";
import { ItemConfigs } from "shared/data/items";
import { fireClient } from "server/network/server-network";
import * as PlayerDataService from "./player-data-service";
import * as InventoryService from "./inventory-service";
import * as NPCService from "./npc-service";

// --- State ---

/** Track which shop each player has open */
const playerShops = new Map<Player, string>();

// --- Public API ---

/** Open a shop for a player. */
export function openShop(player: Player, shopId: string): void {
	const shopConfig = ShopConfigs[shopId];
	if (!shopConfig) {
		warn(`[ShopService] Unknown shop: ${shopId}`);
		return;
	}

	playerShops.set(player, shopId);

	const items = shopConfig.items.map((shopItem) => ({
		itemId: shopItem.itemId,
		buyPrice: shopItem.buyPrice,
		stock: shopItem.stock ?? -1, // -1 = unlimited
	}));

	fireClient(player, "ShopOpened", {
		shopId,
		shopName: shopConfig.name,
		items,
	});
}

/** Close the shop for a player. */
export function closeShop(player: Player): void {
	if (playerShops.has(player)) {
		playerShops.delete(player);
		fireClient(player, "ShopClosed", undefined);
	}
}

/** Buy an item from a shop. */
export function buyItem(player: Player, shopId: string, itemIndex: number, quantity: number): void {
	if (quantity <= 0 || quantity > 99) {
		fireClient(player, "ShopError", { reason: "Invalid quantity." });
		return;
	}

	// Verify player has this shop open
	if (playerShops.get(player) !== shopId) {
		fireClient(player, "ShopError", { reason: "Shop not open." });
		return;
	}

	const shopConfig = ShopConfigs[shopId];
	if (!shopConfig) return;

	if (itemIndex < 0 || itemIndex >= shopConfig.items.size()) {
		fireClient(player, "ShopError", { reason: "Invalid item." });
		return;
	}

	const shopItem = shopConfig.items[itemIndex];
	const itemConfig = ItemConfigs[shopItem.itemId];
	if (!itemConfig) return;

	const totalCost = shopItem.buyPrice * quantity;

	// Check gold
	const profile = PlayerDataService.getProfile(player);
	if (!profile) return;

	if (profile.gold < totalCost) {
		fireClient(player, "ShopError", { reason: "Not enough gold." });
		return;
	}

	// Check inventory space
	if (!InventoryService.canAddItem(player, shopItem.itemId, quantity)) {
		fireClient(player, "ShopError", { reason: "Inventory full." });
		return;
	}

	// Deduct gold
	profile.gold -= totalCost;
	fireClient(player, "GoldUpdated", { gold: profile.gold });

	// Add item
	InventoryService.addItem(player, shopItem.itemId, quantity);
}

/** Sell an item from inventory. */
export function sellItem(
	player: Player,
	tab: string,
	slotIndex: number,
	quantity: number,
): void {
	if (quantity <= 0) {
		fireClient(player, "ShopError", { reason: "Invalid quantity." });
		return;
	}

	// Must have a shop open to sell
	if (!playerShops.has(player)) {
		fireClient(player, "ShopError", { reason: "No shop open." });
		return;
	}

	const profile = PlayerDataService.getProfile(player);
	if (!profile) return;

	const tabData = profile.inventory[tab as keyof typeof profile.inventory];
	if (!tabData) return;

	if (slotIndex < 0 || slotIndex >= tabData.slotCount) return;

	const slot = tabData.slots[slotIndex];
	if (slot === undefined) return;

	const itemConfig = ItemConfigs[slot.itemId];
	if (!itemConfig) return;

	if (itemConfig.sellPrice <= 0) {
		fireClient(player, "ShopError", { reason: "This item cannot be sold." });
		return;
	}

	const actualQuantity = math.min(quantity, slot.quantity);
	const totalGold = math.floor(itemConfig.sellPrice * actualQuantity);

	// Remove item
	const removed = InventoryService.removeFromSlot(
		player,
		tab as keyof typeof profile.inventory,
		slotIndex,
		actualQuantity,
	);
	if (!removed) return;

	// Add gold
	profile.gold += totalGold;
	fireClient(player, "GoldUpdated", { gold: profile.gold });
}

// --- Initialize ---

export function initialize(): void {
	// Wire up the callback from NPCService
	NPCService.setShopOpenCallback((player, shopId) => {
		openShop(player, shopId);
	});

	NPCService.setGiveItemCallback((player, itemId, quantity) => {
		InventoryService.addItem(player, itemId, quantity);
	});

	// Clean up on leave
	Players.PlayerRemoving.Connect((player) => {
		playerShops.delete(player);
	});

	print("[ShopService] Initialized");
}
