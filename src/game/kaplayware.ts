import { KEvent, KEventController } from "kaplay";
import k from "../engine";
import { createWareApp } from "./app";
import { Minigame } from "./types";
import { createGameCtx } from "./context/game";
import games from "./games";
import { gameHidesMouse, getGameColor, getGameDuration, getGameID } from "./utils";
import cursor from "../plugins/cursor";
import { runTransition, TransitionState } from "./transitions";
import { MinigameInput } from "./context/types";
import { addBomb, WareBomb } from "./objects/bomb";

/** Certain options to instantiate kaplayware (ware-engine) */
export type KAPLAYwareOpts = {
	games?: Minigame[];
	filters: { input: MinigameInput; }; // TODO: do this eventually, be able to filter by input, by boss and such idk
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
	winState: boolean | undefined;
	clearPrevious(): void;
	winGame(): void;
	loseGame(): void;
	finishGame(): void;
	runGame(): void;
	nextGame(): void;
};

// TODO: add conductor here? would that be fine?
// TODO: why do you even need a global conductor??
// Should just add it here and create an event that pauses it on everythingPaused

// remember that big on update event that paused everything on everythingPaused? create it here too, makes the most sense
// Add it here and not on wareApp, because wareApp doesn't require a BPM or anything, that's exclusive of transitions and bomb timing

