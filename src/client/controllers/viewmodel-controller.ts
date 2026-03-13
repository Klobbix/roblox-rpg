import { Players, ReplicatedFirst, ReplicatedStorage, RunService, Workspace } from "@rbxts/services";
import { ViewmodelConfig, SwingStyle } from "shared/data/items/types";
import { ItemConfigs } from "shared/data/items";
import { onClientEvent } from "client/network/client-network";
import * as CursorController from "./cursor-controller";

const localPlayer = Players.LocalPlayer;

// --- State ---

let activeModel: Model | undefined;
let currentConfig: ViewmodelConfig | undefined;

// Animation timers
let idleTime = 0;
let walkBobT = 0;
let swingElapsed = 0;
let swingDuration = 0;
let swinging = false;

// --- Destroy ---

function destroyViewmodel(): void {
	activeModel?.Destroy();
	activeModel = undefined;
	currentConfig = undefined;
}

// --- Build ---

function buildViewmodel(itemId: string): void {
	destroyViewmodel();

	const item = ItemConfigs[itemId];
	if (!item?.viewmodel) return;

	const config = item.viewmodel;
	currentConfig = config;

	if (!config.modelName) return;

	const camera = Workspace.CurrentCamera;
	if (!camera) return;

	const viewmodelsFolder = ReplicatedStorage.FindFirstChild("Viewmodels") as Folder | undefined;
	const template = viewmodelsFolder?.FindFirstChild(config.modelName);
	if (!template?.IsA("Model")) {
		warn(`[ViewmodelController] No model named "${config.modelName}" in Workspace.Viewmodels`);
		return;
	}

	const model = template.Clone();
	for (const desc of model.GetDescendants()) {
		if (desc.IsA("BasePart")) {
			desc.CanCollide = false;
			desc.CanQuery = false;
			desc.CastShadow = false;
		}
	}
	model.Parent = camera;
	activeModel = model;
}

// --- Animation ---

function computeSwingDelta(style: SwingStyle, swingValue: number): CFrame {
	switch (style) {
		case SwingStyle.Slash:
			return CFrame.Angles(swingValue * 0.3, 0, -swingValue * math.rad(65)).mul(
				new CFrame(0, 0, -swingValue * 0.12),
			);
		case SwingStyle.Stab:
			return new CFrame(0, 0, -swingValue * 0.45);
		case SwingStyle.Chop:
			return CFrame.Angles(swingValue * math.rad(80), 0, swingValue * 0.08).mul(
				new CFrame(0, swingValue * 0.05, 0),
			);
		case SwingStyle.Cast:
			return CFrame.Angles(-swingValue * math.rad(35), swingValue * math.rad(10), 0);
		default:
			return new CFrame(0, 0, 0);
	}
}

function setVisibility(hidden: boolean): void {
	if (!activeModel) return;
	const transparency = hidden ? 1 : 0;
	for (const desc of activeModel.GetDescendants()) {
		if (desc.IsA("BasePart")) {
			desc.LocalTransparencyModifier = transparency;
		}
	}
}

// --- Public API ---

/** Trigger a swing animation. Restarts if already mid-swing. */
export function playSwing(): void {
	if (!currentConfig) return;
	swingElapsed = 0;
	swingDuration = currentConfig.swingDuration;
	swinging = true;
}

// --- Update Loop ---

function update(dt: number): void {
	const camera = Workspace.CurrentCamera;
	if (!activeModel || !camera || !currentConfig) return;

	idleTime += dt;

	const hrp = localPlayer.Character?.FindFirstChild("HumanoidRootPart") as BasePart | undefined;
	if (hrp && hrp.AssemblyLinearVelocity.Magnitude > 1) {
		walkBobT += dt * 9;
	}

	if (swinging) {
		swingElapsed += dt;
		if (swingElapsed >= swingDuration) {
			swingElapsed = swingDuration;
			swinging = false;
		}
	}

	const idleBobY = math.sin(idleTime * 1.1) * 0.012;
	const walkBobY = math.sin(walkBobT) * 0.035;
	const walkBobX = math.sin(walkBobT * 0.5) * 0.018;

	const swingValue = swinging ? math.sin((swingElapsed / swingDuration) * math.pi) : 0;
	const swingDelta = swinging ? computeSwingDelta(currentConfig.swingStyle, swingValue) : new CFrame();

	const bob = new CFrame(walkBobX, idleBobY + walkBobY, 0);
	activeModel.PivotTo(camera.CFrame.mul(currentConfig.holdOffset).mul(bob).mul(swingDelta));
}

// --- Character Tool Watching ---

/** Watch a character for Tool equip/unequip events to drive the viewmodel. */
function watchCharacter(character: Model): void {
	character.ChildAdded.Connect((child) => {
		if (child.IsA("Tool")) {
			const itemId = child.GetAttribute("ItemId") as string | undefined;
			if (itemId) {
				buildViewmodel(itemId);
			}
		}
	});

	character.ChildRemoved.Connect((child) => {
		if (child.IsA("Tool")) {
			destroyViewmodel();
		}
	});
}

// --- Initialize ---

export function initialize(): void {
	// Watch current character if it exists
	if (localPlayer.Character) {
		watchCharacter(localPlayer.Character);
	}

	// Watch future characters (respawn)
	localPlayer.CharacterAdded.Connect((character) => {
		destroyViewmodel();
		watchCharacter(character);
	});

	// Camera instance can change after respawn — destroy stale viewmodel
	Workspace.GetPropertyChangedSignal("CurrentCamera").Connect(() => {
		destroyViewmodel();
	});

	RunService.BindToRenderStep("ViewmodelUpdate", Enum.RenderPriority.Camera.Value + 1, update);

	print("[ViewmodelController] Initialized");
}
