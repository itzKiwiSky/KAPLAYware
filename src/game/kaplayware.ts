import { KEvent, KEventController } from "kaplay";
import k from "../engine";
import { createWareApp } from "./app";
import { Minigame } from "./types";
import { createGameCtx } from "./context/game";
import games from "./games";
import { createDumbEventThing, getGameColor } from "./utils";
import cursor from "../plugins/cursor";

/** Certain options to instantiate kaplayware (ware-engine) */
export type KAPLAYwareOpts = {
	games?: Minigame[];
	inOrder?: boolean;
	// mods here
};

export type Kaplayware = {
	lives: number;
	score: number;
	timeLeft: number;
	speed: number;
	difficulty: 1 | 2 | 3;
	curGame: Minigame;
	timeRunning: boolean;
	gameRunning: boolean;
	minigameHistory: string[];
	queuedSounds: KEventController[];
	onTimeOutEvents: KEvent;
	events: ReturnType<typeof createDumbEventThing<"win" | "lose" | "finish">>;
	winState: boolean | undefined;
	nextGame(): void;
};

// TODO: add conductor here? would that be fine?
// Should just add it here and create an event that pauses it on everythingPaused
// remember that big on update event that paused everything on everythingPaused? create it here too, makes the most sense
// Add it here and not on wareApp, because wareApp doesn't require a BPM or anything, that's exclusive of transitions and bomb timing

/** Instantiates and runs KAPLAYWARE (aka ware-engine), to start it, run nextGame() */
export function kaplayware(opt: KAPLAYwareOpts): Kaplayware {
	opt = opt ?? {};
	opt.games = opt.games ?? games;
	opt.inOrder = opt.inOrder ?? false;

	const wareApp = createWareApp();
	const wareEngine = {} as unknown as Kaplayware;
	wareEngine.lives = 4;
	wareEngine.score = 0;
	wareEngine.speed = 1;
	wareEngine.difficulty = 1;
	wareEngine.timeRunning = false;
	wareEngine.gameRunning = false;
	wareEngine.minigameHistory = [];
	wareEngine.queuedSounds = [];
	wareEngine.winState = undefined;
	wareEngine.curGame = undefined;
	wareEngine.events = createDumbEventThing(["win", "lose", "finish"]);
	wareEngine.onTimeOutEvents = new k.KEvent();

	const getElectibleGame = () => {
		return k.choose(opt.games);
	};

	const calculateDifficulty = () => {
	};

	wareEngine.nextGame = () => {
		wareEngine.score++;
		wareEngine.curGame = getElectibleGame();
		const ctx = createGameCtx(wareEngine.curGame, wareApp, wareEngine);
		ctx.setRGB(getGameColor(wareEngine.curGame, ctx));
		cursor.fadeAway = false;
		wareEngine.curGame.start(ctx);
	};

	wareEngine.events.on("win", () => {
		k.debug.log("ran win");
		wareEngine.timeRunning = false;
		wareEngine.winState = true;
		// TODO: Turn off bomb here
	});

	wareEngine.events.on("lose", () => {
		k.debug.log("ran lose");
		wareEngine.lives--;
		wareEngine.timeRunning = false;
		wareEngine.winState = false;
	});

	wareEngine.events.on("finish", () => {
		k.debug.log("ran finish");
		if (wareEngine.winState == undefined) {
			throw new Error("Finished minigame without setting the win condition!! Please call ctx.win() or ctx.lose() before calling ctx.finish()");
		}
		// TODO: Do a function that clears everything

		wareApp.clearAll();
		wareApp.canPlaySounds = false;
		wareEngine.onTimeOutEvents.clear();
		wareEngine.gameRunning = false;
		// TODO: bomb should be destroyed here
		wareApp.sceneObj.clearEvents(); // what is the purpose of this
		wareApp.sceneObj.removeAll(); // removes all objs

		// wareApp.onTimeOutEvents.clear();
		// wareApp.gameRunning = false;
		// wareApp.canPlaySounds = false;
		// wareApp.currentBomb?.destroy();
		// wareApp.sceneObj.clearEvents(); // this clears the time running update, not the onUpdate events of the minigame
		// // removes the scene
		// TODO: why are objects cleared just here? make it according to transition, so when state.win() ends, they're destroyed
		// k.wait(0.2 / wareApp.wareCtx.speed, () => {
		// 	wareApp.clearDrawEvents(); // clears them after you can't see them anymore
		// 	wareApp.sceneObj.removeAll();
		// 	// removes fixed objects too (they aren't attached to the gamebox)
		// 	wareApp.rootObj.get("fixed").forEach((obj) => obj.destroy());
		// 	// reset camera
		// 	this.setCamPos(k.center());
		// 	this.setCamAngle(0);
		// 	this.setCamScale(k.vec2(1));
		// TODO: would say just remove children but you can't! because scene is children of camera afaik3
		// 	wareApp.cameraObj.get("flash").forEach((f) => f.destroy());
		// 	wareApp.cameraObj.shake = 0;
		// });
		// wareApp.wareCtx.nextGame();
	});

	return wareEngine;
}

