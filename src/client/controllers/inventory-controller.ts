import { Players, UserInputService } from "@rbxts/services";
import * as CursorController from "./cursor-controller";
import {
	InventoryItem,
	InventoryTab,
	TabInventory,
	EquipmentSlot,
	DEFAULT_TAB_SLOTS,
	INVENTORY_TABS,
} from "shared/types/player";
import { ItemConfigs, RARITY_COLORS } from "shared/data/items";
import { fireServer, onClientEvent } from "client/network/client-network";

const localPlayer = Players.LocalPlayer;
const playerGui = localPlayer.WaitForChild("PlayerGui") as PlayerGui;

const GRID_COLS = 4;
const SLOT_SIZE = 46;
const SLOT_PADDING = 3;
const TAB_HEIGHT = 28;
const BG_COLOR = Color3.fromRGB(30, 30, 30);
const SLOT_COLOR = Color3.fromRGB(60, 60, 60);
const SLOT_HOVER_COLOR = Color3.fromRGB(80, 80, 80);
const SELECTED_SLOT_COLOR = Color3.fromRGB(100, 100, 40);
const TAB_ACTIVE_COLOR = Color3.fromRGB(50, 50, 50);
const TAB_INACTIVE_COLOR = Color3.fromRGB(35, 35, 35);

const EQUIP_SLOT_SIZE = 42;
const EQUIP_PANEL_WIDTH = 180;
const EQUIP_SLOT_COLOR = Color3.fromRGB(45, 45, 55);
const EQUIP_SLOT_HOVER = Color3.fromRGB(65, 65, 80);

const TAB_LABELS: Record<InventoryTab, string> = {
	[InventoryTab.Equip]: "Equip",
	[InventoryTab.Use]: "Use",
	[InventoryTab.Etc]: "Etc",
};

/** Paper-doll layout: slot name and position offset from panel center */
const EQUIP_LAYOUT: { slot: EquipmentSlot; label: string; x: number; y: number }[] = [
	{ slot: EquipmentSlot.Head, label: "Head", x: 0, y: 0 },
	{ slot: EquipmentSlot.Cape, label: "Cape", x: -1, y: 1 },
	{ slot: EquipmentSlot.Amulet, label: "Neck", x: 0, y: 1 },
	{ slot: EquipmentSlot.Weapon, label: "Wep", x: -1, y: 2 },
	{ slot: EquipmentSlot.Body, label: "Body", x: 0, y: 2 },
	{ slot: EquipmentSlot.Shield, label: "Shld", x: 1, y: 2 },
	{ slot: EquipmentSlot.Legs, label: "Legs", x: 0, y: 3 },
	{ slot: EquipmentSlot.Hands, label: "Hand", x: -1, y: 4 },
	{ slot: EquipmentSlot.Feet, label: "Feet", x: 0, y: 4 },
	{ slot: EquipmentSlot.Ring, label: "Ring", x: 1, y: 4 },
];

// --- State ---

const tabInventories: Record<InventoryTab, TabInventory> = {
	[InventoryTab.Equip]: { slots: [], slotCount: DEFAULT_TAB_SLOTS },
	[InventoryTab.Use]: { slots: [], slotCount: DEFAULT_TAB_SLOTS },
	[InventoryTab.Etc]: { slots: [], slotCount: DEFAULT_TAB_SLOTS },
};

let equipment: Partial<Record<EquipmentSlot, InventoryItem>> = {};
let activeTab: InventoryTab = InventoryTab.Equip;
let inventoryOpen = false;
let selectedSlot: number | undefined;
let playerLevel = 1;

// --- UI References ---

let screenGui: ScreenGui;
let inventoryFrame: Frame;
let slotsContainer: Frame;
let equipmentPanel: Frame;
let tooltipFrame: Frame;
let tooltipName: TextLabel;
let tooltipDesc: TextLabel;
let tooltipStats: TextLabel;
let slotCountLabel: TextLabel;
const tabButtons: Map<InventoryTab, TextButton> = new Map();
const slotFrames: Frame[] = [];
const equipSlotFrames: Map<EquipmentSlot, Frame> = new Map();

