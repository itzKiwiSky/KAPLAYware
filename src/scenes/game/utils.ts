import { Color, GameObj, KEventController, Tag } from "kaplay";
import { MinigameCtx, MinigameInput } from "./context/types";
import games, { modules } from "./games";
import k from "../../engine";
import Minigame from "../../types/Minigame";

export const getGameID = (g: Minigame) => {
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

/** Merge 2 objects and retrun a proper cool reference to both, also typed
 * @param obj1
 * @param obj2
 * @returns A merged object with proper typing
 */
export function mergeWithRef<T extends any, R extends any>(obj1: T, obj2: R) {
	// some crazy code to merge them together
	const result = {} as T & R;

	Object.defineProperties(result, {
		...Object.getOwnPropertyDescriptors(obj1),
		...Object.getOwnPropertyDescriptors(obj2),
	});

	return result;
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
	if (g.isBoss == true) return "both";
	else if (g.isBoss == false && g.input == "mouse" || g.input == "mouse (hidden)") return "mouse";
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

/** Runs something on all current and future objects with a certain tag
 * @param parent The parent to check objects
 * @param t The tag
 * @param action The something to run
 */
export function forAllCurrentAndFuture(parent: GameObj, t: Tag, action: (obj: GameObj) => void): KEventController {
	parent.get(t, { recursive: true }).forEach((obj) => action(obj));
	let paused = false;

	const add = k.onAdd(t, (obj) => {
		if (obj.parent == parent) action(obj);
	});

	const tag = k.onTag((obj, tag) => {
		if (obj.parent == parent && tag === t) {
			action(obj);
		}
	});

	return {
		get paused() {
			return paused;
		},
		set paused(val: boolean) {
			paused = val;
			add.paused = paused;
			tag.paused = paused;
		},
		cancel() {
			add.cancel();
			tag.cancel();
		},
	};
}

type Func = (...args: any[]) => any;
/** Define an overload of 2 functions
 * @param fn1 The first function
 * @param fn2 The second function
 */
export function overload2<A extends Func, B extends Func>(
	fn1: A,
	fn2: B,
): A & B {
	return ((...args) => {
		const al = args.length;
		if (al === fn1.length) return fn1(...args);
		if (al === fn2.length) return fn2(...args);
	}) as A & B;
}
