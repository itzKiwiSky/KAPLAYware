import k from "../engine";
import { assets } from "@kaplayjs/crew";
import { Asset, AudioPlay, AudioPlayOpt, Color, DrawSpriteOpt, GameObj, KEventController, Key, SpriteCompOpt, SpriteData, TimerController, Uniform, Vec2 } from "kaplay";
import cursor from "../plugins/cursor";
import { coolPrompt, gameHidesMouse, gameUsesMouse, getGameID, getGameInput } from "./utils";
import { gameAPIs } from "./api";
import { createPausableCtx, PausableCtx, runTransition, TransitionState } from "./transitions";
import { InputButton, KAPLAYwareOpts, Minigame, MinigameAPI, MinigameCtx } from "./types";
import games from "./games";
import { WareBomb } from "../plugins/wareobjects";

type Friend = keyof typeof assets | `${keyof typeof assets}-o`;
type AtFriend = `@${Friend}`;
export type CustomSprite<T extends string> = T extends AtFriend | string & {} ? AtFriend | string & {} : string;

export function createWareApp() {
	return {
		/** Main object, if you want to pause every object, pause this */
		WareScene: k.add([k.area(), k.rect(0, 0)]),
		wareCtx: null as ReturnType<typeof kaplayware>,
		/** Wheter the current minigame should be running (will be false when the transition hasn't finished) */
		gameRunning: false,
		/** Wheter the user has paused */
		gamePaused: false,
		inputEnabled: false,
		drawEvents: [] as KEventController[],
		updateEvents: [] as KEventController[],
		inputEvents: [] as KEventController[],
		timerEvents: [] as TimerController[],
		sounds: [] as AudioPlay[],
		queuedSounds: [] as AudioPlay[],
		/** When the game is paused, all the sounds currently not paused will be sent here */
		pausedSounds: [] as AudioPlay[],
		canPlaySounds: false,
		onTimeOutEvents: new k.KEvent(),
		currentColor: k.rgb(),
		currentScene: null as GameObj,
		pausableCtx: null as PausableCtx,
		pausableTimers: [] as TimerController[],
		pausableSounds: [] as AudioPlay[],
		currentContext: null as MinigameCtx,
		// bomb
		timeRunning: false, // will turn true when transition is over (not same as gameRunning)
		currentBomb: null as WareBomb | null,
		conductor: k.conductor(140),
		minigameHistory: [] as string[],
		winState: undefined as boolean | undefined,
		addDrawEvent(ev: KEventController) {
			this.updateEvents.push(ev);
			return ev;
		},

		addUpdateEvent(ev: KEventController) {
			this.updateEvents.push(ev);
			return ev;
		},
		clearUpdateEvents() {
			for (let i = this.updateEvents.length - 1; i >= 0; i--) {
				this.updateEvents[i].cancel();
				this.updateEvents.pop();
			}
		},
		clearDrawEvents() {
			for (let i = this.drawEvents.length - 1; i >= 0; i--) {
				this.drawEvents[i].cancel();
				this.drawEvents.pop();
			}
		},
		addInput(ev: KEventController) {
			this.inputEvents.push(ev);
			return ev;
		},
		clearInput() {
			for (let i = this.inputEvents.length - 1; i >= 0; i--) {
				this.inputEvents[i].cancel();
				this.inputEvents.pop();
			}
		},
		addTimer(ev: TimerController) {
			this.timerEvents.push(ev);
			return ev;
		},
		clearTimers() {
			for (let i = this.timerEvents.length - 1; i >= 0; i--) {
				this.timerEvents[i].cancel();
				this.timerEvents.pop();
			}
		},
		addSound(sound: AudioPlay) {
			this.sounds.push(sound);
			return sound;
		},
		clearSounds() {
			for (let i = this.sounds.length - 1; i >= 0; i--) {
				this.sounds[i].stop();
				this.sounds.pop();
			}

			for (let i = this.queuedSounds.length - 1; i >= 0; i--) {
				this.queuedSounds[i].stop();
				this.queuedSounds.pop();
			}
		},
	};
}