// --- UI Construction ---

function createUI(): void {
	screenGui = new Instance("ScreenGui");
	screenGui.Name = "InventoryUI";
	screenGui.ResetOnSpawn = false;
	screenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling;
	screenGui.Parent = playerGui;

	const invWidth = GRID_COLS * (SLOT_SIZE + SLOT_PADDING) + SLOT_PADDING;

	inventoryFrame = new Instance("Frame");
	inventoryFrame.Name = "InventoryFrame";
	inventoryFrame.Size = new UDim2(0, invWidth, 0, 400);
	inventoryFrame.Position = new UDim2(1, -invWidth - 10, 0.5, -200);
	inventoryFrame.BackgroundColor3 = BG_COLOR;
	inventoryFrame.BorderSizePixel = 0;
	inventoryFrame.Visible = false;
	inventoryFrame.Parent = screenGui;

	const corner = new Instance("UICorner");
	corner.CornerRadius = new UDim(0, 6);
	corner.Parent = inventoryFrame;

	// Tab buttons
	const tabWidth = math.floor(invWidth / INVENTORY_TABS.size());
	for (let i = 0; i < INVENTORY_TABS.size(); i++) {
		const tab = INVENTORY_TABS[i];

		const btn = new Instance("TextButton");
		btn.Name = `Tab_${tab}`;
		btn.Size = new UDim2(0, tabWidth, 0, TAB_HEIGHT);
		btn.Position = new UDim2(0, i * tabWidth, 0, 0);
		btn.BackgroundColor3 = tab === activeTab ? TAB_ACTIVE_COLOR : TAB_INACTIVE_COLOR;
		btn.BorderSizePixel = 0;
		btn.Text = TAB_LABELS[tab];
		btn.TextColor3 = Color3.fromRGB(220, 220, 220);
		btn.TextSize = 13;
		btn.Font = Enum.Font.GothamBold;
		btn.Parent = inventoryFrame;

		const btnCorner = new Instance("UICorner");
		btnCorner.CornerRadius = new UDim(0, 4);
		btnCorner.Parent = btn;

		const capturedTab = tab;
		btn.MouseButton1Click.Connect(() => {
			switchTab(capturedTab);
		});

		tabButtons.set(tab, btn);
	}

	// Slot count label
	slotCountLabel = new Instance("TextLabel");
	slotCountLabel.Name = "SlotCount";
	slotCountLabel.Size = new UDim2(1, -8, 0, 16);
	slotCountLabel.Position = new UDim2(0, 4, 0, TAB_HEIGHT + 2);
	slotCountLabel.BackgroundTransparency = 1;
	slotCountLabel.Text = "";
	slotCountLabel.TextColor3 = Color3.fromRGB(150, 150, 150);
	slotCountLabel.TextSize = 11;
	slotCountLabel.Font = Enum.Font.Gotham;
	slotCountLabel.TextXAlignment = Enum.TextXAlignment.Right;
	slotCountLabel.Parent = inventoryFrame;

	// Slots container
	slotsContainer = new Instance("Frame");
	slotsContainer.Name = "SlotsContainer";
	slotsContainer.Size = new UDim2(1, 0, 1, -(TAB_HEIGHT + 20));
	slotsContainer.Position = new UDim2(0, 0, 0, TAB_HEIGHT + 20);
	slotsContainer.BackgroundTransparency = 1;
	slotsContainer.ClipsDescendants = true;
	slotsContainer.Parent = inventoryFrame;

	// Equipment panel (left of inventory)
	createEquipmentPanel();

	// Tooltip
	createTooltip();
}