// 	wareApp.pausableCtx = createPauseCtx();

// 	return wareApp;
// }

// /** Object that holds some a lot of managers for the KAPLAYware engine */
// export type WareApp = ReturnType<typeof createWareApp>;

// export default function kaplayware(opts: KAPLAYwareOpts = {}) {
// 	const MAX_SPEED = 1.64;

// 	opts = opts ?? {};
// 	opts.games = opts.games ?? games;
// 	opts.inOrder = opts.inOrder ?? false;

// 	const getRandomGame = () => {
// 		return k.choose(opts.games);
// 	};

// 	const wareCtx = {
// 		nextGame() {
// 			const runningGame = getRandomGame();
// 			const ctx = createGameCtx();
// 		},
// 	};

// const wareApp = createWareApp();

// const gameBox = wareApp.sceneObj;

// const wareCtx = {
// 	score: 1, // will transition from 0 to 1 on first prep
// 	lives: 4,
// 	difficulty: 1 as 1 | 2 | 3,
// 	speed: 1,
// 	time: 0,
// 	/** The amount of times the game has sped up */
// 	timesSpeed: 0,
// 	curGame: null as Minigame,
// 	set paused(val: boolean) {
// 		wareApp.gamePaused = val;
// 		if (val) {
// 			wareApp.sounds.forEach((sound) => {
// 				if (!sound.paused) wareApp.pausedSounds.push(sound);
// 			});
// 		}
// 		else {
// 			wareApp.pausedSounds.forEach((sound, index) => {
// 				wareApp.pausedSounds.splice(index, 1);
// 				sound.paused = false;
// 			});
// 		}
// 	},

// 	get paused() {
// 		return wareApp.gamePaused;
// 	},

// 	speedUp() {
// 		const increment = k.choose([0.06, 0.07, 0.08]);
// 		this.speed = k.clamp(this.speed + this.speed * increment, 0, MAX_SPEED);
// 	},

// 	/** 1. Clears every previous object
// 	 * 2. Adds the minigame scene, and the new game objects
// 	 * 3. Starts counting the time
// 	 *
// 	 * Also manages the bomb and the unpausing the queued sounds,
// 	 */
// 	runGame(minigame: Minigame) {
// 		// OBJECT STUFF
// 		gameBox.removeAll();

// 		wareApp.currentContext = createGameCtx(wareApp, minigame);

// 		const gameDuration = getGameDuration(minigame, wareApp.currentContext);
// 		wareCtx.time = gameDuration;
// 		wareApp.currentContext.timeLeft = wareCtx.time;
// 		wareApp.currentColor = typeof minigame.rgb == "function" ? minigame.rgb(wareApp.currentContext) : "r" in minigame.rgb ? minigame.rgb : k.Color.fromArray(minigame.rgb);
// 		wareApp.sceneObj.removeAll();
// 		wareApp.gameRunning = false; // will be set to true onTransitionEnd (in nextGame())
// 		wareApp.timeRunning = false;
// 		wareApp.canPlaySounds = false;
// 		wareApp.currentBomb?.destroy();
// 		wareApp.currentBomb = null;
// 		wareCtx.curGame = minigame;
// 		k.setGravity(0);
// 		minigame.start(wareApp.currentContext);

// 		gameBox.onUpdate(() => {
// 			if (!wareApp.gameRunning) return;

// 			if (!wareApp.canPlaySounds) {
// 				wareApp.canPlaySounds = true;
// 				wareApp.queuedSounds.forEach((sound) => sound.paused = false);
// 			}

