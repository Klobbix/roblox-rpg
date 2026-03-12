import { Players, RunService } from "@rbxts/services";
import { totalExpForLevel, expBetweenLevels } from "shared/data/stats";
import { DEFAULT_ZONE_NAME } from "shared/data/zones";
import { onClientEvent } from "client/network/client-network";

const localPlayer = Players.LocalPlayer;
const playerGui = localPlayer.WaitForChild("PlayerGui") as PlayerGui;

// --- Constants ---

const BG_COLOR = Color3.fromRGB(20, 20, 20);
const BAR_BG_COLOR = Color3.fromRGB(40, 40, 40);
const HP_COLOR = Color3.fromRGB(200, 50, 50);
const HP_LOW_COLOR = Color3.fromRGB(255, 80, 30);
const EXP_COLOR = Color3.fromRGB(80, 160, 255);
const TEXT_COLOR = Color3.fromRGB(220, 220, 220);
const ZONE_COMBAT_COLOR = Color3.fromRGB(200, 80, 80);
const ZONE_TOWN_COLOR = Color3.fromRGB(80, 200, 80);
const ZONE_GATHERING_COLOR = Color3.fromRGB(200, 180, 80);

// --- State ---

let currentHp = 10;
let maxHp = 10;
let combatLevel = 1;
let totalExp = 0;
let currentZoneName = DEFAULT_ZONE_NAME;
let currentZoneType = "combat";

// --- UI References ---

let screenGui: ScreenGui;

// HP Bar
let hpBarContainer: Frame;
let hpBarFill: Frame;
let hpLabel: TextLabel;

// EXP Bar
let expBarContainer: Frame;
let expBarFill: Frame;
let expLabel: TextLabel;

// Level display
let levelLabel: TextLabel;

// Zone indicator
let zoneFrame: Frame;
let zoneLabel: TextLabel;
let zoneTypeIcon: TextLabel;

// Quick-access buttons
let quickBarFrame: Frame;

// --- UI Creation ---

function createUI(): void {
	screenGui = new Instance("ScreenGui");
	screenGui.Name = "HUD";
	screenGui.ResetOnSpawn = false;
	screenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling;
	screenGui.DisplayOrder = -1; // Render behind other UIs
	screenGui.Parent = playerGui;

	createHPBar();
	createEXPBar();
	createZoneIndicator();
	createQuickBar();
}

function createHPBar(): void {
	const barWidth = 200;
	const barHeight = 18;

	hpBarContainer = new Instance("Frame");
	hpBarContainer.Name = "HPBar";
	hpBarContainer.Size = new UDim2(0, barWidth, 0, barHeight);
	hpBarContainer.Position = new UDim2(0.5, -barWidth / 2, 0, 10);
	hpBarContainer.BackgroundColor3 = BAR_BG_COLOR;
	hpBarContainer.BorderSizePixel = 0;
	hpBarContainer.Parent = screenGui;

	const corner = new Instance("UICorner");
	corner.CornerRadius = new UDim(0, 4);
	corner.Parent = hpBarContainer;

	const stroke = new Instance("UIStroke");
	stroke.Color = Color3.fromRGB(60, 60, 60);
	stroke.Thickness = 1;
	stroke.Parent = hpBarContainer;

	hpBarFill = new Instance("Frame");
	hpBarFill.Name = "Fill";
	hpBarFill.Size = UDim2.fromScale(1, 1);
	hpBarFill.BackgroundColor3 = HP_COLOR;
	hpBarFill.BorderSizePixel = 0;
	hpBarFill.Parent = hpBarContainer;

	const fillCorner = new Instance("UICorner");
	fillCorner.CornerRadius = new UDim(0, 4);
	fillCorner.Parent = hpBarFill;

	hpLabel = new Instance("TextLabel");
	hpLabel.Name = "Text";
	hpLabel.Size = UDim2.fromScale(1, 1);
	hpLabel.BackgroundTransparency = 1;
	hpLabel.Text = "10 / 10";
	hpLabel.TextColor3 = Color3.fromRGB(255, 255, 255);
	hpLabel.TextSize = 12;
	hpLabel.Font = Enum.Font.GothamBold;
	hpLabel.ZIndex = 2;
	hpLabel.Parent = hpBarContainer;

	// Level badge to the left of HP bar
	levelLabel = new Instance("TextLabel");
	levelLabel.Name = "Level";
	levelLabel.Size = new UDim2(0, 36, 0, 20);
	levelLabel.Position = new UDim2(0.5, -barWidth / 2 - 42, 0, 9);
	levelLabel.BackgroundColor3 = BG_COLOR;
	levelLabel.BorderSizePixel = 0;
	levelLabel.Text = "Lv.1";
	levelLabel.TextColor3 = Color3.fromRGB(255, 215, 0);
	levelLabel.TextSize = 12;
	levelLabel.Font = Enum.Font.GothamBold;
	levelLabel.Parent = screenGui;

	const levelCorner = new Instance("UICorner");
	levelCorner.CornerRadius = new UDim(0, 4);
	levelCorner.Parent = levelLabel;
}