/** Instantiates and runs KAPLAYWARE (aka ware-engine), to start it, run nextGame() */
export function kaplayware(opt: KAPLAYwareOpts): Kaplayware {
	const HOW_FREQUENT_BOSS = 10;
	const MAX_SPEED = 1.6;

	opt = opt ?? {} as unknown as any;
	opt.games = opt.games ?? games;
	for (const game of opt.games) {
		game.isBoss = game.isBoss ?? false;
	}

	const wareApp = createWareApp();
	const wareEngine = {} as unknown as Kaplayware;
	wareEngine.timeLeft = 4;
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
	wareEngine.onTimeOutEvents = new k.KEvent();

	let currentBomb: WareBomb = null;
	let previousGame: Minigame = null;

	// TODO: find a better way to organize all these functions
	const getRandomGame = () => {
		let possibleGames: Minigame[] = opt.games;

		if (shouldBoss()) {
			possibleGames = possibleGames.filter((game) => game.isBoss == true);
		}

		// now check for history and repeatedness and get a new one
		possibleGames = possibleGames.filter((game) => {
			if (wareEngine.minigameHistory.length == 0 || opt.games.length == 1) return true;
			else {
				const previousPreviousID = wareEngine.minigameHistory[wareEngine.score - 3];
				const previousPreviousGame = games.find((game) => getGameID(game) == previousPreviousID);
				if (previousPreviousGame) return game != wareEngine.curGame && game != previousPreviousGame;
				else return game != wareEngine.curGame;
			}
		});

		return k.choose(opt.games);
	};

	const calculateDifficulty = (): 1 | 2 | 3 => {
		let diff = 1;
		if (previousGame?.isBoss || opt.games.filter((g) => g.isBoss).length == 0 && wareEngine.score % HOW_FREQUENT_BOSS == 0) {
			diff = 1 + wareEngine.difficulty % 3;
		}
		return diff as 1 | 2 | 3;
	};

	const shouldSpeedUp = () => {
		const realScore = wareEngine.score + 1;
		const number = k.randi(4, 6);
		const division = () => {
			if (realScore % number == 0) return true;
			else if (k.chance(0.1) && realScore % 5 == 0) return true;
			else return false;
		};
		const condition = () => wareEngine.speed <= MAX_SPEED && !shouldBoss();
		return division() && condition();
	};

	const isGameOver = (winState = wareEngine.winState) => {
		return winState && wareEngine.lives == 0;
	};

	const shouldBoss = () => {
		if (wareEngine.score % HOW_FREQUENT_BOSS == 0 && opt.games.some((g) => g.isBoss) || (opt.games.length == 1 && opt.games[0].isBoss)) return true;
	};

	const getTransitionStates = (winState: boolean | undefined = wareEngine.winState): TransitionState[] => {
		let transitionStates: TransitionState[] = ["prep"];

		// TODO: if there's a boss loss put it here too
		const winThing: TransitionState = previousGame?.isBoss ? (winState == true ? "bossWin" : "lose") : winState == true ? "win" : "lose";
		if (winState != undefined) transitionStates.splice(0, 0, winThing);
		if (shouldSpeedUp()) transitionStates.splice(1, 0, "speed");
		if (isGameOver(winState)) transitionStates = ["lose"];
		if (shouldBoss()) transitionStates.splice(1, 0, "bossPrep");

		return transitionStates;
	};

	// TODO: See what needs to be cleared
	wareEngine.clearPrevious = () => {
		wareApp.sceneObj.removeAll();
		wareApp.clearAll();
	};

	wareEngine.winGame = () => {
		wareEngine.timeRunning = false;
		wareEngine.winState = true;
		currentBomb?.extinguish();
	};

	wareEngine.loseGame = () => {
		wareEngine.lives--;
		wareEngine.timeRunning = false;
		wareEngine.winState = false;
	};

	wareEngine.finishGame = () => {
		if (wareEngine.winState == undefined) {
			throw new Error("Finished minigame without setting the win condition!! Please call ctx.win() or ctx.lose() before calling ctx.finish()");
		}

		wareEngine.nextGame();
	};

	wareEngine.nextGame = () => {
		wareEngine.score++;

		// pauses the current one and the next one
		wareEngine.timeRunning = false;
		wareEngine.gameRunning = false;
		wareApp.soundsEnabled = false;
		previousGame = wareEngine.curGame;

		const transition = runTransition(getTransitionStates(), wareApp, wareEngine);
		wareEngine.winState = undefined; // reset it after transition so it does the win and lose

		transition.onStateStart("speed", () => {
			// do the speed up function or just keep this like that
			const increment = k.choose([0.06, 0.07, 0.08]);
			wareEngine.speed = k.clamp(wareEngine.speed + wareEngine.speed * increment, 0, MAX_SPEED);
		});

		// runs on prep so the previous game isn't seen anymore
		// thus can be cleared and the new one can be prepped
		transition.onStateStart("prep", () => {
			wareEngine.clearPrevious();
			wareEngine.curGame = getRandomGame();
			const ctx = createGameCtx(wareEngine.curGame, wareApp, wareEngine);

			ctx.setRGB(getGameColor(wareEngine.curGame, ctx));
			cursor.fadeAway = gameHidesMouse(wareEngine.curGame);
			wareEngine.minigameHistory[wareEngine.score - 1] = getGameID(wareEngine.curGame);
			wareEngine.curGame.start(ctx);
			wareEngine.timeLeft = getGameDuration(wareEngine.curGame, ctx);
			wareEngine.difficulty = calculateDifficulty();
			currentBomb = null;

			// behaviour that manages minigame
			ctx.onUpdate(() => {
				if (!wareEngine.timeRunning) return;
				// bomb and such is not necessary bcause time is undefined
				if (wareEngine.timeLeft == undefined) return;
				if (wareEngine.timeLeft > 0) wareEngine.timeLeft -= k.dt();
				wareEngine.timeLeft = k.clamp(wareEngine.timeLeft, 0, 20);

				// When there's 4 beats left
				const beatInterval = 60 / (140 * wareEngine.speed);
				if (wareEngine.timeLeft <= beatInterval * 4 && currentBomb == null) {
					currentBomb = addBomb(wareApp);
					currentBomb.lit(140 * wareEngine.speed);
				}

				if (wareEngine.timeLeft <= 0 && wareEngine.timeRunning == true) {
					wareEngine.timeRunning = false;
					wareEngine.onTimeOutEvents.trigger();
					if (!currentBomb.hasExploded) currentBomb.explode();
				}
			});
		});

		// don't remove this, very crucial
		transition.onTransitionEnd(() => {
			wareApp.soundsEnabled = true;
			wareApp.inputEnabled = true;
			wareEngine.gameRunning = true;
			wareEngine.timeRunning = true;
		});
	};

	// TODO: do sound stuff where the sounds need to be unpaused and such
	// TODO: do all the add prompt and input prompt stuff
	// TODO: check things like transitions, bombs and conductors are destroyed when they stop being used
	// TODO: figure out where things like FixedComp do, re-figure it out
	/*
	TODO: Things to clear on clearPrevious()
	sceneObjs
	all on wareApp (wareApp.clearAll())
	camera (wareApp.resetCamera())
	*/

	wareEngine.onTimeOutEvents.add(() => {
		wareApp.inputEnabled = false;
	});

	wareApp.rootObj.onUpdate(() => {
		wareApp.sceneObj.paused = !wareEngine.gameRunning;
	});

	// wareApp.clearAll();
	// wareApp.canPlaySounds = false;
	// wareEngine.onTimeOutEvents.clear();
	// wareEngine.gameRunning = false;
	// wareApp.sceneObj.clearEvents(); // what is the purpose of this
	// wareApp.sceneObj.removeAll(); // removes all objs

	// wareApp.onTimeOutEvents.clear();
	// wareApp.gameRunning = false;
	// wareApp.canPlaySounds = false;
	// wareApp.currentBomb?.destroy();
	// wareApp.sceneObj.clearEvents(); // this clears the time running update, not the onUpdate events of the minigame
	// // removes the scene
	// k.wait(0.2 / wareApp.wareCtx.speed, () => {
	// 	wareApp.clearDrawEvents(); // clears them after you can't see them anymore
	// 	wareApp.sceneObj.removeAll();
	// 	// removes fixed objects too (they aren't attached to the gamebox)
	// 	wareApp.rootObj.get("fixed").forEach((obj) => obj.destroy());
	// 	// reset camera
	// 	this.setCamPos(k.center());
	// 	this.setCamAngle(0);
	// 	this.setCamScale(k.vec2(1));
	// 	wareApp.cameraObj.get("flash").forEach((f) => f.destroy());
	// 	wareApp.cameraObj.shake = 0;
	// });
	// wareApp.wareCtx.nextGame();
	// });

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
