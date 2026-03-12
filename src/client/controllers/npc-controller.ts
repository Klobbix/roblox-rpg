import { Players, UserInputService } from "@rbxts/services";
import * as CursorController from "./cursor-controller";
import { ItemConfigs, RARITY_COLORS } from "shared/data/items";
import { InventoryTab } from "shared/types/player";
import { fireServer, onClientEvent } from "client/network/client-network";

const localPlayer = Players.LocalPlayer;
const playerGui = localPlayer.WaitForChild("PlayerGui") as PlayerGui;

// --- Constants ---

const BG_COLOR = Color3.fromRGB(30, 30, 30);
const PANEL_BORDER_COLOR = Color3.fromRGB(60, 60, 60);
const BUTTON_COLOR = Color3.fromRGB(50, 50, 50);
const BUTTON_HOVER_COLOR = Color3.fromRGB(70, 70, 70);
const GOLD_COLOR = Color3.fromRGB(255, 215, 0);
const TEXT_COLOR = Color3.fromRGB(220, 220, 220);
const ERROR_COLOR = Color3.fromRGB(255, 80, 80);

// --- State ---

let dialogueOpen = false;
let shopOpen = false;
let currentGold = 0;
let currentShopId = "";

// --- UI References ---

let screenGui: ScreenGui;

// Dialogue UI
let dialogueFrame: Frame;
let dialogueNpcName: TextLabel;
let dialogueText: TextLabel;
let dialogueOptionsFrame: Frame;

// Shop UI
let shopFrame: Frame;
let shopTitle: TextLabel;
let shopScrollFrame: ScrollingFrame;
let shopGoldLabel: TextLabel;

// HUD gold display
let goldHudFrame: Frame;
let goldHudLabel: TextLabel;

// --- Player Control Lock ---

function lockPlayerControl(): void {
	const humanoid = localPlayer.Character?.FindFirstChildOfClass("Humanoid");
	if (humanoid) {
		humanoid.WalkSpeed = 0;
		humanoid.JumpPower = 0;
	}
	CursorController.push();
}

function unlockPlayerControl(): void {
	const humanoid = localPlayer.Character?.FindFirstChildOfClass("Humanoid");
	if (humanoid) {
		humanoid.WalkSpeed = 16;
		humanoid.JumpPower = 50;
	}
	CursorController.pop();
}

// --- Dialogue UI ---

function createDialogueUI(): void {
	dialogueFrame = new Instance("Frame");
	dialogueFrame.Name = "DialogueFrame";
	dialogueFrame.Size = new UDim2(0, 420, 0, 220);
	dialogueFrame.Position = new UDim2(0.5, -210, 0.7, -110);
	dialogueFrame.BackgroundColor3 = BG_COLOR;
	dialogueFrame.BorderSizePixel = 0;
	dialogueFrame.Visible = false;
	dialogueFrame.Parent = screenGui;

	const corner = new Instance("UICorner");
	corner.CornerRadius = new UDim(0, 8);
	corner.Parent = dialogueFrame;

	const stroke = new Instance("UIStroke");
	stroke.Color = PANEL_BORDER_COLOR;
	stroke.Thickness = 2;
	stroke.Parent = dialogueFrame;

	// NPC Name
	dialogueNpcName = new Instance("TextLabel");
	dialogueNpcName.Name = "NPCName";
	dialogueNpcName.Size = new UDim2(1, -16, 0, 24);
	dialogueNpcName.Position = new UDim2(0, 8, 0, 6);
	dialogueNpcName.BackgroundTransparency = 1;
	dialogueNpcName.Text = "NPC";
	dialogueNpcName.TextColor3 = GOLD_COLOR;
	dialogueNpcName.TextSize = 16;
	dialogueNpcName.Font = Enum.Font.GothamBold;
	dialogueNpcName.TextXAlignment = Enum.TextXAlignment.Left;
	dialogueNpcName.Parent = dialogueFrame;

	// Dialogue text
	dialogueText = new Instance("TextLabel");
	dialogueText.Name = "DialogueText";
	dialogueText.Size = new UDim2(1, -16, 0, 70);
	dialogueText.Position = new UDim2(0, 8, 0, 34);
	dialogueText.BackgroundTransparency = 1;
	dialogueText.Text = "";
	dialogueText.TextColor3 = TEXT_COLOR;
	dialogueText.TextSize = 14;
	dialogueText.Font = Enum.Font.Gotham;
	dialogueText.TextXAlignment = Enum.TextXAlignment.Left;
	dialogueText.TextYAlignment = Enum.TextYAlignment.Top;
	dialogueText.TextWrapped = true;
	dialogueText.Parent = dialogueFrame;

	// Options container
	dialogueOptionsFrame = new Instance("Frame");
	dialogueOptionsFrame.Name = "Options";
	dialogueOptionsFrame.Size = new UDim2(1, -16, 0, 100);
	dialogueOptionsFrame.Position = new UDim2(0, 8, 0, 110);
	dialogueOptionsFrame.BackgroundTransparency = 1;
	dialogueOptionsFrame.Parent = dialogueFrame;

	const layout = new Instance("UIListLayout");
	layout.FillDirection = Enum.FillDirection.Vertical;
	layout.Padding = new UDim(0, 4);
	layout.Parent = dialogueOptionsFrame;
}