// 			if (!wareApp.timeRunning) return;
// 			if (!gameDuration) return;

// 			if (wareCtx.time > 0) wareCtx.time -= k.dt();
// 			wareCtx.time = k.clamp(wareCtx.time, 0, 20);
// 			wareApp.currentContext.timeLeft = wareCtx.time;
// 			if (wareCtx.time <= 0 && wareApp.timeRunning) {
// 				wareApp.timeRunning = false;
// 				wareApp.onTimeOutEvents.trigger();
// 				if (!wareApp.currentBomb.hasExploded) wareApp.currentBomb.explode();
// 			}

// 			/** When there's 4 beats left */
// 			if (wareCtx.time <= wareApp.conductor.beatInterval * 4 && !wareApp.currentBomb) {
// 				wareApp.currentBomb = k.addBomb(wareApp);
// 				wareApp.currentBomb.parent = gameBox;
// 				wareApp.currentBomb.lit(wareApp.conductor.bpm);
// 			}
// 		});

// 		wareApp.onTimeOutEvents.add(() => {
// 			wareApp.inputEnabled = false;
// 		});
// 	},
// 	/**
// 	 * 1. Manages the difficulty change and the speed up change
// 	 * 2. Gets an available minigame based on the input
// 	 * 3. Runs `runGame()`
// 	 *
// 	 * MOST IMPORTANTLY!! Manages the transitions and the prompt (and input prompt) adding
// 	 */
// 	nextGame() {
// 		const previousGame = wareCtx.curGame;
// 		const howFrequentBoss = 10;
// 		let games = [...opts.games];
// 		wareApp.gameRunning = false;

// 		// decide new difficulty
// 		if (previousGame?.isBoss || games.filter((g) => g.isBoss).length == 0 && wareCtx.score % howFrequentBoss == 0) {
// 			wareCtx.difficulty = 1 + wareCtx.difficulty % 3 as 1 | 2 | 3;
// 		}

// 		const shouldBoss = () => {
// 			if (wareCtx.score % howFrequentBoss == 0 && games.some((g) => g.isBoss) || (games.length == 1 && games[0].isBoss)) return true;
// 		};

// 		const shouldSpeed = () => {
// 			const realScore = wareCtx.score + 1;
// 			const number = k.randi(4, 6);
// 			const division = () => {
// 				if (realScore % number == 0) return true;
// 				else if (k.chance(0.1) && realScore % 5 == 0) return true;
// 				else return false;
// 			};
// 			const condition = () => wareCtx.speed <= MAX_SPEED && !shouldBoss();
// 			return division() && condition();
// 		};

// 		const copyOfWinState = wareApp.winState; // when isGameOver() is called winState will be undefined because it was resetted, when the order of this is reversed, it will be fixed
// 		const isGameOver = () => copyOfWinState == false && wareCtx.lives == 0;

// 		if (!shouldBoss()) {
// 			games = games.filter((game) => {
// 				return game.isBoss == false;
// 			});
// 		}

// 		// remove the ones that don't match the input
// 		games = games.filter((game) => {
// 			if (!opts.input) return true;
// 			else return getGameInput(game) == opts.input;
// 		});

// 		// now remove the previous one so we can get a new one
// 		games = games.filter((game) => {
// 			if (wareApp.minigameHistory.length == 0 || games.length == 1) return true;
// 			else {
// 				const previousPreviousID = wareApp.minigameHistory[wareCtx.score - 3];
// 				const previousPreviousGame = games.find((game) => getGameID(game) == previousPreviousID);
// 				if (previousPreviousGame) return game != wareCtx.curGame && game != previousPreviousGame;
// 				else return game != wareCtx.curGame;
// 			}
// 		});

// 		if (shouldBoss()) {
// 			games = games.filter((game) => {
// 				return game.isBoss == true;
// 			});
// 		}

// 		const choosenGame = opts.inOrder ? games[wareCtx.score % games.length] : k.choose(games);

