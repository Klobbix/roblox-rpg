import { Players, UserInputService } from "@rbxts/services";
import { MapConfigs, DEFAULT_MAP_ID } from "shared/data/maps";
import { onClientEvent } from "client/network/client-network";

const localPlayer = Players.LocalPlayer;
const playerGui = localPlayer.WaitForChild("PlayerGui") as PlayerGui;

// --- Constants ---

const BG_COLOR = Color3.fromRGB(30, 30, 30);
const PANEL_BORDER_COLOR = Color3.fromRGB(60, 60, 60);
const NODE_COLOR = Color3.fromRGB(80, 140, 200);
const NODE_CURRENT_COLOR = Color3.fromRGB(100, 220, 100);
const CONNECTION_COLOR = Color3.fromRGB(100, 100, 100);
const TEXT_COLOR = Color3.fromRGB(220, 220, 220);

// --- State ---

let mapPanelOpen = false;
let currentMapId = DEFAULT_MAP_ID;

// --- UI References ---

let screenGui: ScreenGui;
let mapFrame: Frame;
let mapContent: Frame;

// --- World Map UI ---

function createUI(): void {
	screenGui = new Instance("ScreenGui");
	screenGui.Name = "MapUI";
	screenGui.ResetOnSpawn = false;
	screenGui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling;
	screenGui.Parent = playerGui;

	const panelSize = 350;

	mapFrame = new Instance("Frame");
	mapFrame.Name = "MapPanel";
	mapFrame.Size = new UDim2(0, panelSize, 0, panelSize);
	mapFrame.Position = new UDim2(0.5, -panelSize / 2, 0.5, -panelSize / 2);
	mapFrame.BackgroundColor3 = BG_COLOR;
	mapFrame.BorderSizePixel = 0;
	mapFrame.Visible = false;
	mapFrame.Parent = screenGui;

	const corner = new Instance("UICorner");
	corner.CornerRadius = new UDim(0, 8);
	corner.Parent = mapFrame;

	const stroke = new Instance("UIStroke");
	stroke.Color = PANEL_BORDER_COLOR;
	stroke.Thickness = 2;
	stroke.Parent = mapFrame;

	// Title
	const title = new Instance("TextLabel");
	title.Name = "Title";
	title.Size = new UDim2(1, -16, 0, 28);
	title.Position = new UDim2(0, 8, 0, 6);
	title.BackgroundTransparency = 1;
	title.Text = "World Map";
	title.TextColor3 = Color3.fromRGB(255, 215, 0);
	title.TextSize = 16;
	title.Font = Enum.Font.GothamBold;
	title.TextXAlignment = Enum.TextXAlignment.Left;
	title.Parent = mapFrame;

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
	closeBtn.Parent = mapFrame;

	const closeBtnCorner = new Instance("UICorner");
	closeBtnCorner.CornerRadius = new UDim(0, 4);
	closeBtnCorner.Parent = closeBtn;

	closeBtn.MouseButton1Click.Connect(() => {
		toggleMapPanel();
	});

	// Map content area
	mapContent = new Instance("Frame");
	mapContent.Name = "Content";
	mapContent.Size = new UDim2(1, -16, 1, -44);
	mapContent.Position = new UDim2(0, 8, 0, 38);
	mapContent.BackgroundTransparency = 1;
	mapContent.Parent = mapFrame;
}

