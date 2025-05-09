import { assets } from "@kaplayjs/crew";
import { Asset, Color, CompList, GameObj, GameObjRaw, KEventController, MergeComps, SpriteComp, SpriteCompOpt, SpriteData, TweenController, Vec2 } from "kaplay";
import { gameAPIs } from "../api";
import { ConfettiOpt } from "../objects/confetti";
import k from "../../../engine";

type Friend = keyof typeof assets | `${keyof typeof assets}-o`;
type AtFriend = `@${Friend}`;
type CustomSprite<T extends string> = T extends AtFriend | string & {} ? AtFriend | string & {} : string;

/**
 * A modified {@link sprite `sprite()`} component to fit KAPLAYware.
 *
 * @group Component Types
 */
interface WareSpriteComp extends Omit<SpriteComp, "sprite"> {
	/**
	 * Name of the sprite.
	 */
	sprite: CustomSprite<string>;
}

// TODO: maybe actually remove these functions from the add, make a banProps list from game obj???
// TODO: maybe move these other types to another place?????????
type WareGameObjRaw = Omit<GameObjRaw, "onButtonDown" | "onButtonPress" | "onButtonRelease" | "add"> & {
	add<T extends CompList<unknown>>(comps?: [...T]): WareGameObj<T[number]>;
};

/** A modified type of GameObj that removes a few unused functions
 *
 * The basic unit of KAPLAY yada yada.
 * @group GameObj
 */
type WareGameObj<T = any> = WareGameObjRaw & MergeComps<T>;

k.add();

export type StartCtx = Pick<typeof k, typeof gameAPIs[number]> & {
	/**
	 * — Modified KAPLAYWARE add() function.
	 *
	 * Assemble a game object from a list of components, and add it to the game.
	 */
	add<T extends CompList<unknown>>(comps?: [...T]): WareGameObj<T[number]>;
	/**
	 * — Modified KAPLAYWARE sprite() component. Adds default assets
	 *
	 * Attach and render a sprite to a Game Object. yada yada
	 *
	 * @param spr - The sprite to render.
	 * @param opt - Options for the sprite component. See {@link SpriteCompOpt `SpriteCompOpt`}.
	 */
	sprite(spr: CustomSprite<string> | SpriteData | Asset<SpriteData>, opt?: SpriteCompOpt): WareSpriteComp;
};

/** The type of input a minigame does */
export type MinigameInput = "mouse" | "keys" | "both";

/** A button */
export type InputButton =
	| "action"
	| "left"
	| "right"
	| "up"
	| "down"
	| "click";

/** The specific API for minigames */
export type MinigameAPI = {
	/**
	 * Register an event that runs once when a button is pressed.
	 */
	onButtonPress(btn: InputButton, action: () => void): KEventController;
	/**
	 * Register an event that runs once when a button is released.
	 */
	onButtonReleasse(btn: InputButton, action: () => void): KEventController;
	/**
	 * Register an event that runs every frame when a button is held down.
	 */
	onButtonDown(btn: InputButton, action: () => void): KEventController;
	/** Returns true if the button was pressed in the last frame */
	isButtonPressed(btn: InputButton): boolean;
	/** Returns true if the button is currently being held down */
	isButtonDown(btn: InputButton): boolean;
	/** Returns true if the button was released in the last frame */
	isButtonReleased(btn: InputButton): boolean;

	/** Adds a buncha confetti!!! */
	addConfetti(opts?: ConfettiOpt): void;

	setCamScale(val: Vec2): Vec2;
	getCamScale(): Vec2;
	setCamAngle(val: number): number;
	getCamAngle(): number;
	setCamPos(val: Vec2): Vec2;
	getCamPos(): Vec2;
	shakeCam(val?: number): void;
	/** Flashes the screen
	 * @param flashColor The color the flash will be
	 * @param time How long the flash will be on screen
	 */
	flashCam(flashColor?: Color, time?: number, opacity?: number): TweenController;
	/** Gets the current RGB of the background of your minigame */
	getRGB(): Color;
	/** Sets the RGB to the background of your minigame */
	setRGB(val: Color): void;
	/** Register an event that runs once when timer runs out. */
	onTimeout: (action: () => void) => KEventController;
	/** Run this when player succeeded in completing the game. */
	win: () => void;
	/** Run this when player failed. */
	lose: () => void;
	/** Run this when your minigame has 100% finished all win/lose animations etc */
	finish: () => void;
	/** The win/lose state of the current minigame
	 * If ctx.win() has been called, it will return true
	 *
	 * If ctx.lose() was called, it will return false
	 *
	 * If nor ctx.win() or ctx.lose() has been called, it will return undefined
	 */
	readonly winState: boolean | undefined;
	/** The current difficulty of the game */
	readonly difficulty: 1 | 2 | 3;
	/** The speed multiplier */
	readonly speed: number;
	/** The lives the player has left */
	readonly lives: number;
	/** The time left for the minigame to finish */
	readonly timeLeft: number;
	/** The final duration of your minigame */
	readonly duration: number;
	/** The final prompt of  your minigame */
	readonly prompt: string;
};

/** The context for the allowed functions in a minigame */
export type MinigameCtx = StartCtx & MinigameAPI;
