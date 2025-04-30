import { createGameCtx } from "./context";
import { createWareApp } from "./kaplayware";
import { Minigame } from "./types";

export function createPreviewWare() {
	const wareApp = createWareApp();

	return {
		containerRoot: wareApp.rootObj,
		runGame(minigame: Minigame) {
			const ctx = createGameCtx(wareApp, minigame);
			minigame.start(ctx);
		},
	};
}