function createEquipmentPanel(): void {
	const panelHeight = 5 * (EQUIP_SLOT_SIZE + SLOT_PADDING) + SLOT_PADDING + 26;

	equipmentPanel = new Instance("Frame");
	equipmentPanel.Name = "EquipmentPanel";
	equipmentPanel.Size = new UDim2(0, EQUIP_PANEL_WIDTH, 0, panelHeight);
	equipmentPanel.Position = new UDim2(0, -EQUIP_PANEL_WIDTH - 6, 0, 0);
	equipmentPanel.BackgroundColor3 = BG_COLOR;
	equipmentPanel.BorderSizePixel = 0;
	equipmentPanel.Parent = inventoryFrame;

	const corner = new Instance("UICorner");
	corner.CornerRadius = new UDim(0, 6);
	corner.Parent = equipmentPanel;

	// Title
	const title = new Instance("TextLabel");
	title.Name = "Title";
	title.Size = new UDim2(1, 0, 0, 22);
	title.Position = new UDim2(0, 0, 0, 2);
	title.BackgroundTransparency = 1;
	title.Text = "Equipment";
	title.TextColor3 = Color3.fromRGB(220, 220, 220);
	title.TextSize = 14;
	title.Font = Enum.Font.GothamBold;
	title.Parent = equipmentPanel;

	// Grid center offset: 3 columns (x = -1, 0, 1)
	const centerX = math.floor(EQUIP_PANEL_WIDTH / 2);

	for (const entry of EQUIP_LAYOUT) {
		const px = centerX + entry.x * (EQUIP_SLOT_SIZE + SLOT_PADDING) - EQUIP_SLOT_SIZE / 2;
		const py = 26 + entry.y * (EQUIP_SLOT_SIZE + SLOT_PADDING);

		const slotFrame = new Instance("Frame");
		slotFrame.Name = `Equip_${entry.slot}`;
		slotFrame.Size = new UDim2(0, EQUIP_SLOT_SIZE, 0, EQUIP_SLOT_SIZE);
		slotFrame.Position = new UDim2(0, px, 0, py);
		slotFrame.BackgroundColor3 = EQUIP_SLOT_COLOR;
		slotFrame.BorderSizePixel = 0;
		slotFrame.Parent = equipmentPanel;

		const slotCorner = new Instance("UICorner");
		slotCorner.CornerRadius = new UDim(0, 4);
		slotCorner.Parent = slotFrame;

		// Slot label (shown when empty)
		const slotLabel = new Instance("TextLabel");
		slotLabel.Name = "SlotLabel";
		slotLabel.Size = UDim2.fromScale(1, 1);
		slotLabel.BackgroundTransparency = 1;
		slotLabel.Text = entry.label;
		slotLabel.TextColor3 = Color3.fromRGB(80, 80, 90);
		slotLabel.TextSize = 9;
		slotLabel.Font = Enum.Font.Gotham;
		slotLabel.Parent = slotFrame;

		// Item name (shown when equipped)
		const nameLabel = new Instance("TextLabel");
		nameLabel.Name = "ItemName";
		nameLabel.Size = new UDim2(1, -4, 1, -4);
		nameLabel.Position = new UDim2(0, 2, 0, 2);
		nameLabel.BackgroundTransparency = 1;
		nameLabel.Text = "";
		nameLabel.TextColor3 = Color3.fromRGB(255, 255, 255);
		nameLabel.TextSize = 9;
		nameLabel.Font = Enum.Font.GothamBold;
		nameLabel.TextWrapped = true;
		nameLabel.TextXAlignment = Enum.TextXAlignment.Center;
		nameLabel.TextYAlignment = Enum.TextYAlignment.Center;
		nameLabel.Parent = slotFrame;

		// Click button
		const button = new Instance("TextButton");
		button.Name = "Button";
		button.Size = UDim2.fromScale(1, 1);
		button.BackgroundTransparency = 1;
		button.Text = "";
		button.Parent = slotFrame;

		const capturedSlot = entry.slot;

		button.MouseButton1Click.Connect(() => {
			onEquipSlotClick(capturedSlot);
		});

		button.MouseEnter.Connect(() => {
			slotFrame.BackgroundColor3 = EQUIP_SLOT_HOVER;
			showEquipTooltip(capturedSlot);
		});

		button.MouseLeave.Connect(() => {
			slotFrame.BackgroundColor3 = EQUIP_SLOT_COLOR;
			hideTooltip();
		});

		equipSlotFrames.set(entry.slot, slotFrame);
	}
}

