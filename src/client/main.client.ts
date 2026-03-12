import * as ClientNetwork from "client/network/client-network";
import { RenderController, CombatController, InventoryController, SkillController, NPCController } from "client/controllers";
import { onClientEvent } from "client/network/client-network";

print("[Client] Initializing...");

// 1. Network — waits for server-created remotes
ClientNetwork.initialize();

// 2. Listen for player data
onClientEvent("PlayerDataLoaded", (profile) => {
	print(`[Client] Profile loaded — Level ${profile.combatLevel}, Gold: ${profile.gold}`);
});

onClientEvent("PlayerDataError", (message) => {
	warn(`[Client] Data error: ${message}`);
});

// 3. Combat input and event handling
CombatController.initialize();

// 4. Inventory UI and ground item interaction
InventoryController.initialize();

// 5. Skills UI and gathering interaction
SkillController.initialize();

// 6. NPC interaction, dialogue, and shop UI
NPCController.initialize();

// 7. Render loop (register render systems before calling this)
RenderController.initialize();

print("[Client] All systems ready");
