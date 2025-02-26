import { assets } from "@kaplayjs/crew";
import kaplay, { AreaComp, Asset, Color, GameObj, KAPLAYOpt, KEventController, Key, SpriteCompOpt, SpriteData } from "kaplay";
import { addBomb, addPrompt } from "./objects";
import { loseTransition, prepTransition, speedupTransition, winTransition } from "./transitions";
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

export const friends = [
	"bobo",
	"bag",
	"ghosty",
	"goldfly",
	"marroc",
	"tga",
	"gigagantrum",
];

const DEFAULT_DURATION = 4;
const FORCE_SPEED_ON_GAME = false;

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
	k.loadSprite("@sun", assets.sun.sprite);
	k.loadSprite("@cloud", assets.cloud.sprite);
	k.loadSprite("@grass_tile", "sprites/grass.png");
	k.loadSprite("@trophy", "sprites/trophy.png");
	k.loadSpriteAtlas("sprites/cursor.png", {
		"@cursor": {
			width: 28,
			height: 32,
			x: 0,
			y: 0,
		},
		"@cursor_point": {
			width: 28,
			height: 32,
			x: 28,
			y: 0,
		},
		"@cursor_like": {
			width: 28,
			height: 32,
			x: 28 * 2,
			y: 0,
		},
		"@cursor_knock": {
			width: 28,
			height: 32,
			x: 28 * 3,
			y: 0,
		},
	});

	// friends for speed up
	friends.forEach((friend) => {
		k.loadSprite(`@${friend}`, assets[friend].sprite);
	});

	const coolPrompt = (prompt: string) => prompt.toUpperCase() + (prompt[prompt.length - 1] == "!" ? "" : "!");
	const getGameID = (g: Minigame) => `${g.author}:${g.prompt}`;
	const onChangeEvent = new k.KEvent<[Minigame]>();
	let wonLastGame: boolean = null;

	k.setCursor("none");

	// INITIALIZE THE GAME
	const gameBox = k.add([
		k.fixed(),
		k.pos(),
		k.timer(),
		k.stay(["game"]),
	]);

	const cursor = k.add([
		k.sprite("@cursor"),
		k.pos(),
		k.anchor("topleft"),
		k.stay(["game"]),
		k.scale(2),
		k.z(999),
	]);

	cursor.onUpdate(() => {
		if (cursor.hidden) return;
		if (!cursor.hidden && wonLastGame == true) {
			cursor.sprite = "@cursor_like";
			return;
		}

		const hovered = gameBox.get("area", { recursive: true }).filter((obj) => obj.isHovering() && !gameBox.paused).length > 0;
		if (k.isMouseDown("left")) cursor.sprite = "@cursor_knock";
		if (hovered && !k.isMouseDown("left")) cursor.sprite = "@cursor_point";
		else if (!hovered && !k.isMouseDown("left")) cursor.sprite = "@cursor";
	});

	cursor.onMouseMove(() => {
		cursor.pos = k.mousePos();
	});

	const wareCtx: KaplayWareCtx = {
		kCtx: k,
		inputEnabled: false,
		gameRunning: false,
		time: 0,
		score: 1,
		lives: 4,
		speed: 1,
		difficulty: 1,
		gameIdx: 0,
		timesSpeed: 0,
		gamesPlayed: 0,
		reset() {
			this.lives = 4;
			this.score = 1;
			this.speed = 1;
			this.difficulty = 1;
			this.timesSpeed = 0;
			this.gamesPlayed = 0;
			wonLastGame = null;
		},

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

			// TODO: CUSTOM CURSOR HIDDEN API i hate this....

			// OBJECT STUFF
			gameBox.removeAll();
			const inputEvents: KEventController[] = [];

			function dirToKeys(button: Button): Key[] {
				if (button == "left") return ["left", "a"];
				else if (button == "down") return ["down", "s"];
				else if (button == "up") return ["up", "w"];
				else if (button == "right") return ["right", "d"];
				else if (button == "action") return ["space"];
			}

			const gameAPI: MinigameAPI = {
				onButtonPress: (btn, action) => {
					const func = () => wareCtx.inputEnabled ? action() : false;
					const ev = gameBox.onKeyPress(dirToKeys(btn), func);
					inputEvents.push(ev);
					return ev;
				},
				onButtonRelease: (btn, action) => {
					const func = () => wareCtx.inputEnabled ? action() : false;
					const ev = gameBox.onKeyRelease(dirToKeys(btn), func);
					inputEvents.push(ev);
					return ev;
				},
				onButtonDown: (btn, action) => {
					const func = () => wareCtx.inputEnabled ? action() : false;
					const ev = gameBox.onKeyDown(dirToKeys(btn), func);
					inputEvents.push(ev);
					return ev;
				},
				onClickPress: (action) => {
					const func = () => wareCtx.inputEnabled ? action() : false;
					const ev = gameBox.onMousePress("left", func);
					inputEvents.push(ev);
					return ev;
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
				hideCursor() {
					cursor.hidden = true;
				},
				finish: () => {
					minigameScene.clearEvents();
					wareCtx.nextGame();
					inputEvents.forEach((ev) => ev.cancel());
				},
				difficulty: wareCtx.difficulty,
				lives: wareCtx.lives,
				speed: wareCtx.speed,
			};

			wareCtx.time = g.duration / wareCtx.speed;
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
			wareCtx.gamesPlayed++;
			if (wareCtx.gamesPlayed < 10) wareCtx.difficulty = 1;
			else if (wareCtx.gamesPlayed >= 10) wareCtx.difficulty = 2;
			else if (wareCtx.gamesPlayed >= 20) wareCtx.difficulty = 3;

			function prep() {
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
					k.wait(0.15 / wareCtx.speed, () => {
						prompt.fadeOut(0.15 / wareCtx.speed).onEnd(() => prompt.destroy());
					});
					wareCtx.inputEnabled = true;
					wareCtx.gameRunning = true;
				});

				cursor.hidden = !nextGame.usesMouse;
			}

			if (wonLastGame != null) {
				let transition: ReturnType<typeof prepTransition> = null;
				if (wonLastGame) transition = winTransition(k, wareCtx);
				else transition = loseTransition(k, wareCtx);
				wonLastGame = null;

				transition.onEnd(() => {
					if (!wonLastGame && wareCtx.lives == 0) {
						k.go("gameover");
						return;
					}

					const timeToSpeedUP = FORCE_SPEED_ON_GAME || wareCtx.gamesPlayed % 5 == 0;
					if (timeToSpeedUP) {
						wareCtx.timesSpeed++;
						speedupTransition(k, wareCtx).onEnd(() => {
							k.tween(k.getCamPos(), k.center(), 0.5 / wareCtx.speed, (p) => k.setCamPos(p), k.easings.easeOutQuint);
							prep();
						});
						wareCtx.speedUp();
					}
					else prep();
				});
			}
			else prep();
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
		game.rgb = game.rgb ?? [0, 0, 0];
		game.usesMouse = game.usesMouse ?? false;

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

		const bgColor = k.rgb(wareCtx.curGame().rgb[0], wareCtx.curGame().rgb[1], wareCtx.curGame().rgb[2]);
		k.drawRect({
			width: k.width(),
			height: k.height(),
			color: bgColor,
		});
	});

	return wareCtx;
}