function createTooltip(): void {
	tooltipFrame = new Instance("Frame");
	tooltipFrame.Name = "Tooltip";
	tooltipFrame.Size = new UDim2(0, 200, 0, 80);
	tooltipFrame.BackgroundColor3 = Color3.fromRGB(20, 20, 20);
	tooltipFrame.BorderSizePixel = 0;
	tooltipFrame.Visible = false;
	tooltipFrame.ZIndex = 10;
	tooltipFrame.Parent = screenGui;

	const tooltipCorner = new Instance("UICorner");
	tooltipCorner.CornerRadius = new UDim(0, 4);
	tooltipCorner.Parent = tooltipFrame;

	tooltipName = new Instance("TextLabel");
	tooltipName.Name = "Name";
	tooltipName.Size = new UDim2(1, -8, 0, 18);
	tooltipName.Position = new UDim2(0, 4, 0, 4);
	tooltipName.BackgroundTransparency = 1;
	tooltipName.TextColor3 = Color3.fromRGB(255, 255, 255);
	tooltipName.TextSize = 14;
	tooltipName.Font = Enum.Font.GothamBold;
	tooltipName.TextXAlignment = Enum.TextXAlignment.Left;
	tooltipName.ZIndex = 11;
	tooltipName.Parent = tooltipFrame;

	tooltipDesc = new Instance("TextLabel");
	tooltipDesc.Name = "Description";
	tooltipDesc.Size = new UDim2(1, -8, 0, 26);
	tooltipDesc.Position = new UDim2(0, 4, 0, 22);
	tooltipDesc.BackgroundTransparency = 1;
	tooltipDesc.TextColor3 = Color3.fromRGB(180, 180, 180);
	tooltipDesc.TextSize = 11;
	tooltipDesc.Font = Enum.Font.Gotham;
	tooltipDesc.TextWrapped = true;
	tooltipDesc.TextXAlignment = Enum.TextXAlignment.Left;
	tooltipDesc.TextYAlignment = Enum.TextYAlignment.Top;
	tooltipDesc.ZIndex = 11;
	tooltipDesc.Parent = tooltipFrame;

	tooltipStats = new Instance("TextLabel");
	tooltipStats.Name = "Stats";
	tooltipStats.Size = new UDim2(1, -8, 0, 30);
	tooltipStats.Position = new UDim2(0, 4, 0, 48);
	tooltipStats.BackgroundTransparency = 1;
	tooltipStats.TextColor3 = Color3.fromRGB(100, 200, 100);
	tooltipStats.TextSize = 11;
	tooltipStats.Font = Enum.Font.Gotham;
	tooltipStats.TextWrapped = true;
	tooltipStats.TextXAlignment = Enum.TextXAlignment.Left;
	tooltipStats.TextYAlignment = Enum.TextYAlignment.Top;
	tooltipStats.ZIndex = 11;
	tooltipStats.Parent = tooltipFrame;
}