function createEXPBar(): void {
	const barWidth = 200;
	const barHeight = 8;

	expBarContainer = new Instance("Frame");
	expBarContainer.Name = "EXPBar";
	expBarContainer.Size = new UDim2(0, barWidth, 0, barHeight);
	expBarContainer.Position = new UDim2(0.5, -barWidth / 2, 0, 32);
	expBarContainer.BackgroundColor3 = BAR_BG_COLOR;
	expBarContainer.BorderSizePixel = 0;
	expBarContainer.Parent = screenGui;

	const corner = new Instance("UICorner");
	corner.CornerRadius = new UDim(0, 3);
	corner.Parent = expBarContainer;

	expBarFill = new Instance("Frame");
	expBarFill.Name = "Fill";
	expBarFill.Size = UDim2.fromScale(0, 1);
	expBarFill.BackgroundColor3 = EXP_COLOR;
	expBarFill.BorderSizePixel = 0;
	expBarFill.Parent = expBarContainer;

	const fillCorner = new Instance("UICorner");
	fillCorner.CornerRadius = new UDim(0, 3);
	fillCorner.Parent = expBarFill;

	expLabel = new Instance("TextLabel");
	expLabel.Name = "Text";
	expLabel.Size = UDim2.fromScale(1, 1);
	expLabel.BackgroundTransparency = 1;
	expLabel.Text = "";
	expLabel.TextColor3 = Color3.fromRGB(200, 200, 200);
	expLabel.TextSize = 7;
	expLabel.Font = Enum.Font.Gotham;
	expLabel.ZIndex = 2;
	expLabel.Parent = expBarContainer;
}

function createZoneIndicator(): void {
	zoneFrame = new Instance("Frame");
	zoneFrame.Name = "ZoneIndicator";
	zoneFrame.Size = new UDim2(0, 180, 0, 22);
	zoneFrame.Position = new UDim2(0.5, -90, 0, 44);
	zoneFrame.BackgroundColor3 = BG_COLOR;
	zoneFrame.BackgroundTransparency = 0.3;
	zoneFrame.BorderSizePixel = 0;
	zoneFrame.Parent = screenGui;

	const corner = new Instance("UICorner");
	corner.CornerRadius = new UDim(0, 4);
	corner.Parent = zoneFrame;

	// Zone type icon (colored dot)
	zoneTypeIcon = new Instance("TextLabel");
	zoneTypeIcon.Name = "TypeIcon";
	zoneTypeIcon.Size = new UDim2(0, 8, 0, 8);
	zoneTypeIcon.Position = new UDim2(0, 8, 0.5, -4);
	zoneTypeIcon.BackgroundColor3 = ZONE_COMBAT_COLOR;
	zoneTypeIcon.BorderSizePixel = 0;
	zoneTypeIcon.Text = "";
	zoneTypeIcon.Parent = zoneFrame;

	const iconCorner = new Instance("UICorner");
	iconCorner.CornerRadius = new UDim(1, 0);
	iconCorner.Parent = zoneTypeIcon;

	zoneLabel = new Instance("TextLabel");
	zoneLabel.Name = "ZoneName";
	zoneLabel.Size = new UDim2(1, -24, 1, 0);
	zoneLabel.Position = new UDim2(0, 22, 0, 0);
	zoneLabel.BackgroundTransparency = 1;
	zoneLabel.Text = DEFAULT_ZONE_NAME;
	zoneLabel.TextColor3 = TEXT_COLOR;
	zoneLabel.TextSize = 12;
	zoneLabel.Font = Enum.Font.Gotham;
	zoneLabel.TextXAlignment = Enum.TextXAlignment.Left;
	zoneLabel.Parent = zoneFrame;
}

