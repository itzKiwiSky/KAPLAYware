import k from "../engine";
import { AnchorComp, AudioPlay, GameObj, KEventController, MaskComp, PosComp, RectComp, RotateComp, ScaleComp, TimerController, Vec2, Vec2Args } from "kaplay";
import cursor from "../plugins/cursor";
import { gameHidesMouse, getGameDuration, getGameID, getGameInput, getInputMessage } from "./utils";
import { runTransition, TransitionState } from "./transitions";
import { KAPLAYwareOpts, Minigame } from "./types";
import games from "./games";
import { createGameCtx, createPauseCtx, MinigameCtx, PauseCtx } from "./context";
import { WareBomb } from "../plugins/wareobjects";

export function createGameContainer() {
	const root = k.add([]);

	const gameBox = root.add([
		k.rect(k.width(), k.height()),
		k.color(k.BLUE.lighten(100)),
		k.scale(1),
		k.pos(k.center()),
		k.anchor("center"),
	]);

	const maskObj = gameBox.add([
		k.rect(gameBox.width, gameBox.height),
		k.pos(-gameBox.width / 2, -gameBox.height / 2),
		k.mask("intersect"),
	]);

	const shakeCameraObject = maskObj.add([
		k.pos(),
	]);

	const cameraObject = shakeCameraObject.add([
		k.rect(k.width(), k.height(), { fill: false }),
		k.pos(k.center()),
		k.rotate(0),
		k.anchor("center"),
		k.scale(1),
		{
			shake: 0,
		},
	]);

	const sceneObject = cameraObject.add([
		k.pos(-cameraObject.width / 2, -cameraObject.height / 2),
	]);

	cameraObject.onUpdate(() => {
		cameraObject.shake = k.lerp(cameraObject.shake, 0, 5 * k.dt());
		let posShake = k.Vec2.fromAngle(k.rand(0, 360)).scale(cameraObject.shake);
		shakeCameraObject.pos = k.vec2().add(posShake);
	});

	return {
		/** The root of all evil */
		root: root,
		/** Is the background and "window" of everything */
		box: gameBox,
		/** Masking object so things inside don't go out */
		mask: maskObj,
		/** Is the offset for the camera shaking */
		shakeCam: shakeCameraObject,
		/** Is the camera */
		camera: cameraObject,
		/** Is the real scene where minigame objects can be added with no problem, should have 0 children */
		scene: sceneObject,
		set scale(val: Vec2) {
			gameBox.scale = val;
		},
		get scale() {
			return gameBox.scale;
		},
		set pos(val: Vec2) {
			gameBox.pos = val;
		},
		get pos() {
			return gameBox.pos;
		},
	};
}

export function createWareApp() {
	const gameContainer = createGameContainer();

	const wareApp = {
		get rootObj() {
			return gameContainer.root;
		},
		get boxObj() {
			return gameContainer.box;
		},
		get sceneObj() {
			return gameContainer.scene;
		},
		get cameraObj() {
			return gameContainer.camera;
		},
		wareCtx: null as ReturnType<typeof kaplayware>,
		/** Wheter the current minigame should be running (will be false when the transition hasn't finished) */
		gameRunning: false,
		/** Wheter the whole game is paused */
		gamePaused: false,
		/** Wheter the user is capable of pressing keys to play */
		inputEnabled: false,
		/** These won't be paused at all */
		drawEvents: [] as KEventController[],
		/** These will be paused with `wareApp.gameRunning` */
		updateEvents: [] as KEventController[],
		/** These will be paused with `wareApp.gameRunning` && `wareApp.inputEnabled` */
		inputEvents: [] as KEventController[],
		/** These will be paused with `wareApp.gameRunning` && `wareApp.gamePaused` */
		timerEvents: [] as TimerController[],
		sounds: [] as AudioPlay[],
		queuedSounds: [] as AudioPlay[],
		/** When the game is paused, all the sounds currently not paused will be sent here */
		pausedSounds: [] as AudioPlay[],
		canPlaySounds: false,
		onTimeOutEvents: new k.KEvent(),
		currentColor: k.rgb(),
		pausableCtx: null as PauseCtx,
		currentContext: null as MinigameCtx,
		timeRunning: false, // will turn true when transition is over (not same as gameRunning)
		currentBomb: null as WareBomb,
		conductor: k.conductor(140),
		minigameHistory: [] as string[],
		winState: undefined as boolean | undefined,

		addGeneralEvent(ev: KEventController) {
			this.updateEvents.push(ev);
			return ev;
		},
		clearGeneralEvents() {
			for (let i = this.updateEvents.length - 1; i >= 0; i--) {
				this.updateEvents[i].cancel();
				this.updateEvents.pop();
			}
		},
		addDrawEvent(ev: KEventController) {
			this.drawEvents.push(ev);
			return ev;
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

			for (let i = this.pausedSounds.length - 1; i >= 0; i--) {
				this.pausedSounds[i].stop();
				this.pausedSounds.pop();
			}
		},
	};

	wareApp.pausableCtx = createPauseCtx();

	return wareApp;
}