function rebuildSlots(): void {
	for (const slot of slotFrames) {
		slot.Destroy();
	}
	slotFrames.clear();

	const tabData = tabInventories[activeTab];
	const slotCount = tabData.slotCount;
	const rows = math.ceil(slotCount / GRID_COLS);
	const invWidth = GRID_COLS * (SLOT_SIZE + SLOT_PADDING) + SLOT_PADDING;
	const gridHeight = rows * (SLOT_SIZE + SLOT_PADDING) + SLOT_PADDING;
	const totalHeight = TAB_HEIGHT + 20 + gridHeight + SLOT_PADDING;

	inventoryFrame.Size = new UDim2(0, invWidth, 0, totalHeight);
	inventoryFrame.Position = new UDim2(1, -invWidth - 10, 0.5, -totalHeight / 2);

	for (let i = 0; i < slotCount; i++) {
		const col = i % GRID_COLS;
		const row = math.floor(i / GRID_COLS);

		const slot = new Instance("Frame");
		slot.Name = `Slot_${i}`;
		slot.Size = new UDim2(0, SLOT_SIZE, 0, SLOT_SIZE);
		slot.Position = new UDim2(
			0,
			SLOT_PADDING + col * (SLOT_SIZE + SLOT_PADDING),
			0,
			SLOT_PADDING + row * (SLOT_SIZE + SLOT_PADDING),
		);
		slot.BackgroundColor3 = SLOT_COLOR;
		slot.BorderSizePixel = 0;
		slot.Parent = slotsContainer;

		const slotCorner = new Instance("UICorner");
		slotCorner.CornerRadius = new UDim(0, 4);
		slotCorner.Parent = slot;

		const nameLabel = new Instance("TextLabel");
		nameLabel.Name = "ItemName";
		nameLabel.Size = new UDim2(1, -4, 0.6, 0);
		nameLabel.Position = new UDim2(0, 2, 0, 2);
		nameLabel.BackgroundTransparency = 1;
		nameLabel.Text = "";
		nameLabel.TextColor3 = Color3.fromRGB(255, 255, 255);
		nameLabel.TextSize = 10;
		nameLabel.Font = Enum.Font.GothamBold;
		nameLabel.TextWrapped = true;
		nameLabel.TextXAlignment = Enum.TextXAlignment.Center;
		nameLabel.TextYAlignment = Enum.TextYAlignment.Center;
		nameLabel.Parent = slot;

		const qtyLabel = new Instance("TextLabel");
		qtyLabel.Name = "Quantity";
		qtyLabel.Size = new UDim2(1, -4, 0, 14);
		qtyLabel.Position = new UDim2(0, 2, 1, -16);
		qtyLabel.BackgroundTransparency = 1;
		qtyLabel.Text = "";
		qtyLabel.TextColor3 = Color3.fromRGB(255, 255, 100);
		qtyLabel.TextSize = 11;
		qtyLabel.Font = Enum.Font.GothamBold;
		qtyLabel.TextXAlignment = Enum.TextXAlignment.Right;
		qtyLabel.Parent = slot;

		const button = new Instance("TextButton");
		button.Name = "Button";
		button.Size = UDim2.fromScale(1, 1);
		button.BackgroundTransparency = 1;
		button.Text = "";
		button.Parent = slot;

		const slotIndex = i;

		button.MouseButton1Click.Connect(() => {
			onSlotLeftClick(slotIndex);
		});

		button.MouseButton2Click.Connect(() => {
			onSlotRightClick(slotIndex);
		});

		button.MouseEnter.Connect(() => {
			if (selectedSlot !== slotIndex) {
				slot.BackgroundColor3 = SLOT_HOVER_COLOR;
			}
			showTooltip(slotIndex);
		});

		button.MouseLeave.Connect(() => {
			if (selectedSlot !== slotIndex) {
				slot.BackgroundColor3 = SLOT_COLOR;
			}
			hideTooltip();
		});

		slotFrames.push(slot);
	}

	refreshSlots();
	refreshEquipment();
}

// --- UI Updates ---

function refreshSlots(): void {
	const tabData = tabInventories[activeTab];

	let usedSlots = 0;
	for (let i = 0; i < tabData.slotCount; i++) {
		if (tabData.slots[i] !== undefined) {
			usedSlots++;
		}
	}
	slotCountLabel.Text = `${usedSlots}/${tabData.slotCount}`;

	for (let i = 0; i < slotFrames.size(); i++) {
		const slot = slotFrames[i];
		const nameLabel = slot.FindFirstChild("ItemName") as TextLabel;
		const qtyLabel = slot.FindFirstChild("Quantity") as TextLabel;
		const item = tabData.slots[i];

		if (item !== undefined) {
			const config = ItemConfigs[item.itemId];
			nameLabel.Text = config ? config.name : item.itemId;
			nameLabel.TextColor3 = config
				? RARITY_COLORS[config.rarity]
				: Color3.fromRGB(255, 255, 255);
			qtyLabel.Text = item.quantity > 1 ? tostring(item.quantity) : "";
		} else {
			nameLabel.Text = "";
			qtyLabel.Text = "";
		}

		if (selectedSlot === i) {
			slot.BackgroundColor3 = SELECTED_SLOT_COLOR;
		} else {
			slot.BackgroundColor3 = SLOT_COLOR;
		}
	}

	tabButtons.forEach((btn, tab) => {
		btn.BackgroundColor3 = tab === activeTab ? TAB_ACTIVE_COLOR : TAB_INACTIVE_COLOR;
	});
}