function createQuickBar(): void {
	const buttons = [
		{ key: "B", label: "Bag" },
		{ key: "K", label: "Skills" },
		{ key: "M", label: "Map" },
	];

	quickBarFrame = new Instance("Frame");
	quickBarFrame.Name = "QuickBar";
	quickBarFrame.Size = new UDim2(0, buttons.size() * 42 + 4, 0, 34);
	quickBarFrame.Position = new UDim2(0.5, -(buttons.size() * 42 + 4) / 2, 1, -40);
	quickBarFrame.BackgroundColor3 = BG_COLOR;
	quickBarFrame.BackgroundTransparency = 0.3;
	quickBarFrame.BorderSizePixel = 0;
	quickBarFrame.Parent = screenGui;

	const barCorner = new Instance("UICorner");
	barCorner.CornerRadius = new UDim(0, 6);
	barCorner.Parent = quickBarFrame;

	for (let i = 0; i < buttons.size(); i++) {
		const btn = buttons[i];

		const btnFrame = new Instance("Frame");
		btnFrame.Name = `Quick_${btn.key}`;
		btnFrame.Size = new UDim2(0, 38, 0, 28);
		btnFrame.Position = new UDim2(0, 4 + i * 42, 0, 3);
		btnFrame.BackgroundColor3 = Color3.fromRGB(50, 50, 50);
		btnFrame.BorderSizePixel = 0;
		btnFrame.Parent = quickBarFrame;

		const btnCorner = new Instance("UICorner");
		btnCorner.CornerRadius = new UDim(0, 4);
		btnCorner.Parent = btnFrame;

		// Key label
		const keyLabel = new Instance("TextLabel");
		keyLabel.Name = "Key";
		keyLabel.Size = new UDim2(1, 0, 0, 12);
		keyLabel.Position = new UDim2(0, 0, 0, 1);
		keyLabel.BackgroundTransparency = 1;
		keyLabel.Text = btn.key;
		keyLabel.TextColor3 = Color3.fromRGB(255, 215, 0);
		keyLabel.TextSize = 11;
		keyLabel.Font = Enum.Font.GothamBold;
		keyLabel.Parent = btnFrame;

		// Label
		const nameLabel = new Instance("TextLabel");
		nameLabel.Name = "Label";
		nameLabel.Size = new UDim2(1, 0, 0, 10);
		nameLabel.Position = new UDim2(0, 0, 0, 14);
		nameLabel.BackgroundTransparency = 1;
		nameLabel.Text = btn.label;
		nameLabel.TextColor3 = Color3.fromRGB(160, 160, 160);
		nameLabel.TextSize = 8;
		nameLabel.Font = Enum.Font.Gotham;
		nameLabel.Parent = btnFrame;
	}
}

// --- UI Updates ---

function updateHPBar(): void {
	const fraction = maxHp > 0 ? math.clamp(currentHp / maxHp, 0, 1) : 0;
	hpBarFill.Size = new UDim2(fraction, 0, 1, 0);
	hpBarFill.BackgroundColor3 = fraction < 0.3 ? HP_LOW_COLOR : HP_COLOR;
	hpLabel.Text = `${math.floor(currentHp)} / ${maxHp}`;
}

function updateEXPBar(): void {
	const expForCurrent = totalExpForLevel(combatLevel);
	const expNeeded = expBetweenLevels(combatLevel + 1);
	const expIntoLevel = totalExp - expForCurrent;

	if (expNeeded > 0) {
		const fraction = math.clamp(expIntoLevel / expNeeded, 0, 1);
		expBarFill.Size = new UDim2(fraction, 0, 1, 0);
		expLabel.Text = `${math.floor(expIntoLevel)} / ${expNeeded} EXP`;
	} else {
		expBarFill.Size = UDim2.fromScale(1, 1);
		expLabel.Text = "MAX LEVEL";
	}

	levelLabel.Text = `Lv.${combatLevel}`;
}

