import { assets } from "@kaplayjs/crew";
import kaplay, { Asset, AudioPlay, GameObj, KAPLAYCtx, KAPLAYOpt, KEventController, SpriteCompOpt, SpriteData } from "kaplay";

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
	 * Register an event that runs once when game ends, either succeeded, failed or timed out.
	 */
	onEnd: (action: () => void) => KEventController;
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
	onLoad?: (k: LoadCtx) => void;
	/**
	 * Main entry of the game code. Should return a game object made by `k.make()` that contains the whole game.
	 *
	 * @example
	 * ```js
	 * ```
	 */
	onStart: (ctx: MinigameCtx) => GameObj;
	/**
	 * The id of the minigame (getter).
	 * Will always return ${author}:${prompt}
	 */
	id?: string;
};

export type KaplayWareCtx = {
	kCtx: KAPLAYCtx;
	gameInProgress: boolean;
	time: number;
	score: number;
	lives: number;
	curMinigameIdx: number;
	nextGame: () => void;
	onChange: (action: (g: Minigame) => void) => KEventController;
	curGame: () => Minigame;
	runGame: (g: Minigame) => { start: () => void; };
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

	function addScoreText() {
		return k.add([
			k.text(wareCtx.score.toString()),
			k.color(k.BLACK),
			k.anchor("center"),
			k.scale(4),
			k.pos(k.center().x, k.center().y - 90),
		]);
	}

	function addHearts(lives: number) {
		const hearts: ReturnType<typeof addHeart>[] = [];

		function addHeart() {
			const heart = k.add([
				k.sprite("@heart"),
				k.pos(),
				k.anchor("center"),
				k.scale(2),
				k.rotate(),
				k.opacity(),
				k.z(100),
			]);

			return heart;
		}

		for (let i = 0; i < lives; i++) {
			const INITIAL_POS = k.vec2(k.center().x - 100, k.center().y + 100);
			const heart = addHeart();
			heart.pos = INITIAL_POS.add(k.vec2((heart.width * i) * 2.5, 0));
			hearts.push(heart);
		}

		return hearts;
	}

	// const transition = k.add();
	let wonLastGame = true;

	function prepTransition() {
		const sound = k.play("@prepJingle");

		const bg = k.add([
			k.rect(k.width(), k.height()),
			k.color(k.rgb(50, 156, 64)),
		]);

		const scoreText = addScoreText();
		const hearts = addHearts(wareCtx.lives);
		const bean = k.add([
			k.sprite("@bean"),
			k.scale(2),
			k.anchor("center"),
			k.pos(k.center()),
		]);

		return {
			onEnd: (action: () => void) => {
				sound.onEnd(() => {
					bg.destroy();
					scoreText.destroy();
					bean.destroy();
					hearts.forEach((heart) => heart.destroy());
					action();
				});
			},
		};
	}

	function winTransition() {
		const sound = k.play("@winJingle");

		const bg = k.add([
			k.rect(k.width(), k.height()),
			k.color(k.rgb(77, 255, 100)),
		]);

		const scoreText = addScoreText();
		const hearts = addHearts(wareCtx.lives);
		const bean = k.add([
			k.sprite("@bean"),
			k.scale(2),
			k.anchor("center"),
			k.pos(k.center()),
		]);

		return {
			onEnd: (action: () => void) => {
				sound.onEnd(() => {
					bg.destroy();
					scoreText.destroy();
					bean.destroy();
					hearts.forEach((heart) => heart.destroy());
					action();
				});
			},
		};
	}

	function loseTransition() {
		const sound = k.play("@loseJingle");

		const bg = k.add([
			k.rect(k.width(), k.height()),
			k.color(k.rgb(57, 81, 150)),
		]);

		const scoreText = addScoreText();
		const hearts = addHearts(k.clamp(wareCtx.lives + 1, 0, 4));
		hearts[hearts.length - 1].fadeOut(0.1);
		const beant = k.add([
			k.sprite("@beant"),
			k.scale(2),
			k.anchor("center"),
			k.pos(k.center()),
		]);

		return {
			onEnd: (action: () => void) => {
				sound.onEnd(() => {
					bg.destroy();
					scoreText.destroy();
					beant.destroy();
					hearts.forEach((heart) => heart.destroy());
					action();
				});
			},
		};
	}

	function speedupTransition() {
		const sound = k.play("@speedJingle");
		return {
			onEnd: (action: () => void) => {
				sound.onEnd(() => {
					// bg.destroy();
					// bean.destroy();
					// hearts.forEach((heart) => heart.destroy());
					action();
				});
			},
		};
	}

	const wareCtx: KaplayWareCtx = {
		kCtx: k,
		gameInProgress: false,
		time: 0,
		score: 0,
		lives: 4,
		curMinigameIdx: 0,
		runGame(g) {
			g.id = `${g.author}:${g.prompt}`;
			onChangeEvent.trigger(g);

			const onEndEvent = new k.KEvent();
			const onTimeoutEvent = new k.KEvent();

			if (g.prompt.length > 12) {
				throw new Error("Prompt cannot exceed 12 characters!");
			}

			const ctx = {};

			for (const api of gameAPIs) {
				ctx[api] = k[api];
				if (api == "sprite") {
					ctx[api] = (spr: string | SpriteData | Asset<SpriteData>, opts?: SpriteCompOpt) => {
						return k.sprite(wareCtx.curGame().id + spr, opts);
					};
				}
			}

			const input = gameBox.add([]);

			// TODO: custom cam
			const api: MinigameAPI = {
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
				onEnd: (action) => onEndEvent.add(action),
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
					minigameScene.paused = true;
					wareCtx.nextGame();
				},
			};

			gameBox.removeAll();
			wareCtx.time = g.duration;
			let minigameScene = g.onStart({
				...ctx,
				...api,
				width: k.width,
				height: k.height,
			} as unknown as MinigameCtx);
			minigameScene = gameBox.add(minigameScene);

			let timerEnabled = false;

			const updateEV = k.onUpdate(() => {
				// this is for pausing the input
				input.paused = !timerEnabled;

				// the update for the gameplay
				if (timerEnabled) {
					wareCtx.time -= k.dt();
					if (wareCtx.time <= g.duration / 4) {
						// k.debug.log(wareCtx.time);
					}

					if (wareCtx.time <= 0 && timerEnabled) {
						timerEnabled = false;
						onTimeoutEvent.trigger();
					}
				}
			});

			function addPrompt() {
				const promptTitle = k.add([
					k.color(k.BLACK),
					k.text(g.prompt, { align: "center", size: 100 }),
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
					timerEnabled = true;
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
			return games[wareCtx.curMinigameIdx];
		},
		onChange(action) {
			return k.getTreeRoot().on("change", action);
		},
		nextGame() {
			let transition: ReturnType<typeof winTransition> = null;
			if (wonLastGame) transition = winTransition();
			else transition = loseTransition();

			transition.onEnd(() => {
				const nextGame = k.choose(games.filter((game) => game != wareCtx.curGame()));
				wareCtx.curMinigameIdx = games.indexOf(nextGame);
				const gameProcess = wareCtx.runGame(nextGame);
				prepTransition().onEnd(() => gameProcess.start());
			});
		},
	};

	const onChangeEvent = new k.KEvent<[Minigame]>();

	// # LOADING
	const loadCtx = {};
	// TODO: report error msg when calling forbidden functions
	for (const api of loadAPIs) {
		loadCtx[api] = k[api];
	}

	for (const game of games) {
		game.id = `${game.author}:${game.prompt}`;
		game.urlPrefix = game.urlPrefix ?? "";
		game.duration = game.duration ?? DEFAULT_DURATION;
		game.hue = game.hue ?? 1;

		if (game.onLoad) {
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
						name = game.id + name;
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

			game.onLoad(loadCtx as LoadCtx);
			loadCtx["loadRoot"] = k.loadRoot;
		}
	}

	// INITIALIZE THE GAME
	const gameBox = k.add([
		k.fixed(),
		k.pos(),
		k.timer(),
	]);

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