function showDialogue(
	npcName: string,
	text: string,
	options: { label: string }[],
): void {
	dialogueNpcName.Text = npcName;
	dialogueText.Text = text;

	// Clear old options
	for (const child of dialogueOptionsFrame.GetChildren()) {
		if (child.IsA("TextButton")) {
			child.Destroy();
		}
	}

	// Create option buttons
	for (let i = 0; i < options.size(); i++) {
		const option = options[i];
		const btn = new Instance("TextButton");
		btn.Name = `Option_${i}`;
		btn.Size = new UDim2(1, 0, 0, 22);
		btn.BackgroundColor3 = BUTTON_COLOR;
		btn.BorderSizePixel = 0;
		btn.Text = `  ${i + 1}. ${option.label}`;
		btn.TextColor3 = TEXT_COLOR;
		btn.TextSize = 13;
		btn.Font = Enum.Font.Gotham;
		btn.TextXAlignment = Enum.TextXAlignment.Left;
		btn.Parent = dialogueOptionsFrame;

		const btnCorner = new Instance("UICorner");
		btnCorner.CornerRadius = new UDim(0, 4);
		btnCorner.Parent = btn;

		const optionIndex = i;
		btn.MouseButton1Click.Connect(() => {
			fireServer("SelectDialogueOption", { optionIndex });
		});

		btn.MouseEnter.Connect(() => {
			btn.BackgroundColor3 = BUTTON_HOVER_COLOR;
		});
		btn.MouseLeave.Connect(() => {
			btn.BackgroundColor3 = BUTTON_COLOR;
		});
	}

	dialogueFrame.Visible = true;
	dialogueOpen = true;
	lockPlayerControl();
}

function hideDialogue(): void {
	if (!dialogueOpen) return;
	dialogueFrame.Visible = false;
	dialogueOpen = false;
	unlockPlayerControl();
}

// --- Shop UI ---

