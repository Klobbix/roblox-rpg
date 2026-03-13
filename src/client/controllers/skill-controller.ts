import { Players, UserInputService, RunService } from "@rbxts/services";
import { SkillConfigs, SKILL_IDS, totalSkillExpForLevel, skillExpBetweenLevels } from "shared/data/skills";
import { SkillProgress } from "shared/types/player";
import { onClientEvent } from "client/network/client-network";

const localPlayer = Players.LocalPlayer;
const playerGui = localPlayer.WaitForChild("PlayerGui") as PlayerGui;

// --- Constants ---

const BG_COLOR = Color3.fromRGB(30, 30, 30);
const BAR_BG_COLOR = Color3.fromRGB(50, 50, 50);
const BAR_FILL_COLOR = Color3.fromRGB(60, 180, 80);

// --- State ---

const skillData: Map<string, SkillProgress> = new Map();
let skillPanelOpen = false;

// --- UI References ---

let screenGui: ScreenGui;
let skillFrame: Frame;
const skillRows: Map<string, { levelLabel: TextLabel; expBar: Frame; expLabel: TextLabel }> = new Map();

// --- Skill Panel UI ---

function createUI(): void {
	screenGui = new Instance("ScreenGui");
	screenGui.Name = "SkillUI";
	screenGui.ResetOnSpawn = false;
	screenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling;
	screenGui.Parent = playerGui;

	const panelWidth = 220;
	const rowHeight = 40;
	const headerHeight = 28;
	const panelHeight = headerHeight + SKILL_IDS.size() * rowHeight + 6;

	skillFrame = new Instance("Frame");
	skillFrame.Name = "SkillPanel";
	skillFrame.Size = new UDim2(0, panelWidth, 0, panelHeight);
	skillFrame.Position = new UDim2(0, 10, 0.5, -panelHeight / 2);
	skillFrame.BackgroundColor3 = BG_COLOR;
	skillFrame.BorderSizePixel = 0;
	skillFrame.Visible = false;
	skillFrame.Parent = screenGui;

	const corner = new Instance("UICorner");
	corner.CornerRadius = new UDim(0, 6);
	corner.Parent = skillFrame;

	// Title
	const title = new Instance("TextLabel");
	title.Name = "Title";
	title.Size = new UDim2(1, 0, 0, headerHeight);
	title.BackgroundTransparency = 1;
	title.Text = "Skills";
	title.TextColor3 = Color3.fromRGB(220, 220, 220);
	title.TextSize = 15;
	title.Font = Enum.Font.GothamBold;
	title.Parent = skillFrame;

	// Skill rows
	for (let i = 0; i < SKILL_IDS.size(); i++) {
		const skillId = SKILL_IDS[i];
		const config = SkillConfigs[skillId];
		const yOffset = headerHeight + i * rowHeight + 2;

		// Skill name
		const nameLabel = new Instance("TextLabel");
		nameLabel.Name = `Name_${skillId}`;
		nameLabel.Size = new UDim2(0, 80, 0, 16);
		nameLabel.Position = new UDim2(0, 8, 0, yOffset);
		nameLabel.BackgroundTransparency = 1;
		nameLabel.Text = config.name;
		nameLabel.TextColor3 = Color3.fromRGB(200, 200, 200);
		nameLabel.TextSize = 12;
		nameLabel.Font = Enum.Font.GothamBold;
		nameLabel.TextXAlignment = Enum.TextXAlignment.Left;
		nameLabel.Parent = skillFrame;

		// Level label
		const levelLabel = new Instance("TextLabel");
		levelLabel.Name = `Level_${skillId}`;
		levelLabel.Size = new UDim2(0, 40, 0, 16);
		levelLabel.Position = new UDim2(0, 90, 0, yOffset);
		levelLabel.BackgroundTransparency = 1;
		levelLabel.Text = "Lv. 1";
		levelLabel.TextColor3 = Color3.fromRGB(255, 255, 100);
		levelLabel.TextSize = 12;
		levelLabel.Font = Enum.Font.GothamBold;
		levelLabel.TextXAlignment = Enum.TextXAlignment.Left;
		levelLabel.Parent = skillFrame;

		// EXP bar background
		const barBg = new Instance("Frame");
		barBg.Name = `BarBg_${skillId}`;
		barBg.Size = new UDim2(0, panelWidth - 20, 0, 12);
		barBg.Position = new UDim2(0, 10, 0, yOffset + 18);
		barBg.BackgroundColor3 = BAR_BG_COLOR;
		barBg.BorderSizePixel = 0;
		barBg.Parent = skillFrame;

		const barCorner = new Instance("UICorner");
		barCorner.CornerRadius = new UDim(0, 3);
		barCorner.Parent = barBg;

		// EXP bar fill
		const barFill = new Instance("Frame");
		barFill.Name = "Fill";
		barFill.Size = UDim2.fromScale(0, 1);
		barFill.BackgroundColor3 = BAR_FILL_COLOR;
		barFill.BorderSizePixel = 0;
		barFill.Parent = barBg;

		const fillCorner = new Instance("UICorner");
		fillCorner.CornerRadius = new UDim(0, 3);
		fillCorner.Parent = barFill;

		// EXP text overlay
		const expLabel = new Instance("TextLabel");
		expLabel.Name = "ExpText";
		expLabel.Size = UDim2.fromScale(1, 1);
		expLabel.BackgroundTransparency = 1;
		expLabel.Text = "0 / 0";
		expLabel.TextColor3 = Color3.fromRGB(220, 220, 220);
		expLabel.TextSize = 9;
		expLabel.Font = Enum.Font.Gotham;
		expLabel.Parent = barBg;

		skillRows.set(skillId, { levelLabel, expBar: barFill, expLabel });
	}

}

