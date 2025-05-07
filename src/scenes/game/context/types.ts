import { assets } from "@kaplayjs/crew";
import { Asset, Color, CompList, GameObj, KEventController, SpriteComp, SpriteCompOpt, SpriteData, TweenController, Vec2 } from "kaplay";
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

export type StartCtx = Pick<typeof k, typeof gameAPIs[number]> & {
	/** ### Modified add() for KAPLAYware */
	add<T extends CompList<unknown>>(comps?: [...T]): GameObj<T[number]>;
	/** ### Custom sprite component for KAPLAYware that holds default assets
	 *
	 * Attach and render a sprite to a Game Object.
	 *
	 * @param spr - The sprite to render.
	 * @param opt - Options for the sprite component. See {@link SpriteCompOpt `SpriteCompOpt`}.
	 *
	 * @example
	 * ```js
	 * // minimal setup
	 * add([
	 *     sprite("bean"),
	 * ])
	 *
	 * // with options
	 * const bean = add([
	 *     sprite("bean", {
	 *         // start with animation "idle"
	 *         anim: "idle",
	 *     }),
	 * ])
	 *
	 * // play / stop an anim
	 * bean.play("jump")
	 * bean.stop()
	 *
	 * // manually setting a frame
	 * bean.frame = 3
	 * ```
	 *
	 * @returns The sprite comp.
	 * @since v2000.0
	 * @group Components
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
	onInputButtonPress(btn: InputButton, action: () => void): KEventController;
	/**
	 * Register an event that runs once when a button is released.
	 */
	onInputButtonRelease(btn: InputButton, action: () => void): KEventController;
	/**
	 * Register an event that runs every frame when a button is held down.
	 */
	onInputButtonDown(btn: InputButton, action: () => void): KEventController;
	isInputButtonPressed(btn: InputButton): boolean;
	isInputButtonDown(btn: InputButton): boolean;
	isInputButtonReleased(btn: InputButton): boolean;
	// TODO: maybe rename these to only onInputPress and onInputDown, weren't these name that before?
	// I think they were called onButtonPress, that's why they were confusing

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
