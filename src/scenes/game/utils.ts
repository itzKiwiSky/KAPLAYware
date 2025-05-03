import { Color } from "kaplay";
import { MinigameCtx, MinigameInput } from "./context/types";
import games from "./games";
import { Minigame } from "./types";
import k from "../../engine";

// TODO: organize this a bit, what should go here and what shouldn't?

export const getGameID = (g: Minigame) => {
	const modules = import.meta.glob("../../games/*/*.ts", { eager: true });
	const gamePath = Object.keys(modules).find((pathKey: string) => (modules[pathKey] as any).default == g);
	const filename = gamePath.split("/")[gamePath.split("/").length - 1].replace(".ts", "");
	return `${g.author}:${filename}`;
};
export const getGameByID = (id: string) => games.find((minigame) => `${minigame.author}:${minigame.prompt}` == id);

/**
 * Returns a copy of the object where it'll only have the keys you pass as param
 * @param obj The object
 * @param keys The keys you want to maintain in the object
 * @returns The new object with only those keys
 */
export function pickKeysInObj<T extends any, R extends keyof T>(obj: T, keys: R[]) {
	return keys.reduce((result: Pick<T, R>, prop) => {
		result[prop] = obj[prop];
		return result;
	}, {} as Pick<T, R>);
}

export const getInputMessage = (g: Minigame) => {
	const input = getGameInput(g);
	let message = "";

	if (input == "both") {
		message = "both";
		if (gameHidesMouse(g)) message += " (mouse hidden)";
		return message;
	}
	else if (input == "mouse") {
		message = "mouse";
		if (gameHidesMouse(g)) message += " (hidden)";
		return message;
	}
	else if (input == "keys") return input;
};

/** Gets the input of the minigame
 * @param g The minigame
 * @returns A {@link MinigameInput `MinigameInput`}
 */
export function getGameInput(g: Minigame): MinigameInput {
	if (g.isBoss) return "both";
	if (g.isBoss == true || g.input == "mouse (hidden)" || g.input == "mouse") return "mouse";
	else return "keys";
}

/** Gets the duration of the minigame
 * @param g The minigame
 * @param context The context of the minigame
 */
export const getGameDuration = (g: Minigame, context: MinigameCtx): number | undefined => {
	if (g.isBoss == true) return undefined;
	else if (g.isBoss == false) {
		let duration = 0;
		if (typeof g.duration == "function") duration = g.duration(context);
		else if (typeof g.duration == "number") duration = g.duration;
		return duration;
	}
};

/** Gets the color of the minigame
 * @param g The minigame
 * @param context The context of the minigame
 */
export const getGameColor = (g: Minigame, context: MinigameCtx): Color => {
	if (typeof g.rgb == "function") return g.rgb(context);
	else if ("r" in g.rgb) return g.rgb;
	else if (g.rgb[0]) return k.Color.fromArray(g.rgb);
};

export const gameHidesMouse = (g: Minigame) => {
	if (g.isBoss) return g.hideMouse;
	else if (g.isBoss == false) return g.input == "mouse (hidden)" || g.input == "keys";
};

export const isDefaultAsset = (assetName: any) => typeof assetName == "string" && assetName.includes("@");