function refreshEquipment(): void {
	equipSlotFrames.forEach((frame, slot) => {
		const nameLabel = frame.FindFirstChild("ItemName") as TextLabel;
		const slotLabel = frame.FindFirstChild("SlotLabel") as TextLabel;
		const equipped = equipment[slot];

		if (equipped !== undefined) {
			const config = ItemConfigs[equipped.itemId];
			nameLabel.Text = config ? config.name : equipped.itemId;
			nameLabel.TextColor3 = config
				? RARITY_COLORS[config.rarity]
				: Color3.fromRGB(255, 255, 255);
			slotLabel.Visible = false;
		} else {
			nameLabel.Text = "";
			slotLabel.Visible = true;
		}
	});
}

function formatStatBonuses(itemId: string): string {
	const config = ItemConfigs[itemId];
	if (!config?.equipment) return "";

	const sb = config.equipment.statBonuses;
	const parts: string[] = [];
	if (sb.attack) parts.push(`ATK +${sb.attack}`);
	if (sb.strength) parts.push(`STR +${sb.strength}`);
	if (sb.defense) parts.push(`DEF +${sb.defense}`);
	if (sb.maxHp) parts.push(`HP +${sb.maxHp}`);

	const lvlReq = config.equipment.levelRequirement;
	const meetsReq = playerLevel >= lvlReq;
	const reqColor = meetsReq ? "" : " [TOO LOW]";
	parts.push(`Lv.${lvlReq} required${reqColor}`);

	if (config.equipment.attackSpeed) {
		parts.push(`Speed: ${config.equipment.attackSpeed}s`);
	}

	return parts.join("  |  ");
}

function showTooltipForItem(item: InventoryItem): void {
	const config = ItemConfigs[item.itemId];
	if (!config) {
		hideTooltip();
		return;
	}

	tooltipName.Text = `${config.name} (x${item.quantity})`;
	tooltipName.TextColor3 = RARITY_COLORS[config.rarity];
	tooltipDesc.Text = config.description;

	const statsText = formatStatBonuses(item.itemId);
	tooltipStats.Text = statsText;
	tooltipStats.Visible = statsText !== "";

	// Resize tooltip based on content
	const hasStats = statsText !== "";
	tooltipFrame.Size = new UDim2(0, 200, 0, hasStats ? 80 : 55);

	const mouse = localPlayer.GetMouse();
	tooltipFrame.Position = new UDim2(0, mouse.X - 210, 0, mouse.Y - 40);
	tooltipFrame.Visible = true;
}

function showTooltip(slotIndex: number): void {
	const item = tabInventories[activeTab].slots[slotIndex];
	if (item === undefined) {
		hideTooltip();
		return;
	}
	showTooltipForItem(item);
}

function showEquipTooltip(slot: EquipmentSlot): void {
	const equipped = equipment[slot];
	if (equipped === undefined) {
		hideTooltip();
		return;
	}
	showTooltipForItem(equipped);
}

function hideTooltip(): void {
	tooltipFrame.Visible = false;
}

// --- Interactions ---

function switchTab(tab: InventoryTab): void {
	if (tab === activeTab) return;
	activeTab = tab;
	selectedSlot = undefined;
	hideTooltip();
	rebuildSlots();
}