function createShopUI(): void {
	shopFrame = new Instance("Frame");
	shopFrame.Name = "ShopFrame";
	shopFrame.Size = new UDim2(0, 340, 0, 400);
	shopFrame.Position = new UDim2(0.5, -170, 0.5, -200);
	shopFrame.BackgroundColor3 = BG_COLOR;
	shopFrame.BorderSizePixel = 0;
	shopFrame.Visible = false;
	shopFrame.Parent = screenGui;

	const corner = new Instance("UICorner");
	corner.CornerRadius = new UDim(0, 8);
	corner.Parent = shopFrame;

	const stroke = new Instance("UIStroke");
	stroke.Color = PANEL_BORDER_COLOR;
	stroke.Thickness = 2;
	stroke.Parent = shopFrame;

	// Title
	shopTitle = new Instance("TextLabel");
	shopTitle.Name = "Title";
	shopTitle.Size = new UDim2(1, -50, 0, 28);
	shopTitle.Position = new UDim2(0, 8, 0, 6);
	shopTitle.BackgroundTransparency = 1;
	shopTitle.Text = "Shop";
	shopTitle.TextColor3 = GOLD_COLOR;
	shopTitle.TextSize = 16;
	shopTitle.Font = Enum.Font.GothamBold;
	shopTitle.TextXAlignment = Enum.TextXAlignment.Left;
	shopTitle.Parent = shopFrame;

	// Close button
	const closeBtn = new Instance("TextButton");
	closeBtn.Name = "Close";
	closeBtn.Size = new UDim2(0, 24, 0, 24);
	closeBtn.Position = new UDim2(1, -30, 0, 6);
	closeBtn.BackgroundColor3 = Color3.fromRGB(180, 50, 50);
	closeBtn.BorderSizePixel = 0;
	closeBtn.Text = "X";
	closeBtn.TextColor3 = Color3.fromRGB(255, 255, 255);
	closeBtn.TextSize = 14;
	closeBtn.Font = Enum.Font.GothamBold;
	closeBtn.Parent = shopFrame;

	const closeBtnCorner = new Instance("UICorner");
	closeBtnCorner.CornerRadius = new UDim(0, 4);
	closeBtnCorner.Parent = closeBtn;

	closeBtn.MouseButton1Click.Connect(() => {
		fireServer("CloseShop", undefined);
	});

	// Gold display in shop
	shopGoldLabel = new Instance("TextLabel");
	shopGoldLabel.Name = "Gold";
	shopGoldLabel.Size = new UDim2(1, -16, 0, 20);
	shopGoldLabel.Position = new UDim2(0, 8, 0, 34);
	shopGoldLabel.BackgroundTransparency = 1;
	shopGoldLabel.Text = "Gold: 0";
	shopGoldLabel.TextColor3 = GOLD_COLOR;
	shopGoldLabel.TextSize = 13;
	shopGoldLabel.Font = Enum.Font.GothamBold;
	shopGoldLabel.TextXAlignment = Enum.TextXAlignment.Left;
	shopGoldLabel.Parent = shopFrame;

	// Scrolling frame for items
	shopScrollFrame = new Instance("ScrollingFrame");
	shopScrollFrame.Name = "Items";
	shopScrollFrame.Size = new UDim2(1, -16, 1, -66);
	shopScrollFrame.Position = new UDim2(0, 8, 0, 58);
	shopScrollFrame.BackgroundTransparency = 1;
	shopScrollFrame.BorderSizePixel = 0;
	shopScrollFrame.ScrollBarThickness = 6;
	shopScrollFrame.ScrollBarImageColor3 = PANEL_BORDER_COLOR;
	shopScrollFrame.CanvasSize = new UDim2(0, 0, 0, 0);
	shopScrollFrame.Parent = shopFrame;

	const itemLayout = new Instance("UIListLayout");
	itemLayout.FillDirection = Enum.FillDirection.Vertical;
	itemLayout.Padding = new UDim(0, 2);
	itemLayout.Parent = shopScrollFrame;
}

