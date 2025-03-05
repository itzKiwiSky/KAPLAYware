import { Asset, AudioPlay, AudioPlayOpt, Color, GameObj, KAPLAYCtx, KAPLAYOpt, KEventController, Key, SpriteCompOpt, SpriteData, Vec2 } from "kaplay";
import k from "./engine";
import { addBomb, addPrompt } from "./objects";
import { overload2 } from "./overload";
import cursor from "./plugins/cursor";
import { loseTransition, prepTransition, speedupTransition, winTransition } from "./transitions";
import { Button, KaplayWareCtx, KAPLAYwareOpts, LoadCtx, Minigame, MinigameAPI, MinigameCtx } from "./types";
import { coolPrompt, getGameID } from "./utils";

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
	"onClick",
	"loop",
	"wait",
	"tween",
	"addLevel",
	// colors
	"BLACK",
	"RED",
	"GREEN",
	"BLUE",
	"YELLOW",
	"WHITE",
	"setGravity",
	"shake",
	"drag",
	"isMouseMoved",
] as const;

const DEFAULT_DURATION = 4;

export default function kaplayware(games: Minigame[] = [], opts: KAPLAYwareOpts = {}): KaplayWareCtx {
	let wonLastGame: boolean = null;
	let minigameHistory: string[] = []; // this is so you can't get X minigame, Y minigame, then X minigame again

	// debug variables
	let skipMinigame = false;
	let forceSpeed = false;
	let restartMinigame = false;
	let overrideDifficulty = null as 1 | 2 | 3;

	/** Game object that runs everything in the gamescene */
	const GameScene = k.add([]);

	/** The container for minigames, if you want to pause the minigame you should pause this */
	const gameBox = GameScene.add([k.fixed(), k.pos()]);

	GameScene.onUpdate(() => {
		gameBox.paused = !wareCtx.gameRunning;
		cursor.canPoint = wareCtx.gameRunning;

		if (opts.debug) {
			if (k.isKeyPressed("q")) {
				restartMinigame = true;
				if (k.isKeyDown("shift")) {
					skipMinigame = true;
					k.debug.log("SKIPPED: " + getGameID(wareCtx.curGame()));
				}
				else k.debug.log("RESTARTED: " + getGameID(wareCtx.curGame()));
			}

			if (k.isKeyDown("shift") && k.isKeyPressed("w")) {
				restartMinigame = true;
				forceSpeed = true;
				k.debug.log("RESTARTED + SPEED UP: " + getGameID(wareCtx.curGame()));
			}

			if (k.isKeyPressed("1")) {
				overrideDifficulty = 1;
				restartMinigame = true;
				k.debug.log("NEW DIFFICULTY: " + overrideDifficulty);
			}
			else if (k.isKeyPressed("2")) {
				overrideDifficulty = 2;
				restartMinigame = true;
				k.debug.log("NEW DIFFICULTY: " + overrideDifficulty);
			}
			else if (k.isKeyPressed("3")) {
				overrideDifficulty = 3;
				restartMinigame = true;
				k.debug.log("NEW DIFFICULTY: " + overrideDifficulty);
			}
		}
	});

	const wareCtx: KaplayWareCtx = {
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

		runGame(g) {
			// SETUP
			if (g.prompt.length > 12) throw new Error("Prompt cannot exceed 12 characters!");

			const onTimeoutEvent = new k.KEvent();
			const timerEvents: KEventController[] = [];
			const inputEvents: KEventController[] = [];
			const queuedSounds: AudioPlay[] = [];
			const audioPlays: AudioPlay[] = [];

			let bomb: ReturnType<typeof addBomb> = null;
			let addedBomb = false;
			let clockRunning = true;
			let canPlaySounds = false;

			const gameCtx = {};
			for (const api of gameAPIs) {
				gameCtx[api] = k[api];

				if (api == "make") {
					gameCtx[api] = (...args: any) => {
						return k.make(...args);
					};
				}
				else if (api == "sprite") {
					gameCtx[api] = (spr: string | SpriteData | Asset<SpriteData>, opts?: SpriteCompOpt) => {
						const hasAt = (t: any) => typeof t == "string" && t.startsWith("@");
						const getSpriteThing = (t: any) => hasAt(t) ? t : `${getGameID(g)}-${t}`;
						const spriteComp = k.sprite(getSpriteThing(spr), opts);

						return {
							...spriteComp,
							set sprite(val: string) {
								spriteComp.sprite = getSpriteThing(val);
							},

							get sprite() {
								if (spriteComp.sprite.startsWith(getGameID(g))) return spriteComp.sprite.replace(`${getGameID(g)}-`, "");
								else return spriteComp.sprite;
							},
						};
					};
				}
				else if (api == "onClick") {
					gameCtx[api] = overload2((action: () => void) => {
						const func = () => wareCtx.inputEnabled ? action() : false;
						const ev = k.onMousePress("left", func);
						inputEvents.push(ev);
					}, (tag: string, action: (a: GameObj) => void) => {
						const ev = k.onClick(tag, () => wareCtx.inputEnabled ? action : false);
						inputEvents.push(ev);
						return ev;
					});
				}
				else if (api == "area") {
					// override area onClick too!!
					gameCtx[api] = (...args: any[]) => {
						const areaComp = k.area(...args);
						return {
							...areaComp,
							onClick(action: () => void) {
								const ev = k.onMousePress("left", () => {
									if (wareCtx.inputEnabled && this.isHovering()) action();
								});
								inputEvents.push(ev);
								return ev;
							},
						};
					};
				}
				else if (api == "wait") {
					gameCtx[api] = (...args: any[]) => {
						const ev = k.wait(args[0], args[1]);
						timerEvents.push(ev);
						return ev;
					};
				}
				else if (api == "loop") {
					gameCtx[api] = (...args: any[]) => {
						const ev = k.loop(args[0], args[1]);
						timerEvents.push(ev);
						return ev;
					};
				}
				else if (api == "tween") {
					gameCtx[api] = (...args: any[]) => {
						// @ts-ignore
						const ev = k.tween(...args);
						timerEvents.push(ev);
						return ev;
					};
				}
				else if (api == "addLevel") {
					gameCtx[api] = (...args: any[]) => {
						// @ts-ignore
						const level = k.addLevel(...args);
						level.onUpdate(() => level.paused = !wareCtx.gameRunning);
						return level;
					};
				}
				else if (api == "play") {
					gameCtx[api] = (soundName: any, opts: AudioPlayOpt) => {
						const sound = k.play(soundName.startsWith("@") ? soundName : `${getGameID(g)}-${soundName}`, opts);

						const newSound = {
							...sound,
							set paused(param: boolean) {
								// this means that it was queued to play but the user paused it
								if (!canPlaySounds && queuedSounds.includes(sound) && param == true) {
									queuedSounds.splice(queuedSounds.indexOf(sound), 1);
									sound.paused = true;
								}

								// this means the user removed it from queue but wants to add it again probably
								if (!canPlaySounds && !queuedSounds.includes(sound) && param == false) {
									queuedSounds.push(sound);
									sound.paused = true;
								}

								if (canPlaySounds) sound.paused = param;
							},
							get paused() {
								return sound.paused;
							},
						};

						if (!canPlaySounds) {
							if (opts?.paused) return;
							queuedSounds.push(sound);
							sound.paused = true;
						}

						audioPlays.push(newSound);
						return newSound;
					};
				}
				else if (api == "burp") {
					gameCtx[api] = (opts: AudioPlayOpt) => {
						return gameCtx["play"]("@burp", opts);
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
				else if (button == "action") return ["space"];
			}

			const gameAPI: MinigameAPI = {
				onButtonPress: (btn, action) => {
					const func = () => wareCtx.inputEnabled ? action() : false;
					let ev: KEventController = null;
					if (btn == "click") ev = gameBox.onMousePress("left", func);
					else ev = gameBox.onKeyPress(dirToKeys(btn), func);
					inputEvents.push(ev);
					return ev;
				},
				isButtonPressed: (btn) => k.isKeyPressed(dirToKeys(btn)),
				onButtonRelease: (btn, action) => {
					const func = () => wareCtx.inputEnabled ? action() : false;
					let ev: KEventController = null;
					if (btn == "click") ev = gameBox.onMouseRelease("left", func);
					else ev = gameBox.onKeyRelease(dirToKeys(btn), func);
					inputEvents.push(ev);
					return ev;
				},
				isButtonReleased: (btn) => k.isKeyReleased(dirToKeys(btn)),
				onButtonDown: (btn, action) => {
					const func = () => wareCtx.inputEnabled ? action() : false;
					let ev: KEventController = null;
					if (btn == "click") ev = gameBox.onMouseDown("left", func);
					else ev = gameBox.onKeyDown(dirToKeys(btn), func);
					inputEvents.push(ev);
					return ev;
				},
				isButtonDown: (btn) => k.isKeyDown(dirToKeys(btn)),
				onMouseMove(action) {
					const ev = k.onMouseMove(action);
					inputEvents.push(ev);
					return ev;
				},
				onMouseRelease(action) {
					const ev = k.onMouseRelease(action);
					inputEvents.push(ev);
					return ev;
				},
				onTimeout: (action) => onTimeoutEvent.add(action),
				win() {
					wareCtx.score++;
					clockRunning = false;
					wonLastGame = true;
					if (bomb) bomb.turnOff();
				},
				lose() {
					wareCtx.lives--;
					clockRunning = false;
					wonLastGame = false;
				},
				finish() {
					// TODO: Make it so it throws an error if you've finished without winning/losing
					inputEvents.forEach((ev) => ev.cancel());
					timerEvents.forEach((ev) => ev.cancel());
					audioPlays.forEach((sound) => sound.stop());
					GAMEBOXUPDATE.cancel();
					wareCtx.nextGame();
					canPlaySounds = false;

					if (bomb) bomb.destroy();
				},
				cursor: {
					set color(param: Color) {
						cursor.color = param;
					},
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

			const GAMEBOXUPDATE = k.onUpdate(() => {
				timerEvents.forEach((ev) => ev.paused = !wareCtx.gameRunning);
				inputEvents.forEach((ev) => ev.paused = !wareCtx.gameRunning);

				if (restartMinigame) {
					gameAPI.win();
					gameAPI.finish();
				}

				if (!wareCtx.gameRunning) return;
				if (clockRunning) {
					if (!canPlaySounds) {
						canPlaySounds = true;
						queuedSounds.forEach((sound) => sound.paused = false);
					}

					wareCtx.time -= k.dt();
					if (wareCtx.time <= 0 && clockRunning) {
						clockRunning = false;
						onTimeoutEvent.trigger();
						wareCtx.inputEnabled = false;
					}

					if (wareCtx.time <= g.duration / 2 && !addedBomb) {
						addedBomb = true;
						bomb = addBomb(k, wareCtx);
					}
				}
			});

			return minigameScene;
		},
		curGame() {
			return games[wareCtx.gameIdx];
		},
		nextGame() {
			wareCtx.gamesPlayed++;
			if (wareCtx.gamesPlayed < 10) wareCtx.difficulty = 1;
			else if (wareCtx.gamesPlayed >= 10 && wareCtx.gamesPlayed < 20) wareCtx.difficulty = 2;
			else if (wareCtx.gamesPlayed >= 20) wareCtx.difficulty = 3;
			wareCtx.gameRunning = false;

			if (overrideDifficulty) wareCtx.difficulty = overrideDifficulty;

			function prep() {
				if (opts.onlyMouse) games = games.filter((game) => game.mouse);

				const availableGames = games.filter((game) => {
					if (restartMinigame && !skipMinigame) return game == wareCtx.curGame();
					else if (games.length == 1) return game;
					else {
						return game != wareCtx.curGame();
						// const previousMinigame = getByID(minigameHistory[wareCtx.gamesPlayed - 1]);
						// if (previousMinigame) return game != wareCtx.curGame() && game != previousMinigame;
						// else return game != wareCtx.curGame();
					}
				});

				const nextGame = k.choose(availableGames);
				wareCtx.gameIdx = games.indexOf(nextGame);
				wareCtx.runGame(nextGame);
				minigameHistory[wareCtx.gamesPlayed - 1] = getGameID(nextGame);
				restartMinigame = false;
				skipMinigame = false;

				if (nextGame.mouse) cursor.visible = true;
				else cursor.visible = false;

				let prompt: ReturnType<typeof addPrompt> = null;

				const prepTrans = prepTransition(k, wareCtx);
				prepTrans.onHalf(() => {
					prompt = addPrompt(k, coolPrompt(nextGame.prompt));

					if (nextGame.mouse && nextGame.mouse.hidden) cursor.visible = false;
					else if (nextGame.mouse && !nextGame.mouse.hidden) cursor.visible = true;
				});

				prepTrans.onEnd(() => {
					k.wait(0.15 / wareCtx.speed, () => {
						prompt.fadeOut(0.15 / wareCtx.speed).onEnd(() => prompt.destroy());
					});
					wareCtx.inputEnabled = true;
					wareCtx.gameRunning = true;
				});
			}

			if (wonLastGame != null) {
				let transition: ReturnType<typeof prepTransition> = null;
				if (wonLastGame) transition = winTransition(k, wareCtx);
				else transition = loseTransition(k, wareCtx);
				wonLastGame = null;

				if (wareCtx.curGame().mouse) cursor.visible = true;

				transition.onEnd(() => {
					if (!wonLastGame && wareCtx.lives == 0) {
						k.go("gameover");
						return;
					}

					const timeToSpeedUP = forceSpeed || wareCtx.gamesPlayed % 5 == 0;
					if (timeToSpeedUP) {
						if (forceSpeed == true) forceSpeed = false;
						wareCtx.timesSpeed++;
						wareCtx.speedUp();
						speedupTransition(k, wareCtx).onEnd(() => {
							k.tween(k.getCamPos(), k.center(), 0.5 / wareCtx.speed, (p) => k.setCamPos(p), k.easings.easeOutQuint);
							prep();
						});
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

	k.watch(wareCtx, "score", "Score");
	k.watch(wareCtx, "lives", "Lives");
	k.watch(wareCtx, "gamesPlayed", "Games played");
	k.watch(wareCtx, "difficulty", "Difficulty");
	k.watch(wareCtx, "speed", "Speed");
	k.watch(wareCtx, "inputEnabled", "Input enabled");

	for (const game of games) {
		game.urlPrefix = game.urlPrefix ?? "";
		game.duration = game.duration ?? DEFAULT_DURATION;
		game.rgb = game.rgb ?? [0, 0, 0];
		if ("r" in game.rgb) game.rgb = [game.rgb.r, game.rgb.g, game.rgb.b];
	}

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
