import { assets } from "@kaplayjs/crew";
import kaplay, { Asset, KAPLAYOpt, Key, SpriteCompOpt, SpriteData } from "kaplay";
import { addBomb, addPrompt } from "./objects";
import { loseTransition, prepTransition, winTransition } from "./transitions";
import { Button, KaplayWareCtx, LoadCtx, Minigame, MinigameAPI, MinigameCtx } from "./types";

export const loadAPIs = [
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

export const gameAPIs = [
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
	"burp",
] as const;

const DEFAULT_DURATION = 4;

export default function kaplayware(games: Minigame[] = [], opts: KAPLAYOpt = {}): KaplayWareCtx {
	const k = kaplay({
		...opts,
		width: 800,
		height: 600,
		font: "apl386",
	});

	k.loadFont("apl386", "fonts/apl386.ttf", { outline: { width: 4, color: k.BLACK } });

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
	let wonLastGame: boolean = null;

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
		gameRunning: false,
		time: 0,
		score: 0,
		lives: 4,
		speed: 1,
		difficulty: 1,
		gameIdx: 0,
		runGame(g) {
			// SETUP
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

			// OBJECT STUFF
			gameBox.removeAll();

			function dirToKeys(button: Button): Key[] {
				if (button == "left") return ["left", "a"];
				else if (button == "down") return ["down", "s"];
				else if (button == "up") return ["up", "w"];
				else if (button == "right") return ["right", "d"];
			}

			const gameAPI: MinigameAPI = {
				onButtonPress: (btn, action) => {
					const func = () => wareCtx.inputEnabled ? action() : false;
					if (btn === "action") {
						return k.KEventController.join([
							gameBox.onKeyPress("space", func),
							gameBox.onMousePress("left", func),
						]);
					}
					else return gameBox.onKeyPress(dirToKeys(btn), func);
				},
				onButtonRelease: (btn, action) => {
					const func = () => wareCtx.inputEnabled ? action() : false;
					if (btn === "action") {
						return k.KEventController.join([
							gameBox.onKeyRelease("space", func),
							gameBox.onMouseRelease("left", func),
						]);
					}
					else return gameBox.onKeyRelease(dirToKeys(btn), func);
				},
				onButtonDown: (btn, action) => {
					const func = () => wareCtx.inputEnabled ? action() : false;
					if (btn === "action") {
						return k.KEventController.join([
							gameBox.onKeyDown("space", func),
							gameBox.onMouseDown("left", func),
						]);
					}
					else return gameBox.onKeyDown(dirToKeys(btn), func);
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
				finish: () => wareCtx.nextGame(),
				difficulty: wareCtx.difficulty,
				lives: wareCtx.lives,
				speed: wareCtx.speed,
			};

			wareCtx.time = g.duration;
			const minigameScene = gameBox.add(g.start({
				...gameCtx,
				...gameAPI,
			} as unknown as MinigameCtx));

			let clockRunning = true;
			gameBox.onUpdate(() => {
				if (clockRunning) {
					wareCtx.time -= k.dt();
					if (wareCtx.time <= 0 && clockRunning) {
						clockRunning = false;
						onTimeoutEvent.trigger();
						wareCtx.inputEnabled = false;
					}

					if (wareCtx.time <= g.duration / 2 && k.get("bomb").length == 0) addBomb(k, wareCtx);
				}
			});

			return minigameScene;
		},
		curGame() {
			return games[wareCtx.gameIdx];
		},
		onChange(action) {
			return k.getTreeRoot().on("change", action);
		},
		nextGame() {
			function start() {
				const nextGame = k.choose(games.filter((game) => {
					if (games.length == 1) return game;
					else return game != wareCtx.curGame();
				}));
				wareCtx.gameIdx = games.indexOf(nextGame);
				wareCtx.runGame(nextGame);
				wareCtx.gameRunning = false;
				let prompt: ReturnType<typeof addPrompt> = null;
				const prepTrans = prepTransition(k, wareCtx);
				prepTrans.onHalf(() => prompt = addPrompt(k, coolPrompt(nextGame.prompt)));
				prepTrans.onEnd(() => {
					k.wait(0.15, () => {
						prompt.fadeOut(0.15).onEnd(() => prompt.destroy());
					});
					wareCtx.inputEnabled = true;
					wareCtx.gameRunning = true;
				});
			}

			if (wonLastGame != null) {
				let transition: ReturnType<typeof prepTransition> = null;
				if (wonLastGame) transition = winTransition(k, wareCtx);
				else transition = loseTransition(k, wareCtx);

				transition.onEnd(() => start());
			}
			else start();
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

	const game = k.add([k.stay(["game"])]);
	game.onUpdate(() => {
		gameBox.paused = !wareCtx.gameRunning;
	});

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