function showShop(
	shopId: string,
	shopName: string,
	items: { itemId: string; buyPrice: number; stock: number }[],
): void {
	currentShopId = shopId;
	shopTitle.Text = shopName;
	shopGoldLabel.Text = `Gold: ${currentGold}`;

	// Clear old items
	for (const child of shopScrollFrame.GetChildren()) {
		if (child.IsA("Frame")) {
			child.Destroy();
		}
	}

	const ROW_HEIGHT = 50;

	for (let i = 0; i < items.size(); i++) {
		const shopItem = items[i];
		const itemConfig = ItemConfigs[shopItem.itemId];
		if (!itemConfig) continue;

		const row = new Instance("Frame");
		row.Name = `Item_${i}`;
		row.Size = new UDim2(1, -6, 0, ROW_HEIGHT);
		row.BackgroundColor3 = BUTTON_COLOR;
		row.BorderSizePixel = 0;
		row.Parent = shopScrollFrame;

		const rowCorner = new Instance("UICorner");
		rowCorner.CornerRadius = new UDim(0, 4);
		rowCorner.Parent = row;

		// Item name
		const rarityColor = RARITY_COLORS[itemConfig.rarity];
		const nameLabel = new Instance("TextLabel");
		nameLabel.Name = "Name";
		nameLabel.Size = new UDim2(0.55, 0, 0, 18);
		nameLabel.Position = new UDim2(0, 6, 0, 4);
		nameLabel.BackgroundTransparency = 1;
		nameLabel.Text = itemConfig.name;
		nameLabel.TextColor3 = rarityColor;
		nameLabel.TextSize = 13;
		nameLabel.Font = Enum.Font.GothamBold;
		nameLabel.TextXAlignment = Enum.TextXAlignment.Left;
		nameLabel.Parent = row;

		// Description
		const descLabel = new Instance("TextLabel");
		descLabel.Name = "Desc";
		descLabel.Size = new UDim2(0.55, 0, 0, 14);
		descLabel.Position = new UDim2(0, 6, 0, 22);
		descLabel.BackgroundTransparency = 1;
		descLabel.Text = itemConfig.description;
		descLabel.TextColor3 = Color3.fromRGB(150, 150, 150);
		descLabel.TextSize = 10;
		descLabel.Font = Enum.Font.Gotham;
		descLabel.TextXAlignment = Enum.TextXAlignment.Left;
		descLabel.TextTruncate = Enum.TextTruncate.AtEnd;
		descLabel.Parent = row;

		// Price
		const priceLabel = new Instance("TextLabel");
		priceLabel.Name = "Price";
		priceLabel.Size = new UDim2(0, 60, 0, 18);
		priceLabel.Position = new UDim2(0.55, 4, 0, 4);
		priceLabel.BackgroundTransparency = 1;
		priceLabel.Text = `${shopItem.buyPrice}g`;
		priceLabel.TextColor3 = GOLD_COLOR;
		priceLabel.TextSize = 13;
		priceLabel.Font = Enum.Font.GothamBold;
		priceLabel.TextXAlignment = Enum.TextXAlignment.Left;
		priceLabel.Parent = row;

		// Buy button
		const buyBtn = new Instance("TextButton");
		buyBtn.Name = "Buy";
		buyBtn.Size = new UDim2(0, 50, 0, 24);
		buyBtn.Position = new UDim2(1, -56, 0.5, -12);
		buyBtn.BackgroundColor3 = Color3.fromRGB(40, 120, 60);
		buyBtn.BorderSizePixel = 0;
		buyBtn.Text = "Buy";
		buyBtn.TextColor3 = Color3.fromRGB(255, 255, 255);
		buyBtn.TextSize = 12;
		buyBtn.Font = Enum.Font.GothamBold;
		buyBtn.Parent = row;

		const buyBtnCorner = new Instance("UICorner");
		buyBtnCorner.CornerRadius = new UDim(0, 4);
		buyBtnCorner.Parent = buyBtn;

		const itemIndex = i;
		buyBtn.MouseButton1Click.Connect(() => {
			fireServer("BuyItem", { shopId: currentShopId, itemIndex, quantity: 1 });
		});

		buyBtn.MouseEnter.Connect(() => {
			buyBtn.BackgroundColor3 = Color3.fromRGB(50, 150, 75);
		});
		buyBtn.MouseLeave.Connect(() => {
			buyBtn.BackgroundColor3 = Color3.fromRGB(40, 120, 60);
		});
	}

	// Update canvas size
	shopScrollFrame.CanvasSize = new UDim2(0, 0, 0, items.size() * (ROW_HEIGHT + 2));

	shopFrame.Visible = true;
	shopOpen = true;
	lockPlayerControl();
}

function hideShop(): void {
	if (!shopOpen) return;
	shopFrame.Visible = false;
	shopOpen = false;
	currentShopId = "";
	unlockPlayerControl();
}

// --- Gold HUD ---