/** Object that holds some a lot of managers for the KAPLAYware engine */
export type WareApp = ReturnType<typeof createWareApp>;

export default function kaplayware(opts: KAPLAYwareOpts = {}) {
	const MAX_SPEED = 1.64;

	opts = opts ?? {};
	opts.games = opts.games ?? games;
	opts.inOrder = opts.inOrder ?? false;

	const wareApp = createWareApp();

	const gameBox = wareApp.sceneObj;

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
			const increment = k.choose([0.06, 0.07, 0.08]);
			this.speed = k.clamp(this.speed + this.speed * increment, 0, MAX_SPEED);
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

			wareApp.currentContext = createGameCtx(wareApp, minigame);

			const gameDuration = getGameDuration(minigame, wareApp);
			wareCtx.time = gameDuration;
			wareApp.currentContext.timeLeft = wareCtx.time;
			wareApp.currentColor = typeof minigame.rgb == "function" ? minigame.rgb(wareApp.currentContext) : "r" in minigame.rgb ? minigame.rgb : k.Color.fromArray(minigame.rgb);
			wareApp.sceneObj.removeAll();
			wareApp.gameRunning = false; // will be set to true onTransitionEnd (in nextGame())
			wareApp.timeRunning = false;
			wareApp.canPlaySounds = false;
			wareApp.currentBomb?.destroy();
			wareApp.currentBomb = null;
			wareCtx.curGame = minigame;
			k.setGravity(0);
			minigame.start(wareApp.currentContext);

			gameBox.onUpdate(() => {
				if (!wareApp.gameRunning) return;

				if (!wareApp.canPlaySounds) {
					wareApp.canPlaySounds = true;
					wareApp.queuedSounds.forEach((sound) => sound.paused = false);
				}

				if (!wareApp.timeRunning) return;
				if (!gameDuration) return;

				if (wareCtx.time > 0) wareCtx.time -= k.dt();
				wareCtx.time = k.clamp(wareCtx.time, 0, 20);
				wareApp.currentContext.timeLeft = wareCtx.time;
				if (wareCtx.time <= 0 && wareApp.timeRunning) {
					wareApp.timeRunning = false;
					wareApp.onTimeOutEvents.trigger();
					if (!wareApp.currentBomb.hasExploded) wareApp.currentBomb.explode();
				}

				/** When there's 4 beats left */
				if (wareCtx.time <= wareApp.conductor.beatInterval * 4 && !wareApp.currentBomb) {
					wareApp.currentBomb = k.addBomb(wareApp);
					wareApp.currentBomb.parent = gameBox;
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
			const previousGame = wareCtx.curGame;
			const howFrequentBoss = 10;
			let games = [...opts.games];
			wareApp.gameRunning = false;

			// decide new difficulty
			if (previousGame?.isBoss || games.filter((g) => g.isBoss).length == 0 && wareCtx.score % howFrequentBoss == 0) {
				wareCtx.difficulty = 1 + wareCtx.difficulty % 3 as 1 | 2 | 3;
			}

			const shouldBoss = () => {
				if (wareCtx.score % howFrequentBoss == 0 && games.some((g) => g.isBoss) || (games.length == 1 && games[0].isBoss)) return true;
			};

			const shouldSpeed = () => {
				const realScore = wareCtx.score + 1;
				const number = k.randi(4, 6);
				const division = () => {
					if (realScore % number == 0) return true;
					else if (k.chance(0.1) && realScore % 5 == 0) return true;
					else return false;
				};
				const condition = () => wareCtx.speed <= MAX_SPEED && !shouldBoss();
				return division() && condition();
			};

			const copyOfWinState = wareApp.winState; // when isGameOver() is called winState will be undefined because it was resetted, when the order of this is reversed, it will be fixed
			const isGameOver = () => copyOfWinState == false && wareCtx.lives == 0;

			if (!shouldBoss()) {
				games = games.filter((game) => {
					return game.isBoss == false;
				});
			}

			// remove the ones that don't match the input
			games = games.filter((game) => {
				if (!opts.input) return true;
				else return getGameInput(game) == opts.input;
			});

			// now remove the previous one so we can get a new one
			games = games.filter((game) => {
				if (wareApp.minigameHistory.length == 0 || games.length == 1) return true;
				else {
					const previousPreviousID = wareApp.minigameHistory[wareCtx.score - 3];
					const previousPreviousGame = games.find((game) => getGameID(game) == previousPreviousID);
					if (previousPreviousGame) return game != wareCtx.curGame && game != previousPreviousGame;
					else return game != wareCtx.curGame;
				}
			});

			if (shouldBoss()) {
				games = games.filter((game) => {
					return game.isBoss == true;
				});
			}

			const choosenGame = opts.inOrder ? games[wareCtx.score % games.length] : k.choose(games);

			let transitionStates: TransitionState[] = ["prep"];
			if (wareApp.winState != undefined) transitionStates.splice(0, 0, wareApp.winState == true ? previousGame.isBoss ? "bossWin" : "win" : "lose");
			if (shouldSpeed()) transitionStates.splice(1, 0, "speed");
			if (isGameOver()) transitionStates = ["lose"];
			if (shouldBoss()) transitionStates.splice(1, 0, "bossPrep");
			wareApp.minigameHistory[wareCtx.score - 1] = getGameID(choosenGame);
			wareApp.winState = undefined;

			// ### transition coolness ##
			// sends prep, if shouldSpeedUp is false and winState is undefinied, then it will only run prep
			const transition = runTransition(wareApp, transitionStates);
			let inputPrompt: ReturnType<typeof k.addInputPrompt> = null;
			let prompt: ReturnType<typeof k.addPrompt> = null;

			transition.onInputPromptTime(() => inputPrompt = k.addInputPrompt(wareApp, getGameInput(choosenGame)));

			transition.onPromptTime(() => {
				inputPrompt.end();
				if (typeof choosenGame.prompt == "string") prompt = k.addPrompt(wareApp, choosenGame.prompt);
				else {
					prompt = k.addPrompt(wareApp, "");
					choosenGame.prompt(wareApp.currentContext, prompt);
				}
				prompt.parent = wareApp.rootObj;

				wareApp.pausableCtx.wait(0.15 / wareCtx.speed, () => {
					cursor.fadeAway = gameHidesMouse(choosenGame);
					prompt.end();
				});
			});

			transition.onStateStart((state) => {
				if (state == "prep") {
					wareCtx.runGame(choosenGame);
				}
				else if (state == "speed") {
					wareCtx.timesSpeed++;
					wareCtx.speedUp();
				}
			});

			transition.onStateEnd((state) => {
				if (state == "lose") {
					if (!isGameOver()) return;
					wareApp.pausableCtx.play("gameOverJingle").onEnd(() => {
						k.go("gameover", wareCtx.score);
					});
					k.addPrompt(wareApp, "GAME OVER");
				}
			});

			transition.onTransitionEnd(() => {
				// don't remove it on game over, serves as background
				if (!isGameOver()) transition.destroy();
				wareApp.gameRunning = true;
				wareApp.timeRunning = true;
				wareApp.inputEnabled = true;
			});
		},
	};

	wareApp.wareCtx = wareCtx;

	for (const game of opts.games) {
		game.urlPrefix = game.urlPrefix ?? "";
		game.isBoss = game.isBoss ?? false;
		game.rgb = game.rgb ?? [255, 255, 255];
		if ("r" in game.rgb) game.rgb = [game.rgb.r, game.rgb.g, game.rgb.b];
	}

	k.onUpdate(() => {
		wareApp.rootObj.paused = wareApp.gamePaused;
		wareApp.boxObj.color = wareApp.currentColor;
		cursor.canPoint = wareApp.gameRunning;
		wareApp.conductor.bpm = 140 * wareCtx.speed;
		wareApp.conductor.paused = wareApp.gamePaused;
		wareApp.sceneObj.paused = !wareApp.gameRunning;

		wareApp.inputEvents.forEach((ev) => ev.paused = !wareApp.inputEnabled || !wareApp.gameRunning);
		wareApp.timerEvents.forEach((ev) => ev.paused = !wareApp.gameRunning || wareApp.gamePaused);
		wareApp.updateEvents.forEach((ev) => ev.paused = !wareApp.gameRunning || wareApp.gamePaused);
		wareApp.pausedSounds.forEach((sound) => sound.paused = true);
		wareApp.pausableCtx.sounds.forEach((sound) => sound.paused = wareApp.gamePaused);
		wareApp.pausableCtx.timers.forEach((timer) => timer.paused = wareApp.gamePaused);

		k.quickWatch("games.length", opts.games.length);
		k.quickWatch("game", getGameID(wareApp.wareCtx.curGame));
		k.quickWatch("input", getInputMessage(wareApp.wareCtx.curGame));
		k.quickWatch("time", wareApp.wareCtx.time);
	});

	return wareCtx;
}