// 		let transitionStates: TransitionState[] = ["prep"];
// 		if (wareApp.winState != undefined) transitionStates.splice(0, 0, wareApp.winState == true ? previousGame.isBoss ? "bossWin" : "win" : "lose");
// 		if (shouldSpeed()) transitionStates.splice(1, 0, "speed");
// 		if (isGameOver()) transitionStates = ["lose"];
// 		if (shouldBoss()) transitionStates.splice(1, 0, "bossPrep");
// 		wareApp.minigameHistory[wareCtx.score - 1] = getGameID(choosenGame);
// 		wareApp.winState = undefined;

// 		// ### transition coolness ##
// 		// sends prep, if shouldSpeedUp is false and winState is undefinied, then it will only run prep
// 		const transition = runTransition(wareApp, transitionStates);
// 		let inputPrompt: ReturnType<typeof k.addInputPrompt> = null;
// 		let prompt: ReturnType<typeof k.addPrompt> = null;

// 		transition.onInputPromptTime(() => inputPrompt = k.addInputPrompt(wareApp, getGameInput(choosenGame)));

// 		transition.onPromptTime(() => {
// 			inputPrompt.end();
// 			if (typeof choosenGame.prompt == "string") prompt = k.addPrompt(wareApp, choosenGame.prompt);
// 			else {
// 				prompt = k.addPrompt(wareApp, "");
// 				choosenGame.prompt(wareApp.currentContext, prompt);
// 			}
// 			prompt.parent = wareApp.rootObj;

// 			wareApp.pausableCtx.wait(0.15 / wareCtx.speed, () => {
// 				cursor.fadeAway = gameHidesMouse(choosenGame);
// 				prompt.end();
// 			});
// 		});

// 		transition.onStateStart((state) => {
// 			if (state == "prep") {
// 				wareCtx.runGame(choosenGame);
// 			}
// 			else if (state == "speed") {
// 				wareCtx.timesSpeed++;
// 				wareCtx.speedUp();
// 			}
// 		});

// 		transition.onStateEnd((state) => {
// 			if (state == "lose") {
// 				if (!isGameOver()) return;
// 				wareApp.pausableCtx.play("gameOverJingle").onEnd(() => {
// 					k.go("gameover", wareCtx.score);
// 				});
// 				k.addPrompt(wareApp, "GAME OVER");
// 			}
// 		});

// 		transition.onTransitionEnd(() => {
// 			// don't remove it on game over, serves as background
// 			if (!isGameOver()) transition.destroy();
// 			wareApp.gameRunning = true;
// 			wareApp.timeRunning = true;
// 			wareApp.inputEnabled = true;
// 		});
// 	},
// };

// wareApp.wareCtx = wareCtx;

// for (const game of opts.games) {
// 	game.urlPrefix = game.urlPrefix ?? "";
// 	game.isBoss = game.isBoss ?? false;
// 	game.rgb = game.rgb ?? [255, 255, 255];
// 	if ("r" in game.rgb) game.rgb = [game.rgb.r, game.rgb.g, game.rgb.b];
// }

// k.onUpdate(() => {
// 	wareApp.rootObj.paused = wareApp.gamePaused;
// 	wareApp.boxObj.color = wareApp.currentColor;
// 	cursor.canPoint = wareApp.gameRunning;
// 	wareApp.conductor.bpm = 140 * wareCtx.speed;
// 	wareApp.conductor.paused = wareApp.gamePaused;
// 	wareApp.sceneObj.paused = !wareApp.gameRunning;

// 	wareApp.inputEvents.forEach((ev) => ev.paused = !wareApp.inputEnabled || !wareApp.gameRunning);
// 	wareApp.timerEvents.forEach((ev) => ev.paused = !wareApp.gameRunning || wareApp.gamePaused);
// 	wareApp.updateEvents.forEach((ev) => ev.paused = !wareApp.gameRunning || wareApp.gamePaused);
// 	wareApp.pausedSounds.forEach((sound) => sound.paused = true);
// 	wareApp.pausableCtx.sounds.forEach((sound) => sound.paused = wareApp.gamePaused);
// 	wareApp.pausableCtx.timers.forEach((timer) => timer.paused = wareApp.gamePaused);

// 	k.quickWatch("games.length", opts.games.length);
// 	k.quickWatch("game", getGameID(wareApp.wareCtx.curGame));
// 	k.quickWatch("input", getInputMessage(wareApp.wareCtx.curGame));
// 	k.quickWatch("time", wareApp.wareCtx.time);
// });

// return wareCtx;
// }
