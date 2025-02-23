import { assets } from "@kaplayjs/crew";
import kaplay, { Asset, AudioPlay, GameObj, KAPLAYCtx, KAPLAYOpt, KEventController, SpriteCompOpt, SpriteData } from "kaplay";
import { addBomb } from "./objects";
import { loseTransition, prepTransition, winTransition } from "./transitions";

const loadAPIs = [
	"loadRoot",
	"loadSprite",
	"loadSpriteAtlas",
	"loadAseprite",
	"loadPedit",
	"loadBean",
	"loadJSON",
	"loadSound",
	"loadFont",
	"loadBitmapFont",
	"loadShader",
	"loadShaderURL",
	"load",
	"loadProgress",
] as const;

const gameAPIs = [
	"make",
	"pos",
	"scale",
	"rotate",
	"color",
	"opacity",
	"sprite",
	"text",
	"rect",
	"circle",
	"uvquad",
	"area",
	"anchor",
	"z",
	"outline",
	"body",
	"doubleJump",
	"move",
	"offscreen",
	"follow",
	"shader",
	"timer",
	"fixed",
	"stay",
	"health",
	"lifespan",
	"state",
	"fadeIn",
	"play",
	"rand",
	"randi",
	"dt",
	"time",
	"vec2",
	"rgb",
	"hsl2rgb",
	"choose",
	"chance",
	"easings",
	"map",
	"mapc",
	"wave",
	"lerp",
	"deg2rad",
	"rad2deg",
	"clamp",
	"width",
	"height",
	"mousePos",
	"mouseDeltaPos",
	"camPos",
	"camScale",
	"camRot",
	"center",
	"isFocused",
	"isTouchscreen",
	"drawSprite",
	"drawText",
	"formatText",
	"drawRect",
	"drawLine",
	"drawLines",
	"drawTriangle",
	"drawCircle",
	"drawEllipse",
	"drawUVQuad",
	"drawPolygon",
	"drawFormattedText",
	"drawMasked",
	"drawSubtracted",
	"pushTransform",
	"popTransform",
	"pushTranslate",
	"pushScale",
	"pushRotate",
	"pushMatrix",
	"LEFT",
	"RIGHT",
	"UP",
	"DOWN",
	"addKaboom",
	"debug",
	"Line",
	"Rect",
	"Circle",
	"Polygon",
	"Vec2",
	"Color",
	"Mat4",
	"Quad",
	"RNG",
	"wait",
	"tween",
	"loop",
	"burp",
] as const;

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
	runGame: (g: Minigame) => { start: () => void; };
	/** Speeds up the game */
	speedUp: () => void;
};

const DEFAULT_DURATION = 4;

