import { KEvent, KEventController } from "kaplay";
import { createWareApp } from "./app";
import { createGameCtx } from "./context/game";
import games from "./games";
import { gameHidesMouse, getGameByID, getGameColor, getGameDuration, getGameID, getGameInput } from "./utils";
import { MinigameCtx, MinigameInput } from "./context/types";
import { addBomb, WareBomb } from "./objects/bomb";
import k from "../../engine";
import cursor from "../../plugins/cursor";
import Minigame from "./minigameType";
import { addInputPrompt, addTextPrompt } from "./objects/prompts";
import { createTransition, Transition, TransitionStage } from "./transitions/makeTransition";
import chillTransition from "./transitions/chill";

/** Certain options to instantiate kaplayware (ware-engine) */
export type KAPLAYwareOpts = {
	games?: Minigame[];
	filters?: { input: MinigameInput; }; // TODO: do this eventually, be able to filter by input, by boss and such idk
	// mods here
};

export type Kaplayware = {
	lives: number;
	score: number;
	timeLeft: number;
	speed: number;
	difficulty: 1 | 2 | 3;
	curGame: Minigame;
	curContext: MinigameCtx;
	readonly curPrompt: string;
	readonly curDuration: number;
	timePaused: boolean;
	gamePaused: boolean;
	minigameHistory: string[];
	queuedSounds: KEventController[];
	onTimeOutEvents: KEvent;
	winState: boolean | undefined;
	paused: boolean;
	clearPrevious(): void;
	winGame(): void;
	loseGame(): void;
	finishGame(): void;
	nextGame(): void;
};

