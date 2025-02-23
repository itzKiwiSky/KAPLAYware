import { GameObj, KAPLAYCtx, KEventController } from "kaplay";
import { gameAPIs, loadAPIs } from "./kaplayware";

/** A button */
export type Button =
	| "action"
	| "left"
	| "right"
	| "up"
	| "down";

/** The allowed load functions */
export type LoadCtx = Pick<KAPLAYCtx, typeof loadAPIs[number]>;

/** The specific API for minigames */
export type MinigameAPI = {
	/**
	 * Register an event that runs once when a button is pressed.
	 */
	onButtonPress: (btn: Button, action: () => void) => KEventController;
	/**
	 * Register an event that runs once when a button is released.
	 */
	onButtonRelease: (btn: Button, action: () => void) => KEventController;
	/**
	 * Register an event that runs every frame when a button is held down.
	 */
	onButtonDown: (btn: Button, action: () => void) => KEventController;
	/**
	 * Register an event that runs once when timer runs out.
	 */
	onTimeout: (action: () => void) => KEventController;
	/**
	 * Run this when player succeeded in completing the game.
	 */
	win: () => void;
	/**
	 * Run this when player failed.
	 */
	lose: () => void;
	/**
	 * Run this when your minigame has 100% finished all win/lose animations etc
	 */
	finish: () => void;
	/**
	 * The current difficulty of the game
	 */
	difficulty: 1 | 2 | 3;
	/**
	 * The speed multiplier
	 */
	speed: number;
	/**
	 * The lives the player has left
	 */
	lives: number;
};

/** The context for the allowed functions in a minigame */
export type MinigameCtx = Pick<KAPLAYCtx, typeof gameAPIs[number]> & MinigameAPI;

/** The type for a minigame */
export type Minigame = {
	/**
	 * Prompt of the mini game!
	 */
	prompt: string;
	/**
	 * Name of the author of the game.
	 */
	author: string;
	/**
	 * Hue of the background color (saturation: 27, lightness: 52)
	 */
	hue?: number;
	/**
	 * How long the minigame goes for
	 */
	duration?: number;
	/**
	 * Assets URL prefix.
	 */
	urlPrefix?: string;
	/**
	 * Load assets.
	 */
	load?: (k: LoadCtx) => void;
	/**
	 * Main entry of the game code. Should return a game object made by `k.make()` that contains the whole game.
	 *
	 * @example
	 * ```js
	 * start(ctx) {
	 * 	const game = ctx.make();
	 * 	// (Your game code will be here...)
	 * 	return game;
	 * }
	 * ```
	 */
	start: (ctx: MinigameCtx) => GameObj;
};

export type KaplayWareCtx = {
	/** The KAPLAY context */
	kCtx: KAPLAYCtx;
	/** Wheter the input is enabled */
	inputEnabled: boolean;
	/** Wheter the current game is paused */
	gamePaused: boolean;
	/** The speed of the game */
	speed: number;
	/** The difficulty */
	difficulty: 1 | 2 | 3;
	/** The time left for a minigame to finish */
	time: number;
	/** The current score for the player */
	score: number;
	/** The lives left */
	lives: number;
	/** The index of the game in the games array */
	gameIdx: number;
	/** Transition to the next game */
	nextGame: () => void;
	/** Runs when the game changes */
	onChange: (action: (g: Minigame) => void) => KEventController;
	/** Returns the current minigame */
	curGame: () => Minigame;
	/** Runs a minigame */
	runGame: (g: Minigame) => GameObj;
	/** Speeds up the game */
	speedUp: () => void;
};