function renderMap(): void {
	// Clear existing content
	for (const child of mapContent.GetChildren()) {
		child.Destroy();
	}

	// Layout: position map nodes in a simple grid-like layout
	const nodePositions: Map<string, { x: number; y: number }> = new Map();

	// Assign positions based on map order
	const mapIds = ["starter_meadows", "dark_forest", "mountain_pass"];
	const positions = [
		{ x: 0.2, y: 0.5 },
		{ x: 0.5, y: 0.3 },
		{ x: 0.8, y: 0.5 },
	];

	for (let i = 0; i < mapIds.size(); i++) {
		if (i < positions.size()) {
			nodePositions.set(mapIds[i], positions[i]);
		}
	}

	// Draw connections first (behind nodes)
	for (const [mapId, pos] of nodePositions) {
		const mapConfig = MapConfigs[mapId];
		if (!mapConfig) continue;

		for (const [, connection] of pairs(mapConfig.connections)) {
			const targetPos = nodePositions.get(connection.targetMapId);
			if (!targetPos) continue;

			// Simple line between two points using a rotated frame
			const dx = targetPos.x - pos.x;
			const dy = targetPos.y - pos.y;
			const length = math.sqrt(dx * dx + dy * dy);
			const angle = math.atan2(dy, dx);

			const line = new Instance("Frame");
			line.Name = `Line_${mapId}_${connection.targetMapId}`;
			line.Size = new UDim2(length, 0, 0, 2);
			line.Position = new UDim2(pos.x, 0, pos.y, 0);
			line.AnchorPoint = new Vector2(0, 0.5);
			line.BackgroundColor3 = CONNECTION_COLOR;
			line.BorderSizePixel = 0;
			line.Rotation = math.deg(angle);
			line.ZIndex = 1;
			line.Parent = mapContent;
		}
	}

	// Draw nodes
	for (const [mapId, pos] of nodePositions) {
		const mapConfig = MapConfigs[mapId];
		if (!mapConfig) continue;

		const isCurrent = mapId === currentMapId;
		const nodeSize = isCurrent ? 60 : 50;

		const node = new Instance("Frame");
		node.Name = `Node_${mapId}`;
		node.Size = new UDim2(0, nodeSize, 0, nodeSize);
		node.Position = new UDim2(pos.x, -nodeSize / 2, pos.y, -nodeSize / 2);
		node.BackgroundColor3 = isCurrent ? NODE_CURRENT_COLOR : NODE_COLOR;
		node.BorderSizePixel = 0;
		node.ZIndex = 2;
		node.Parent = mapContent;

		const nodeCorner = new Instance("UICorner");
		nodeCorner.CornerRadius = new UDim(0, nodeSize / 2);
		nodeCorner.Parent = node;

		if (isCurrent) {
			const nodeStroke = new Instance("UIStroke");
			nodeStroke.Color = Color3.fromRGB(255, 255, 255);
			nodeStroke.Thickness = 2;
			nodeStroke.Parent = node;
		}

		// Map name
		const nameLabel = new Instance("TextLabel");
		nameLabel.Name = "MapName";
		nameLabel.Size = new UDim2(0, 100, 0, 16);
		nameLabel.Position = new UDim2(0.5, -50, 1, 4);
		nameLabel.BackgroundTransparency = 1;
		nameLabel.Text = mapConfig.name;
		nameLabel.TextColor3 = TEXT_COLOR;
		nameLabel.TextSize = 11;
		nameLabel.Font = Enum.Font.GothamBold;
		nameLabel.ZIndex = 3;
		nameLabel.Parent = node;

		// Level recommendation
		const levelLabel = new Instance("TextLabel");
		levelLabel.Name = "Level";
		levelLabel.Size = UDim2.fromScale(1, 0.4);
		levelLabel.Position = UDim2.fromScale(0, 0.3);
		levelLabel.BackgroundTransparency = 1;
		levelLabel.Text = `Lv. ${mapConfig.recommendedLevel}+`;
		levelLabel.TextColor3 = TEXT_COLOR;
		levelLabel.TextSize = 12;
		levelLabel.Font = Enum.Font.GothamBold;
		levelLabel.ZIndex = 3;
		levelLabel.Parent = node;
	}
}

function toggleMapPanel(): void {
	mapPanelOpen = !mapPanelOpen;
	mapFrame.Visible = mapPanelOpen;
	if (mapPanelOpen) {
		renderMap();
	}
}

// --- Initialize ---

export function initialize(): void {
	createUI();

	// Toggle map with M
	UserInputService.InputBegan.Connect((input, gameProcessed) => {
		if (gameProcessed) return;
		if (input.KeyCode === Enum.KeyCode.M) {
			toggleMapPanel();
		}
	});

	// Listen for teleport events
	onClientEvent("TeleportStarted", (data) => {
		print(`[Map] Teleporting to ${data.mapName}...`);
	});

	onClientEvent("TeleportFailed", (data) => {
		warn(`[Map] ${data.reason}`);
	});

	print("[MapController] Initialized — Press 'M' to open world map");
}