export default function kaplayware(games: Minigame[] = [], opts: KAPLAYOpt = {}): KaplayWareCtx {
	const k = kaplay({
		...opts,
		width: 800,
		height: 600,
	});

	k.loadSound("@prepJingle", "sounds/prepJingle.ogg");
	k.loadSound("@winJingle", "sounds/winJingle.ogg");
	k.loadSound("@loseJingle", "sounds/loseJingle.ogg");
	k.loadSound("@speedJingle", "sounds/speedJingle.ogg");

	k.loadSprite("@bean", assets.bean.sprite);
	k.loadSprite("@beant", assets.beant.sprite);
	k.loadSprite("@mark", assets.mark.sprite);
	k.loadSprite("@cloud", assets.cloud.sprite);
	k.loadSprite("@heart", assets.heart.sprite);
	k.loadSprite("@bomb", assets.question_mark.sprite);
	k.loadSprite("@kaboom", assets.kaboom.sprite);

	const coolPrompt = (prompt: string) => prompt.toUpperCase() + (prompt[prompt.length - 1] == "!" ? "" : "!");
	const getGameID = (g: Minigame) => `${g.author}:${g.prompt}`;
	const onChangeEvent = new k.KEvent<[Minigame]>();
	let wonLastGame = false;

	// INITIALIZE THE GAME
	const gameBox = k.add([
		k.fixed(),
		k.pos(),
		k.timer(),
		k.stay(["game"]),
	]);

	const wareCtx: KaplayWareCtx = {
		kCtx: k,
		inputEnabled: false,
		gamePaused: false,
		time: 0,
		score: 0,
		lives: 4,
		speed: 1,
		difficulty: 1,
		gameIdx: 0,
		runGame(g) {
			if (g.prompt.length > 12) throw new Error("Prompt cannot exceed 12 characters!");

			onChangeEvent.trigger(g);
			const onTimeoutEvent = new k.KEvent();

			const gameCtx = {};
			for (const api of gameAPIs) {
				gameCtx[api] = k[api];

				if (api == "sprite") {
					gameCtx[api] = (spr: string | SpriteData | Asset<SpriteData>, opts?: SpriteCompOpt) => {
						const spriteComp = k.sprite(`${getGameID(g)}-${spr}`, opts);
						return {
							...spriteComp,
							set sprite(val: string) {
								spriteComp.sprite = `${getGameID(g)}-${val}`;
							},

							get sprite() {
								return spr.toString();
							},
						};
					};
				}
			}

			const input = gameBox.add([]);
			const gameAPI: MinigameAPI = {
				onButtonPress: (btn, action) => {
					if (btn === "action") {
						return k.KEventController.join([
							input.onKeyPress("space", action),
							input.onMousePress("left", action),
						]);
					}
					return input.onKeyPress(btn, action);
				},
				onButtonRelease: (btn, action) => {
					if (btn === "action") {
						return k.KEventController.join([
							input.onKeyRelease("space", action),
							input.onMouseRelease("left", action),
						]);
					}
					return input.onKeyRelease(btn, action);
				},
				onButtonDown: (btn, action) => {
					if (btn === "action") {
						return k.KEventController.join([
							input.onKeyDown("space", action),
							input.onMouseDown("left", action),
						]);
					}
					return input.onKeyDown(btn, action);
				},
				onTimeout: (action) => onTimeoutEvent.add(action),
				win: () => {
					wareCtx.score++;
					if (wareCtx.time > 0) wareCtx.time = 0;
					wonLastGame = true;
				},
				lose: () => {
					wareCtx.lives--;
					if (wareCtx.time > 0) wareCtx.time = 0;
					wonLastGame = false;
				},
				finish: () => {
					wareCtx.gamePaused = true;
					wareCtx.nextGame();
				},
				difficulty: wareCtx.difficulty,
				lives: wareCtx.lives,
				speed: wareCtx.speed,
			};

			gameBox.removeAll();
			wareCtx.time = g.duration;
			wareCtx.gamePaused = true;
			const minigameScene = gameBox.add(g.start({
				...gameCtx,
				...gameAPI,
				width: k.width,
				height: k.height,
			} as unknown as MinigameCtx));

			let gameEnabled = false;
			const updateEV = k.onUpdate(() => {
				// this is for pausing the input
				input.paused = !gameEnabled;

				if (gameEnabled) {
					wareCtx.time -= k.dt();
					if (wareCtx.time <= 0) {
						gameEnabled = false;
						input.paused = true;
						onTimeoutEvent.trigger();
						updateEV.cancel();
					}

					if (wareCtx.time <= g.duration / 2 && k.get("bomb").length == 0) addBomb(k, wareCtx);
				}
			});

			function addPrompt() {
				const promptTitle = k.add([
					k.color(k.BLACK),
					k.text(coolPrompt(g.prompt), { align: "center", size: 100 }),
					k.pos(k.center()),
					k.anchor("center"),
					k.scale(),
					k.opacity(),
					k.timer(),
					k.z(101),
				]);

				promptTitle.fadeIn(1, k.easings.easeOutQuint);
				promptTitle.tween(k.vec2(1.5), k.vec2(1), 1, (p) => promptTitle.scale = p, k.easings.easeOutQuint).onEnd(() => {
					promptTitle.fadeOut(0.1).onEnd(() => promptTitle.destroy());
					gameEnabled = true;
					wareCtx.gamePaused = false;
				});
			}

			return {
				start() {
					wareCtx.time = g.duration;
					addPrompt();
				},
			};
		},
		curGame() {
			return games[wareCtx.gameIdx];
		},
		onChange(action) {
			return k.getTreeRoot().on("change", action);
		},
		nextGame() {
			let transition: ReturnType<typeof winTransition> = null;
			if (wonLastGame) transition = winTransition(k, wareCtx);
			else transition = loseTransition(k, wareCtx);

			transition.onEnd(() => {
				const nextGame = k.choose(games.filter((game) => game != wareCtx.curGame()));
				wareCtx.gameIdx = games.indexOf(nextGame);
				const gameProcess = wareCtx.runGame(nextGame);
				prepTransition(k, wareCtx).onEnd(() => gameProcess.start());
			});
		},
		speedUp() {
			this.speed += this.speed * 0.07;
		},
	};

	// # LOADING
	const loadCtx = {};
	// TODO: report error msg when calling forbidden functions
	for (const api of loadAPIs) {
		loadCtx[api] = k[api];
	}

	for (const game of games) {
		game.urlPrefix = game.urlPrefix ?? "";
		game.duration = game.duration ?? DEFAULT_DURATION;
		game.hue = game.hue ?? 1;

		if (game.load) {
			// patch loadXXX() functions to scoped asset names
			const loaders = [
				"loadSprite",
				"loadSpriteAtlas",
				"loadAseprite",
				"loadPedit",
				"loadJSON",
				"loadSound",
				"loadFont",
				"loadBitmapFont",
				"loadShader",
				"loadShaderURL",
			];

			for (const loader of loaders) {
				loadCtx[loader] = (name: string, ...args: any) => {
					if (typeof name === "string") {
						name = `${getGameID(game)}-${name}`;
					}
					return k[loader](name, ...args);
				};
			}

			// patch loadRoot() to consider g.urlPrefix
			if (game.urlPrefix != undefined) {
				loadCtx["loadRoot"] = (p: string) => {
					if (p) k.loadRoot(game.urlPrefix + p);
					return k.loadRoot().slice(game.urlPrefix.length);
				};
				k.loadRoot(game.urlPrefix);
			}
			else {
				k.loadRoot("");
			}

			game.load(loadCtx as LoadCtx);
			loadCtx["loadRoot"] = k.loadRoot;
		}
	}

	gameBox.onDraw(() => {
		const BG_S = 0.27;
		const BG_L = 0.52;

		const bgColor = k.hsl2rgb(wareCtx.curGame().hue, BG_S, BG_L);

		k.drawRect({
			width: k.width(),
			height: k.height(),
			color: bgColor,
		});
	});

	return wareCtx;
}
