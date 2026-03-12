import { UserInputService, GuiService, Workspace, Players, RunService } from "@rbxts/services";

/**
 * Centralized cursor/mouse-lock manager.
 *
 * Default state (gameplay): mouse locked to center, cursor hidden.
 * When any UI is open: mouse free, cursor visible, camera frozen in rotation
 * but still follows the player's position so there's no teleport on close.
 *
 * Usage:
 *   CursorController.push()  — call when a UI opens
 *   CursorController.pop()   — call when that UI closes
 */

let openCount = 0;
let followConnection: RBXScriptConnection | undefined;

function applyLocked(): void {
	if (followConnection) {
		followConnection.Disconnect();
		followConnection = undefined;
	}
	const camera = Workspace.CurrentCamera;
	if (camera) camera.CameraType = Enum.CameraType.Custom;
	UserInputService.MouseBehavior = Enum.MouseBehavior.LockCenter;
	UserInputService.MouseIconEnabled = false;
	GuiService.TouchControlsEnabled = false;
}

function applyUnlocked(): void {
	const camera = Workspace.CurrentCamera;
	if (!camera) return;

	// Freeze rotation but keep following the player's head position each frame.
	// CameraType.Scriptable stops the default camera module from running (and from
	// overriding MouseBehavior back to LockCenter), while our RenderStepped loop
	// prevents the camera from staying stuck when the player moves.
	camera.CameraType = Enum.CameraType.Scriptable;
	const frozenLook = camera.CFrame.LookVector;

	followConnection = RunService.RenderStepped.Connect(() => {
		const cam = Workspace.CurrentCamera;
		if (!cam) return;
		const head = Players.LocalPlayer.Character?.FindFirstChild("Head") as BasePart | undefined;
		if (!head) return;
		cam.CFrame = CFrame.lookAt(head.Position, head.Position.add(frozenLook));
	});

	UserInputService.MouseBehavior = Enum.MouseBehavior.Default;
	UserInputService.MouseIconEnabled = true;
	GuiService.TouchControlsEnabled = false;
}

/** Signal that a UI has opened. Mouse will be freed if not already. */
export function push(): void {
	openCount++;
	if (openCount === 1) {
		applyUnlocked();
	}
}

/** Signal that a UI has closed. Mouse re-locks once all UIs are gone. */
export function pop(): void {
	openCount = math.max(0, openCount - 1);
	if (openCount === 0) {
		applyLocked();
	}
}

/** True when at least one UI is holding the cursor open. */
export function isUnlocked(): boolean {
	return openCount > 0;
}

export function initialize(): void {
	applyLocked();
	print("[CursorController] Initialized — mouse locked");
}