function onSlotLeftClick(slotIndex: number): void {
	// On Equip tab, left-click equips the item directly
	if (activeTab === InventoryTab.Equip) {
		const item = tabInventories[activeTab].slots[slotIndex];
		if (item !== undefined) {
			const config = ItemConfigs[item.itemId];
			if (config?.equipment) {
				fireServer("EquipItem", { slotIndex });
				selectedSlot = undefined;
				return;
			}
		}
	}

	// Standard move behavior for non-equipment items or other tabs
	if (selectedSlot !== undefined) {
		if (selectedSlot !== slotIndex) {
			fireServer("MoveItem", { tab: activeTab, fromSlot: selectedSlot, toSlot: slotIndex });
		}
		selectedSlot = undefined;
		refreshSlots();
	} else {
		if (tabInventories[activeTab].slots[slotIndex] !== undefined) {
			selectedSlot = slotIndex;
			refreshSlots();
		}
	}
}

function onSlotRightClick(slotIndex: number): void {
	const item = tabInventories[activeTab].slots[slotIndex];
	if (item === undefined) return;

	if (item.itemId === "slot_expansion_scroll") {
		fireServer("UseItem", { tab: activeTab, slotIndex, targetTab: activeTab });
		selectedSlot = undefined;
		return;
	}

	fireServer("DropItem", { tab: activeTab, slotIndex, quantity: item.quantity });
	selectedSlot = undefined;
}

function onEquipSlotClick(slot: EquipmentSlot): void {
	// Click equipped item to unequip
	if (equipment[slot] !== undefined) {
		fireServer("UnequipItem", { equipSlot: slot });
	}
}

function toggleInventory(): void {
	inventoryOpen = !inventoryOpen;
	inventoryFrame.Visible = inventoryOpen;
	if (inventoryOpen) {
		CursorController.push();
		rebuildSlots();
	} else {
		CursorController.pop();
		selectedSlot = undefined;
		hideTooltip();
	}
}

// --- Ground Item Pickup ---

function findGroundItemModel(part: BasePart): Model | undefined {
	let current: Instance | undefined = part;
	while (current) {
		if (current.IsA("Model") && current.GetAttribute("GroundItemId") !== undefined) {
			return current;
		}
		current = current.Parent as Instance | undefined;
	}
	return undefined;
}

// --- Initialize ---

export function initialize(): void {
	createUI();

	UserInputService.InputBegan.Connect((input, gameProcessed) => {
		if (gameProcessed) return;
		if (input.KeyCode === Enum.KeyCode.B) {
			toggleInventory();
		}
	});

	const mouse = localPlayer.GetMouse();
	mouse.Button1Down.Connect(() => {
		const target = mouse.Target;
		if (!target) return;

		const groundModel = findGroundItemModel(target);
		if (groundModel) {
			const groundItemId = groundModel.GetAttribute("GroundItemId") as string;
			if (groundItemId) {
				fireServer("PickupItem", { groundItemId });
			}
		}
	});

	// --- Event Listeners ---

	onClientEvent("InventoryTabUpdated", (data) => {
		tabInventories[data.tab] = data.tabData;
		if (data.tab === activeTab && inventoryOpen) {
			rebuildSlots();
		}
	});

	onClientEvent("EquipmentUpdated", (data) => {
		equipment = data.equipment;
		if (inventoryOpen) {
			refreshEquipment();
		}
	});

	onClientEvent("EquipFailed", (data) => {
		warn(`[Equipment] ${data.reason}`);
	});

	onClientEvent("InventoryFull", (data) => {
		const config = ItemConfigs[data.itemId];
		const itemName = config ? config.name : data.itemId;
		warn(`[Inventory] ${TAB_LABELS[data.tab]} tab full! Cannot pick up ${itemName}`);
	});

	onClientEvent("GroundItemSpawned", (_data) => {
		// Server replicates the model
	});

	onClientEvent("GroundItemRemoved", (_data) => {
		// Server destroys the instance
	});

	onClientEvent("PlayerDataLoaded", (profile) => {
		playerLevel = profile.combatLevel;
		for (const tab of INVENTORY_TABS) {
			tabInventories[tab] = profile.inventory[tab];
		}
		equipment = profile.equipment;
		if (inventoryOpen) {
			rebuildSlots();
		}
	});

	onClientEvent("LevelUp", (data) => {
		playerLevel = data.newLevel;
	});

	print("[InventoryController] Initialized — Press 'B' to open inventory");
}