// --- UI Updates ---

function refreshSkillRow(skillId: string): void {
	const row = skillRows.get(skillId);
	if (!row) return;

	const progress = skillData.get(skillId);
	const level = progress ? progress.level : 1;
	const totalExp = progress ? progress.exp : 0;

	row.levelLabel.Text = `Lv. ${level}`;

	// Calculate EXP progress within current level
	const expForCurrentLevel = totalSkillExpForLevel(level);
	const expForNextLevel = skillExpBetweenLevels(level + 1);
	const expIntoLevel = totalExp - expForCurrentLevel;

	if (expForNextLevel > 0) {
		const fraction = math.clamp(expIntoLevel / expForNextLevel, 0, 1);
		row.expBar.Size = new UDim2(fraction, 0, 1, 0);
		row.expLabel.Text = `${math.floor(expIntoLevel)} / ${expForNextLevel}`;
	} else {
		row.expBar.Size = UDim2.fromScale(1, 1);
		row.expLabel.Text = "MAX";
	}
}

function refreshAllSkills(): void {
	for (const skillId of SKILL_IDS) {
		refreshSkillRow(skillId);
	}
}

function toggleSkillPanel(): void {
	skillPanelOpen = !skillPanelOpen;
	skillFrame.Visible = skillPanelOpen;
	if (skillPanelOpen) {
		refreshAllSkills();
	}
}

// --- Floating EXP Text ---

function showFloatingExp(skillId: string, amount: number): void {
	const character = localPlayer.Character;
	if (!character) return;
	const head = character.FindFirstChild("Head") as BasePart | undefined;
	if (!head) return;

	const config = SkillConfigs[skillId];
	const skillName = config ? config.name : skillId;

	const billboard = new Instance("BillboardGui");
	billboard.Name = "ExpPopup";
	billboard.Size = new UDim2(0, 120, 0, 30);
	billboard.StudsOffset = new Vector3(0, 3, 0);
	billboard.Adornee = head;
	billboard.AlwaysOnTop = true;
	billboard.Parent = playerGui;

	const label = new Instance("TextLabel");
	label.Size = UDim2.fromScale(1, 1);
	label.BackgroundTransparency = 1;
	label.Text = `+${amount} ${skillName} EXP`;
	label.TextColor3 = BAR_FILL_COLOR;
	label.TextSize = 14;
	label.Font = Enum.Font.GothamBold;
	label.TextStrokeTransparency = 0.5;
	label.Parent = billboard;

	// Animate upward and fade
	let elapsed = 0;
	const connection = RunService.RenderStepped.Connect((dt) => {
		elapsed += dt;
		billboard.StudsOffset = new Vector3(0, 3 + elapsed * 2, 0);
		label.TextTransparency = math.clamp(elapsed / 1.5, 0, 1);
		label.TextStrokeTransparency = math.clamp(0.5 + elapsed, 0, 1);
		if (elapsed >= 1.5) {
			connection.Disconnect();
			billboard.Destroy();
		}
	});
}

// --- Initialize ---

export function initialize(): void {
	createUI();

	// Toggle skill panel with K
	UserInputService.InputBegan.Connect((input, gameProcessed) => {
		if (gameProcessed) return;
		if (input.KeyCode === Enum.KeyCode.K) {
			toggleSkillPanel();
		}
	});

	// --- Event Listeners ---

	onClientEvent("GatherFailed", (data) => {
		warn(`[Gathering] ${data.reason}`);
	});

	onClientEvent("SkillExpGained", (data) => {
		skillData.set(data.skillId, { level: data.level, exp: data.totalExp });
		if (skillPanelOpen) {
			refreshSkillRow(data.skillId);
		}
		showFloatingExp(data.skillId, data.amount);
	});

	onClientEvent("SkillLevelUp", (data) => {
		const existing = skillData.get(data.skillId);
		if (existing) {
			existing.level = data.newLevel;
		}
		if (skillPanelOpen) {
			refreshSkillRow(data.skillId);
		}
		const config = SkillConfigs[data.skillId];
		const skillName = config ? config.name : data.skillId;
		print(`[Skills] ${skillName} leveled up to ${data.newLevel}!`);
	});

	onClientEvent("NodeHit", (_data) => {
		// Server handles visual changes; hook here for future hit effects (sounds, particles)
	});

	onClientEvent("NodeDepleted", (_data) => {
		// Server handles visual changes
	});

	onClientEvent("NodeRespawned", (_data) => {
		// Server handles visual changes
	});

	// Load initial skill data from profile
	onClientEvent("PlayerDataLoaded", (profile) => {
		for (const skillId of SKILL_IDS) {
			const progress = profile.skills[skillId];
			if (progress) {
				skillData.set(skillId, progress);
			}
		}
		if (skillPanelOpen) {
			refreshAllSkills();
		}
	});

	print("[SkillController] Initialized — Press 'K' to open skills");
}