/** Instantiates and runs KAPLAYWARE (aka ware-engine), to start it, run nextGame() */
export function kaplayware(opt: KAPLAYwareOpts = { games: games }): Kaplayware {
	const HOW_FREQUENT_BOSS = 10;
	const MAX_SPEED = 1.6;

	for (const game of opt.games) {
		game.isBoss = game.isBoss ?? false;
	}

	let currentBomb: WareBomb = null;
	let previousGame: Minigame = null;
	let transition = null as Transition;

	const getRandomGame = () => {
		let possibleGames: Minigame[] = [...opt.games];

		if (!shouldBoss()) {
			possibleGames = possibleGames.filter((game) => !game.isBoss);
		}

		// now check for history and repeatedness and get a new one
		possibleGames = possibleGames.filter((game) => {
			if (possibleGames.every((g) => g.isBoss)) return true;
			if (wareEngine.minigameHistory.length == 0 || opt.games.length == 1 || possibleGames.length == 1) return true;
			else {
				const previousPreviousID = wareEngine.minigameHistory[wareEngine.score - 3];
				const previousPreviousGame = getGameByID(previousPreviousID);

				if (previousPreviousGame) return game != wareEngine.curGame && game != previousPreviousGame;
				else return game != wareEngine.curGame;
			}
		});

		return k.choose(possibleGames);
	};

	const calculateDifficulty = (score = wareEngine.score): 1 | 2 | 3 => {
		return Math.max(1, (Math.floor(score / 10) + 1) % 4) as 1 | 2 | 3;
	};

	const shouldSpeedUp = () => {
		const realScore = wareEngine.score + 1;
		const number = k.randi(4, 6);
		const division = () => {
			if (realScore % number == 0) return true;
			else if (k.chance(0.1) && realScore % 5 == 0) return true;
			else return false;
		};
		if (division() && wareEngine.speed <= MAX_SPEED && !shouldBoss()) {
			if (previousGame && previousGame.isBoss) return false;
			else return true;
		}
		else return false;
	};

	const isGameOver = (winState = wareEngine.winState) => {
		return winState == false && wareEngine.lives == 0;
	};

	const shouldBoss = () => {
		const scoreEqualsBoss = () => wareEngine.score % HOW_FREQUENT_BOSS == 0;
		const onlyBoss = () => opt.games.length == 1 && opt.games[0].isBoss == true;
		return scoreEqualsBoss() || onlyBoss();
	};

	const getTransitionStages = (winState: boolean | undefined = wareEngine.winState): TransitionStage[] => {
		let transitionStages: TransitionStage[] = ["prep"];

		const winThing: TransitionStage = previousGame?.isBoss ? (winState == true ? "bossWin" : "bossLose") : winState == true ? "win" : "lose";
		if (winState != undefined) transitionStages.splice(0, 0, winThing);
		if (shouldSpeedUp()) transitionStages.splice(1, 0, "speed");
		if (isGameOver(winState)) transitionStages = ["lose"];
		if (shouldBoss()) transitionStages.splice(1, 0, "bossPrep"); // this would be before the prep, so it does BOSS! then regular prep

		return transitionStages;
	};

	const wareApp = createWareApp();
	const wareEngine: Kaplayware = {
		timeLeft: 4,
		lives: 4,
		score: 0,
		speed: 1,
		difficulty: 1,
		timePaused: false,
		gamePaused: false,
		minigameHistory: [],
		queuedSounds: [],
		winState: undefined,
		curGame: undefined,
		curContext: undefined,
		onTimeOutEvents: new k.KEvent(),
		get paused() {
			return wareApp.gamePaused;
		},
		set paused(val: boolean) {
			wareApp.gamePaused = val;
		},
		get curDuration() {
			return getGameDuration(this.curGame, this.curContext);
		},
		get curPrompt() {
			return typeof wareEngine.curGame.prompt == "string" ? wareEngine.curGame.prompt : "";
		},
		clearPrevious() {
			wareApp.clearAll();
			wareApp.resetCamera();
			wareApp.sceneObj.removeAll();
			// fixed objs are added to root so they're not affected by camera (parent of sceneObj)
			wareApp.rootObj.get("fixed").forEach((obj) => obj.destroy());
			currentBomb?.destroy();
			k.setGravity(0);
		},
		winGame() {
			wareEngine.timePaused = true;
			wareEngine.winState = true;
			currentBomb?.extinguish();
		},
		loseGame() {
			wareEngine.lives--;
			wareEngine.timePaused = true;
			wareEngine.winState = false;
			currentBomb?.explode();
		},
		finishGame() {
			if (wareEngine.winState == undefined) {
				throw new Error("Finished minigame without setting the win condition!! Please call ctx.win() or ctx.lose() before calling ctx.finish()");
			}

			wareEngine.nextGame();
		},
		nextGame() {
			wareEngine.score++;

			// pauses the current one and the next one
			wareEngine.timePaused = true;
			wareEngine.gamePaused = true;
			wareApp.timers.paused = true;
			wareApp.sounds.paused = true;
			wareApp.inputs.paused = true;
			cursor.canPoint = false;
			previousGame = wareEngine.curGame;
			wareEngine.onTimeOutEvents.clear();
			if (!transition) transition = createTransition(chillTransition, wareApp, wareEngine);

			// runs on prep so the previous game isn't seen anymore
			// thus can be cleared and the new one can be prepped
			transition.onStageStart("prep", () => {
				wareEngine.clearPrevious();
				wareEngine.curGame = getRandomGame();
				wareEngine.curContext = createGameCtx(wareEngine.curGame, wareApp, wareEngine);

				wareEngine.curContext.setRGB(getGameColor(wareEngine.curGame, wareEngine.curContext));
				cursor.fadeAway = gameHidesMouse(wareEngine.curGame);
				wareEngine.minigameHistory[wareEngine.score - 1] = getGameID(wareEngine.curGame);
				wareEngine.curGame.start(wareEngine.curContext);
				wareEngine.timeLeft = wareEngine.curDuration != undefined ? wareEngine.curDuration / wareEngine.speed : undefined;
				wareEngine.difficulty = calculateDifficulty();
				currentBomb = null;

				// behaviour that manages minigame
				wareEngine.curContext.onUpdate(() => {
					if (!wareEngine.timeLeft) return;
					if (wareEngine.timePaused) return;
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

					if (wareEngine.timeLeft <= 0 && !wareEngine.timePaused) {
						wareEngine.timePaused = true;
						wareEngine.onTimeOutEvents.trigger();
						if (!currentBomb.hasExploded) currentBomb.explode();
					}
				});
			});

			// if this runs is because shouldSpeed() is true, so it's fine to increase speed here don't worry
			transition.onStageStart("speed", () => {
				wareEngine.speed = k.clamp(wareEngine.speed + wareEngine.speed * 0.07, 0, MAX_SPEED);
			});

			// these run but prep doesn't
			transition.onInputPromptTime(() => {
				addInputPrompt(wareApp, getGameInput(wareEngine.curGame));
			});

			transition.onPromptTime(() => {
				const promptObj = addTextPrompt(wareApp, wareEngine.curPrompt, wareEngine.speed);
				if (typeof wareEngine.curGame.prompt == "function") wareEngine.curGame.prompt(wareEngine.curContext, promptObj);
			});

			transition.onTransitionEnd(() => {
				cursor.fadeAway = gameHidesMouse(wareEngine.curGame);
				wareApp.timers.paused = false;
				wareApp.sounds.paused = false;
				wareApp.inputs.paused = false;
				wareEngine.gamePaused = false;
				wareEngine.timePaused = false;
				cursor.canPoint = true;
			});

			// trigger transition
			transition.trigger(getTransitionStages());
			wareEngine.winState = undefined; // reset it after transition so it does the win and lose

			wareEngine.onTimeOutEvents.add(() => {
				wareApp.inputs.paused = true;
			});
		},
	};

	wareApp.rootObj.onUpdate(() => {
		wareApp.sceneObj.paused = wareEngine.gamePaused;
		wareApp.handleQuickWatch();
		// TODO: some objects seem to not be cleared, might be around boss things??
		// starts with 40 and after first round is 80, that's weird
		k.quickWatch("ware.score", wareEngine.score);
		k.quickWatch("ware.time", wareEngine.timeLeft?.toFixed(2));
		k.quickWatch("ware.speed", wareEngine.speed.toFixed(2));
		k.quickWatch("k.objects", k.debug.numObjects());
	});

	return wareEngine;
}