function updateZoneDisplay(): void {
	zoneLabel.Text = currentZoneName;

	let zoneColor: Color3;
	switch (currentZoneType) {
		case "town":
			zoneColor = ZONE_TOWN_COLOR;
			break;
		case "gathering":
			zoneColor = ZONE_GATHERING_COLOR;
			break;
		default:
			zoneColor = ZONE_COMBAT_COLOR;
			break;
	}
	zoneTypeIcon.BackgroundColor3 = zoneColor;
}

/** Sync HP from the character's Humanoid each frame. */
function syncHPFromHumanoid(): void {
	const character = localPlayer.Character;
	if (!character) return;
	const humanoid = character.FindFirstChildOfClass("Humanoid");
	if (!humanoid) return;

	const newHp = humanoid.Health;
	const newMax = humanoid.MaxHealth;

	if (newHp !== currentHp || newMax !== maxHp) {
		currentHp = newHp;
		maxHp = newMax;
		updateHPBar();
	}
}

// --- Zone Change Animation ---

let zoneBanner: TextLabel | undefined;

function showZoneBanner(zoneName: string): void {
	// Clean up previous banner
	if (zoneBanner) {
		zoneBanner.Destroy();
	}

	zoneBanner = new Instance("TextLabel");
	zoneBanner.Name = "ZoneBanner";
	zoneBanner.Size = new UDim2(0, 300, 0, 40);
	zoneBanner.Position = new UDim2(0.5, -150, 0.3, 0);
	zoneBanner.BackgroundTransparency = 1;
	zoneBanner.Text = zoneName;
	zoneBanner.TextColor3 = Color3.fromRGB(255, 255, 255);
	zoneBanner.TextSize = 28;
	zoneBanner.Font = Enum.Font.GothamBold;
	zoneBanner.TextStrokeTransparency = 0.5;
	zoneBanner.TextStrokeColor3 = Color3.fromRGB(0, 0, 0);
	zoneBanner.TextTransparency = 0;
	zoneBanner.Parent = screenGui;

	const banner = zoneBanner;

	// Fade out after a delay
	task.spawn(() => {
		task.wait(2);
		for (let i = 0; i < 20; i++) {
			task.wait(0.05);
			banner.TextTransparency = i / 20;
			banner.TextStrokeTransparency = 0.5 + (i / 20) * 0.5;
		}
		banner.Destroy();
	});
}

// --- Initialize ---

export function initialize(): void {
	createUI();

	// Sync HP from Humanoid each frame
	RunService.RenderStepped.Connect(() => {
		syncHPFromHumanoid();
	});

	// --- Event Listeners ---

	onClientEvent("PlayerDataLoaded", (profile) => {
		combatLevel = profile.combatLevel;
		totalExp = profile.combatExp;
		updateEXPBar();
	});

	onClientEvent("DamageTaken", (data) => {
		currentHp = data.currentHp;
		maxHp = data.maxHp;
		updateHPBar();
	});

	onClientEvent("PlayerRespawned", (data) => {
		currentHp = data.hp;
		maxHp = data.maxHp;
		updateHPBar();
	});

	onClientEvent("ExpGained", (data) => {
		totalExp = data.totalExp;
		combatLevel = data.level;
		updateEXPBar();
	});

	onClientEvent("LevelUp", (data) => {
		combatLevel = data.newLevel;
		maxHp = data.stats.maxHp;
		currentHp = maxHp; // Full heal on level up
		updateEXPBar();
		updateHPBar();
	});

	onClientEvent("ZoneChanged", (data) => {
		const oldZone = currentZoneName;
		currentZoneName = data.zoneName;
		currentZoneType = data.zoneType;
		updateZoneDisplay();

		// Show banner on zone change (but not for initial load)
		if (oldZone !== DEFAULT_ZONE_NAME || data.zoneName !== DEFAULT_ZONE_NAME) {
			showZoneBanner(data.zoneName);
		}
	});

	print("[HUDController] Initialized");
}