function createGoldHUD(): void {
	goldHudFrame = new Instance("Frame");
	goldHudFrame.Name = "GoldHUD";
	goldHudFrame.Size = new UDim2(0, 120, 0, 28);
	goldHudFrame.Position = new UDim2(1, -130, 0, 10);
	goldHudFrame.BackgroundColor3 = BG_COLOR;
	goldHudFrame.BorderSizePixel = 0;
	goldHudFrame.Parent = screenGui;

	const corner = new Instance("UICorner");
	corner.CornerRadius = new UDim(0, 6);
	corner.Parent = goldHudFrame;

	goldHudLabel = new Instance("TextLabel");
	goldHudLabel.Name = "GoldText";
	goldHudLabel.Size = UDim2.fromScale(1, 1);
	goldHudLabel.BackgroundTransparency = 1;
	goldHudLabel.Text = "Gold: 0";
	goldHudLabel.TextColor3 = GOLD_COLOR;
	goldHudLabel.TextSize = 14;
	goldHudLabel.Font = Enum.Font.GothamBold;
	goldHudLabel.Parent = goldHudFrame;
}

function updateGoldDisplay(): void {
	const text = `Gold: ${currentGold}`;
	goldHudLabel.Text = text;
	if (shopOpen) {
		shopGoldLabel.Text = text;
	}
}

// --- Sell via right-click in inventory while shop is open ---
// (Handled by listening for events — the inventory controller already supports right-click drop.
//  We add a sell path by listening to the SellItem remote from inventory context menus.)

// --- Error Flash ---

function showShopError(reason: string): void {
	// Brief flash on the shop title
	if (!shopOpen) return;

	const originalText = shopTitle.Text;
	shopTitle.Text = reason;
	shopTitle.TextColor3 = ERROR_COLOR;

	task.delay(1.5, () => {
		shopTitle.Text = originalText;
		shopTitle.TextColor3 = GOLD_COLOR;
	});
}

// --- Initialize ---

export function initialize(): void {
	screenGui = new Instance("ScreenGui");
	screenGui.Name = "NPCUI";
	screenGui.ResetOnSpawn = false;
	screenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling;
	screenGui.Parent = playerGui;

	createDialogueUI();
	createShopUI();
	createGoldHUD();

	// --- Event Listeners ---

	onClientEvent("DialogueOpened", (data) => {
		showDialogue(data.npcName, data.text, data.options);
	});

	onClientEvent("DialogueClosed", () => {
		hideDialogue();
	});

	onClientEvent("ShopOpened", (data) => {
		hideDialogue(); // Close dialogue when shop opens
		showShop(data.shopId, data.shopName, data.items);
	});

	onClientEvent("ShopClosed", () => {
		hideShop();
	});

	onClientEvent("ShopError", (data) => {
		showShopError(data.reason);
	});

	onClientEvent("GoldUpdated", (data) => {
		currentGold = data.gold;
		updateGoldDisplay();
	});

	onClientEvent("PlayerDataLoaded", (profile) => {
		currentGold = profile.gold;
		updateGoldDisplay();
	});

	// Escape to close dialogue/shop
	UserInputService.InputBegan.Connect((input, gameProcessed) => {
		if (gameProcessed) return;
		if (input.KeyCode === Enum.KeyCode.Escape) {
			if (shopOpen) {
				fireServer("CloseShop", undefined);
			} else if (dialogueOpen) {
				fireServer("CloseDialogue", undefined);
			}
		}
	});

	// Number keys for dialogue options
	UserInputService.InputBegan.Connect((input, gameProcessed) => {
		if (gameProcessed) return;
		if (!dialogueOpen) return;

		const numberKeys = [
			Enum.KeyCode.One,
			Enum.KeyCode.Two,
			Enum.KeyCode.Three,
			Enum.KeyCode.Four,
			Enum.KeyCode.Five,
		];

		for (let i = 0; i < numberKeys.size(); i++) {
			if (input.KeyCode === numberKeys[i]) {
				fireServer("SelectDialogueOption", { optionIndex: i });
				return;
			}
		}
	});

	print("[NPCController] Initialized");
}