export default function kaplayware(opts: KAPLAYwareOpts = {}) {
	const DEFAULT_DURATION = 4;
	const SPEED_LIMIT = 1.64;

	opts = opts ?? {};
	opts.games = opts.games ?? games;
	opts.debug = opts.debug ?? false;
	opts.inOrder = opts.inOrder ?? false;
	opts.onlyMouse = opts.onlyMouse ?? false;

	const wareApp = createWareApp();
	wareApp.pausableCtx = createPausableCtx(wareApp);

	// debug variables
	let skipMinigame = false;
	let forceSpeed = false;
	let restartMinigame = false;
	let overrideDifficulty = null as 1 | 2 | 3;

	const shakeCamera = wareApp.WareScene.add([k.pos(), k.rect(0, 0), k.area()]);
	const camera = shakeCamera.add([
		k.pos(k.center()),
		k.anchor("center"),
		k.scale(),
		k.rotate(),
		k.opacity(0),
		k.rect(0, 0),
		k.area(),
		{
			shake: 0,
		},
	]);

	camera.onUpdate(() => {
		camera.shake = k.lerp(camera.shake, 0, 5 * k.dt());
		let posShake = k.Vec2.fromAngle(k.rand(0, 360)).scale(camera.shake);
		shakeCamera.pos = k.vec2().add(posShake);
	});

	/** The container for minigames, if you want to pause the minigame you should pause this */
	const gameBox = camera.add(
		[k.pos(-k.width() / 2, -k.height() / 2), k.area(), k.rect(0, 0)],
	); // k.area() temporal fix due to v4000 weirdness

	function createGameContext(minigame: Minigame): MinigameCtx {
		const gameCtx = {};
		for (const api of gameAPIs) {
			gameCtx[api] = k[api];

			if (api == "add") {
				gameCtx[api] = (...args: any[]) => {
					return wareApp.currentScene.add(...args);
				};
			}
			else if (api == "onUpdate") {
				gameCtx[api] = (...args: any[]) => {
					return wareApp.addUpdateEvent(k.onUpdate(...args as unknown as [any]));
				};
			}
			else if (api == "onDraw") {
				gameCtx[api] = (...args: any[]) => {
					return wareApp.addDrawEvent(wareApp.currentScene.onDraw(...args as [any]));
				};
			}
			else if (api == "get") {
				gameCtx[api] = (...args: any[]) => {
					return wareApp.currentScene.get(...args as [any]);
				};
			}

			if (api == "onClick") {
				gameCtx[api] = (...args: any[]) => {
					// @ts-ignore
					return wareApp.addInput(k.onClick(...args));
				};
			}
			else if (api == "area") {
				// override area onClick too!!
				gameCtx[api] = (...args: any[]) => {
					const areaComp = k.area(...args);
					return {
						...areaComp,
						onClick(action: () => void) {
							const ev = k.onMousePress("left", () => this.isHovering() ? action() : false);
							wareApp.inputEvents.push(ev); // doesn't return because onClick returns void here
						},
					};
				};
			}
			else if (api == "wait") {
				gameCtx[api] = (...args: any[]) => {
					return wareApp.addTimer(k.wait(args[0], args[1]));
				};
			}
			else if (api == "loop") {
				gameCtx[api] = (...args: any[]) => {
					return wareApp.addTimer(k.loop(args[0], args[1]));
				};
			}
			else if (api == "tween") {
				gameCtx[api] = (...args: any[]) => {
					// @ts-ignore
					return wareApp.addTimer(k.tween(...args));
				};
			}
			else if (api == "addLevel") {
				gameCtx[api] = (...args: any[]) => {
					// @ts-ignore
					const level = k.addLevel(...args);
					level.parent = wareApp.currentScene;
					return level;
				};
			}
			else if (api == "play") {
				gameCtx[api] = (soundName: any, opts: AudioPlayOpt) => {
					// if sound name is string, check for @, else just send it
					const sound = k.play(typeof soundName == "string" ? (soundName.startsWith("@") ? soundName : `${getGameID(minigame)}-${soundName}`) : soundName, opts);

					const newSound = {
						...sound,
						set paused(param: boolean) {
							if (wareApp.canPlaySounds) {
								sound.paused = param;
								return;
							}

							// ALL OF THIS HAPPENS IF YOU CAN'T PLAY SOUNDS (queue stuff)
							sound.paused = true;

							// this means that it was queued to play but the user paused it
							if (wareApp.queuedSounds.includes(sound) && param == true) {
								wareApp.queuedSounds.splice(wareApp.queuedSounds.indexOf(sound), 1);
							}

							// this means the user removed it from queue but wants to add it again probably
							if (!wareApp.queuedSounds.includes(sound) && param == false) {
								wareApp.queuedSounds.push(sound);
							}
						},
						get paused() {
							return sound.paused;
						},
					};

					// if can't play sounds and the user intended to play it at start, pause it
					if (!wareApp.canPlaySounds) {
						if (!sound.paused) {
							wareApp.queuedSounds.push(sound);
							sound.paused = true;
						}
					}

					wareApp.addSound(newSound);
					return newSound;
				};
			}
			else if (api == "burp") {
				gameCtx[api] = (opts: AudioPlayOpt) => {
					return gameCtx["play"](k._k.audio.burpSnd, opts);
				};
			}
			else if (api == "drawSprite") {
				gameCtx[api] = (opts: DrawSpriteOpt) => {
					opts.sprite = `${getGameID(minigame)}-${opts.sprite}`;
					return k.drawSprite(opts);
				};
			}
			else if (api == "getSprite") {
				gameCtx[api] = (name: string) => {
					return k.getSprite(`${getGameID(minigame)}-${name}`);
				};
			}
			else if (api == "shader") {
				gameCtx[api] = (name: string, uniform: Uniform | (() => Uniform)) => {
					return k.shader(`${getGameID(minigame)}-${name}`, uniform);
				};
			}
			// TODO: Make fixed component work with the minigame camera api
			else if (api == "fixed") {
				gameCtx[api] = () => {
					let fixed = true;

					return {
						id: "fixed",
						set fixed(val: boolean) {
							fixed = val;
							if (fixed == true) this.parent = wareApp.WareScene;
							else this.parent = wareApp.currentScene;
						},
						get fixed() {
							return fixed;
						},
					};
				};
			}
		}

		function dirToKeys(button: InputButton): Key[] {
			if (button == "left") return ["left", "a"];
			else if (button == "down") return ["down", "s"];
			else if (button == "up") return ["up", "w"];
			else if (button == "right") return ["right", "d"];
			else if (button == "action") return ["space"];
		}

		const gameAPI: MinigameAPI = {
			getCamAngle: () => camera.angle,
			setCamAngle: (val: number) => camera.angle = val,
			getCamPos: () => camera.pos,
			setCamPos: (val: Vec2) => camera.pos = val,
			getCamScale: () => camera.scale,
			setCamScale: (val: Vec2) => camera.scale = val,
			shakeCam: (val: number = 12) => camera.shake += val,
			flashCam: (flashColor: Color = k.WHITE, timeOut: number = 1, opacity: number) => {
				const r = shakeCamera.add([
					k.pos(k.center()),
					k.rect(k.width() * 2, k.height() * 2),
					k.color(flashColor),
					k.anchor("center"),
					k.opacity(opacity),
					k.fixed(),
					k.z(999), // HACK: make sure is at front of everyone :skull: //
					"flash",
				]);
				const f = r.fadeOut(timeOut);
				f.onEnd(() => k.destroy(r));
				return f;
			},
			getRGB: () => wareApp.currentColor,
			setRGB: (val) => wareApp.currentColor = val,

			onInputButtonPress: (btn, action) => {
				let ev: KEventController = null;
				if (btn == "click") ev = gameBox.onMousePress("left", action);
				else ev = gameBox.onKeyPress(dirToKeys(btn), action);
				wareApp.addInput(ev);
				return ev;
			},
			onInputButtonDown: (btn, action) => {
				let ev: KEventController = null;
				if (btn == "click") ev = gameBox.onMouseDown("left", action);
				else ev = gameBox.onKeyDown(dirToKeys(btn), action);
				wareApp.addInput(ev);
				return ev;
			},
			onInputButtonRelease: (btn, action) => {
				let ev: KEventController = null;
				if (btn == "click") ev = gameBox.onMouseRelease("left", action);
				else ev = gameBox.onKeyRelease(dirToKeys(btn), action);
				wareApp.addInput(ev);
				return ev;
			},
			isInputButtonPressed: (btn) => {
				if (btn == "click") return k.isMousePressed("left");
				else return k.isKeyPressed(dirToKeys(btn));
			},
			isInputButtonDown: (btn) => {
				if (btn == "click") return k.isMouseDown("left");
				else return k.isKeyDown(dirToKeys(btn));
			},
			isInputButtonReleased: (btn) => {
				if (btn == "click") return k.isMouseReleased("left");
				else return k.isKeyDown(dirToKeys(btn));
			},
			onMouseMove(action) {
				const ev = k.onMouseMove(action);
				wareApp.inputEvents.push(ev);
				return ev;
			},
			onMouseRelease(action) {
				const ev = k.onMouseRelease(action);
				wareApp.inputEvents.push(ev);
				return ev;
			},
			onTimeout: (action) => wareApp.onTimeOutEvents.add(action),
			win() {
				wareCtx.score++;
				wareApp.timeRunning = false;
				wareApp.winState = true;
				wareApp.currentBomb?.turnOff();
			},
			lose() {
				wareCtx.lives--;
				wareApp.timeRunning = false;
				wareApp.winState = false;
			},
			finish() {
				if (wareApp.winState == undefined) {
					throw new Error("Finished minigame without setting the win condition!! Please call ctx.win() or ctx.lose() before calling ctx.finish()");
				}
				wareApp.clearSounds();
				wareApp.clearTimers();
				wareApp.clearInput();
				wareApp.clearUpdateEvents();
				wareApp.onTimeOutEvents.clear();
				wareApp.gameRunning = false;
				wareApp.canPlaySounds = false;
				wareApp.currentBomb?.destroy();
				gameBox.clearEvents(); // this clears the time running update, not the onUpdate events of the minigame
				// removes the scene
				k.wait(0.2 / wareCtx.speed, () => {
					wareApp.clearDrawEvents(); // clears them after you can't see them anymore
					wareApp.currentScene.destroy();
					// removes fixed objects too (they aren't attached to the gamebox)
					wareApp.WareScene.get("fixed").forEach((obj) => obj.destroy());
					// reset camera
					this.setCamPos(k.center());
					this.setCamAngle(0);
					this.setCamScale(k.vec2(1));
					camera.get("flash").forEach((f) => f.destroy());
					camera.shake = 0;
				});
				wareCtx.nextGame();
			},
			sprite: (spr: CustomSprite<string> | SpriteData | Asset<SpriteData>, opts?: SpriteCompOpt) => {
				const hasAt = (t: any) => typeof t == "string" && t.startsWith("@");
				const getSpriteThing = (t: any) => hasAt(t) ? t : `${getGameID(minigame)}-${t}`;
				const spriteComp = k.sprite(getSpriteThing(spr), opts);

				return {
					...spriteComp,
					set sprite(val: CustomSprite<string>) {
						spriteComp.sprite = getSpriteThing(val);
					},

					get sprite() {
						if (spriteComp.sprite.startsWith(getGameID(minigame))) return spriteComp.sprite.replace(`${getGameID(minigame)}-`, "");
						else return spriteComp.sprite;
					},
				};
			},
			winState: () => wareApp.winState,
			addConfetti(opts) {
				const confetti = k.addConfetti(opts);
				confetti.parent = gameBox;
				return confetti;
			},
			difficulty: wareCtx.difficulty,
			lives: wareCtx.lives,
			speed: wareCtx.speed,
			timeLeft: wareCtx.time,
		};

		return {
			...gameCtx,
			...gameAPI,
		} as unknown as MinigameCtx;
	}

	const wareCtx = {
		score: 1, // will transition from 0 to 1 on first prep
		lives: 4,
		difficulty: 1 as 1 | 2 | 3,
		speed: 1,
		time: 0,
		/** The amount of times the game has sped up */
		timesSpeed: 0,
		curGame: null as Minigame,
		set paused(val: boolean) {
			wareApp.gamePaused = val;
			if (val) {
				wareApp.sounds.forEach((sound) => {
					if (!sound.paused) wareApp.pausedSounds.push(sound);
				});
			}
			else {
				wareApp.pausedSounds.forEach((sound, index) => {
					wareApp.pausedSounds.splice(index, 1);
					sound.paused = false;
				});
			}
		},

		get paused() {
			return wareApp.gamePaused;
		},

		speedUp() {
			this.speed += this.speed * 0.07;
			this.speed = k.clamp(this.speed, 0, SPEED_LIMIT);
		},

		/** 1. Clears every previous object
		 * 2. Adds the minigame scene, and the new game objects
		 * 3. Starts counting the time
		 *
		 * Also manages the bomb and the unpausing the queued sounds,
		 */
		runGame(minigame: Minigame) {
			// OBJECT STUFF
			gameBox.removeAll();

			wareApp.currentContext = createGameContext(minigame) as MinigameCtx;
			const gDuration = typeof minigame.duration == "number" ? minigame.duration : minigame.duration(wareApp.currentContext);
			const durationEnabled = gDuration != undefined;
			wareCtx.time = durationEnabled ? (gDuration / wareCtx.speed) : 1;
			wareApp.currentContext.timeLeft = wareCtx.time;
			wareApp.currentColor = typeof minigame.rgb == "function" ? minigame.rgb(wareApp.currentContext) : "r" in minigame.rgb ? minigame.rgb : k.Color.fromArray(minigame.rgb);
			wareApp.currentScene?.destroy();
			wareApp.currentScene = gameBox.add([k.rect(0, 0), k.area()]);
			wareApp.gameRunning = false; // will be set to true onTransitionEnd (in nextGame())
			wareApp.timeRunning = false;
			wareApp.canPlaySounds = false;
			wareApp.currentBomb?.destroy();
			wareApp.currentBomb = null;
			wareCtx.curGame = minigame;
			minigame.start(wareApp.currentContext);

			gameBox.onUpdate(() => {
				if (!wareApp.gameRunning) return;

				if (!wareApp.canPlaySounds) {
					wareApp.canPlaySounds = true;
					wareApp.queuedSounds.forEach((sound) => sound.paused = false);
				}

				if (!wareApp.timeRunning) return;
				if (!durationEnabled) return;

				if (wareCtx.time > 0) wareCtx.time -= k.dt();
				wareCtx.time = k.clamp(wareCtx.time, 0, 20);
				wareApp.currentContext.timeLeft = wareCtx.time;
				if (wareCtx.time <= 0 && wareApp.timeRunning) {
					wareApp.timeRunning = false;
					wareApp.onTimeOutEvents.trigger();
				}

				/** When there's 4 beats left */
				if (wareCtx.time <= wareApp.conductor.beatInterval * 4 && !wareApp.currentBomb) {
					wareApp.currentBomb = k.addBomb(wareApp);
					wareApp.currentBomb.bomb.parent = gameBox;
					wareApp.currentBomb.lit(wareApp.conductor.bpm);
				}
			});

			wareApp.onTimeOutEvents.add(() => {
				wareApp.inputEnabled = false;
			});
		},
		/**
		 * 1. Manages the difficulty change and the speed up change
		 * 2. Gets an available minigame based on the input
		 * 3. Runs `runGame()`
		 *
		 * MOST IMPORTANTLY!! Manages the transitions and the prompt (and input prompt) adding
		 */
		nextGame() {
			if (wareCtx.score < 10) wareCtx.difficulty = 1;
			else if (wareCtx.score >= 10 && wareCtx.score < 20) wareCtx.difficulty = 2;
			else if (wareCtx.score >= 20) wareCtx.difficulty = 3;
			wareApp.gameRunning = false;

			if (overrideDifficulty) wareCtx.difficulty = overrideDifficulty;
			if (opts.onlyMouse) opts.games = opts.games.filter((game) => getGameInput(game) == "mouse");

			const shouldSpeedUp = () => {
				return (forceSpeed || wareCtx.score % 5 == 0) && wareCtx.speed <= SPEED_LIMIT;
			};

			const copyOfWinState = wareApp.winState; // when isGameOver() is called winState will be undefined because it was resetted, when the order of this is reversed, it will be fixed
			const isGameOver = () => copyOfWinState == false && wareCtx.lives == 0;

			const availableGames = opts.games.filter((game) => {
				if (wareApp.minigameHistory.length == 0 || opts.games.length == 1) return true;
				else if (restartMinigame && !skipMinigame) return game == wareCtx.curGame;
				else {
					const previousPreviousID = wareApp.minigameHistory[wareCtx.score - 3];
					const previousPreviousGame = opts.games.find((game) => getGameID(game) == previousPreviousID);
					if (previousPreviousGame) return game != wareCtx.curGame && game != previousPreviousGame;
					else return game != wareCtx.curGame;
				}
			});

			const choosenGame = opts.inOrder ? availableGames[wareCtx.score % availableGames.length] : k.choose(availableGames);

			let transitionStates: TransitionState[] = ["prep"];
			if (wareApp.winState != undefined) transitionStates.splice(0, 0, wareApp.winState == true ? "win" : "lose");
			if (shouldSpeedUp()) transitionStates.splice(1, 0, "speed");
			if (isGameOver()) transitionStates = ["lose"];

			wareApp.minigameHistory[wareCtx.score - 1] = getGameID(choosenGame);
			wareApp.winState = undefined;
			restartMinigame = false;
			skipMinigame = false;

			cursor.visible = !gameHidesMouse(choosenGame);

			// ### transition coolness ##
			// sends prep, if shouldSpeedUp is false and winState is undefinied, then it will only run prep
			const transition = runTransition(wareApp, transitionStates);
			let inputPrompt: ReturnType<typeof k.addInputPrompt> = null;
			let prompt: ReturnType<typeof k.addPrompt> = null;

			transition.onInputPromptTime(() => {
				inputPrompt = k.addInputPrompt(getGameInput(choosenGame));
				inputPrompt.parent = wareApp.WareScene;
				wareApp.pausableCtx.tween(k.vec2(0), k.vec2(1), 0.15 / wareCtx.speed, (p) => inputPrompt.scale = p, k.easings.easeOutElastic);
			});

			transition.onPromptTime(() => {
				wareApp.pausableCtx.tween(inputPrompt.scale, k.vec2(0), 0.15 / wareCtx.speed, (p) => inputPrompt.scale = p, k.easings.easeOutQuint).onEnd(() =>
					inputPrompt.destroy()
				);
				if (typeof choosenGame.prompt == "string") prompt = k.addPrompt(coolPrompt(choosenGame.prompt));
				else {
					prompt = k.addPrompt("");
					choosenGame.prompt(wareApp.currentContext, prompt);
				}
				prompt.parent = wareApp.WareScene;

				wareApp.pausableCtx.wait(0.15 / wareCtx.speed, () => {
					cursor.visible = gameHidesMouse(choosenGame);
					prompt.fadeOut(0.15 / wareCtx.speed).onEnd(() => prompt.destroy());
				});
			});

			transition.onStateStart((state) => {
				if (state == "prep") {
					wareCtx.runGame(choosenGame);
				}
				else if (state == "speed") {
					if (forceSpeed == true) forceSpeed = false;
					wareCtx.timesSpeed++;
					wareCtx.speedUp();
				}
			});

			transition.onStateEnd((state) => {
				if (state == "lose") {
					if (!isGameOver()) return;
					wareApp.pausableCtx.play("@gameOverJingle").onEnd(() => {
						k.go("gameover", wareCtx.score);
					});
					k.addPrompt("GAME OVER");
				}
			});

			transition.onTransitionEnd(() => {
				if (!isGameOver()) transition.destroy(); // don't remove it on game over, serves as background
				wareApp.gameRunning = true;
				wareApp.timeRunning = true;
				wareApp.inputEnabled = true;
			});
		},
	};

	wareApp.wareCtx = wareCtx;

	k.watch(wareCtx, "time", "Time left", (t) => t.toFixed(2));
	k.watch(wareCtx, "score", "Score");
	k.watch(wareCtx, "lives", "Lives");
	k.watch(wareCtx, "difficulty", "Difficulty");
	k.watch(wareCtx, "speed", "Speed");
	k.watch(wareApp, "inputEnabled", "Input enabled");

	for (const game of opts.games) {
		game.urlPrefix = game.urlPrefix ?? "";
		game.duration = game.duration ?? DEFAULT_DURATION;
		game.rgb = game.rgb ?? [255, 255, 255];
		game.input = game.input ?? "keys";
		if ("r" in game.rgb) game.rgb = [game.rgb.r, game.rgb.g, game.rgb.b];
	}

	k.onUpdate(() => {
		wareApp.WareScene.paused = wareApp.gamePaused;
		cursor.canPoint = wareApp.gameRunning;
		wareApp.conductor.bpm = 140 * wareCtx.speed;
		wareApp.conductor.paused = wareApp.gamePaused;
		if (wareApp.currentScene) wareApp.currentScene.paused = !wareApp.gameRunning;

		wareApp.inputEvents.forEach((ev) => ev.paused = !wareApp.inputEnabled || !wareApp.gameRunning);
		wareApp.timerEvents.forEach((ev) => ev.paused = !wareApp.gameRunning || wareApp.gamePaused);
		wareApp.updateEvents.forEach((ev) => ev.paused = !wareApp.gameRunning || wareApp.gamePaused);
		wareApp.pausedSounds.forEach((sound) => sound.paused = true);
		wareApp.pausableSounds.forEach((sound) => sound.paused = wareApp.gamePaused);
		wareApp.pausableTimers.forEach((timer) => timer.paused = wareApp.gamePaused);

		if (opts.debug) {
			if (k.isKeyPressed("q")) {
				restartMinigame = true;
				if (k.isKeyDown("shift")) {
					skipMinigame = true;
					k.debug.log("SKIPPED: " + getGameID(wareCtx.curGame));
				}
				else k.debug.log("RESTARTED: " + getGameID(wareCtx.curGame));
			}

			if (k.isKeyDown("shift") && k.isKeyPressed("w")) {
				restartMinigame = true;
				forceSpeed = true;
				k.debug.log("RESTARTED + SPEED UP: " + getGameID(wareCtx.curGame));
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

	camera.onDraw(() => {
		// draws the background
		k.drawRect({
			width: k.width() * 2,
			height: k.height() * 2,
			anchor: "center",
			pos: k.center().add(shakeCamera.pos),
			color: wareApp.currentColor,
		});
	});

	return wareCtx;
}
