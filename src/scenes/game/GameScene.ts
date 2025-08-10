import k from "../../engine";
import cursor from "../../plugins/cursor";
import { createWareApp } from "./app";
import { createGameCtx } from "./context/gameContext";
import { managePreviewMode } from "./inputRecorder";
import { addBomb, WareBomb } from "./objects/bomb";
import { createPauseScreen } from "./objects/pause";
import chillTransition from "./transitions/chill";
import { createTransition } from "./transitions/makeTransition";
import { gameHidesMouse, getGameColor, getGameDuration, getGameID, getGameInput } from "./utils";
import { createWareEngine, KAPLAYwareOpts } from "./ware";

k.scene("game", (kaplaywareOpt: KAPLAYwareOpts = { availableGames: window.microgames }) => {
	k.kaplaywared.ignoreWareInputEvents = false;
	const app = createWareApp();
	const transition = createTransition(chillTransition, app);
	const ware = createWareEngine(app, { availableGames: kaplaywareOpt.availableGames ?? window.microgames });
	ware.ctx = createGameCtx(ware, app);

	const pauseScreen = createPauseScreen();
	let gamePaused = false;
	const setPaused = (newPause: boolean) => {
		gamePaused = newPause;
		app.paused = gamePaused;
		transition.ctx.paused = gamePaused;
		pauseScreen.isGamePaused = gamePaused;
		app.draws.paused = false;
		if (!transition.ctx.paused) app.sounds.paused = true;
		if (currentBomb) currentBomb.paused = gamePaused;
	};

	let currentBomb: WareBomb = null;

	k.onUpdate(() => {
		cursor.canPoint = !app.sceneObj.paused;
		k.quickWatch("GAME.paused", gamePaused);
		app.handleQuickWatch();
		ware.handleQuickWatch();
		k.quickWatch("k.objects", k.debug.numObjects());

		// toggle the pause on the app
		if (k.isButtonPressed("return") && !window.DEV_RECORDINPUT) setPaused(!gamePaused);
	});

	function clearPrevious() {
		app.clearAll();
		app.resetCamera();
		app.sceneObj.removeAll();
		// fixed objs are added to the mask so they're not affected by camera (parent of sceneObj)
		app.maskObj.get("fixed").forEach((obj) => obj.destroy());
		// fake timer objects for the timer comp
		app.sceneObj.get("fakeTimer").forEach((obj) => obj.destroy());
		currentBomb?.destroy();
		ware.onTimeOutEvents.clear();
		k.setGravity(0);
	}

	function runNextGame() {
		ware.score++;

		// pauses events and such
		app.paused = true;
		ware.timePaused = true;
		app.sceneObj.paused = true;

		// unpauses transition and other stuff
		app.rootObj.paused = false;
		app.draws.paused = false;
		transition.ctx.paused = false;
		clearPrevious();

		// if dead, stops the process in its tracks and only triggers lose, gameOver and the highscores thing
		if (ware.isGameOver()) {
			const loseStages = ware.getTransitionStages();

			transition.onTransitionEnd(() => {
				// usually it hides it but i show it again
				transition.root.hidden = false;

				// TODO: this is the part where high scores should be added

				k.add([
					k.rect(k.width(), k.height()),
					k.opacity(0.5),
					k.color(k.BLACK),
				]);

				k.add([
					k.text("CLICK TO TRY AGAIN"),
					k.anchor("center"),
					k.pos(k.center()),
				]);

				k.onClick(() => {
					goGame(kaplaywareOpt);
				});
			});

			transition.trigger(loseStages, {
				difficulty: ware.difficulty,
				lives: ware.lives,
				score: ware.score,
				speed: ware.speed,
				input: "keys",
				prompt: "",
			});

			return;
		}

		// since we didn't lose, choose a new minigame
		ware.microgame = ware.getRandomGame();
		const duration = getGameDuration(ware.microgame, ware.ctx);
		const stages = ware.getTransitionStages();

		transition.onStageStart("prep", () => {
			// prepares
			ware.ctx.setRGB(getGameColor(ware.microgame, ware.ctx));
			ware.microgameHistory[ware.score - 1] = getGameID(ware.microgame);
			ware.difficulty = ware.getDifficulty();
			ware.timeLeft = duration != undefined ? duration / ware.speed : undefined;
			ware.curDuration = duration;
			if (typeof ware.microgame.prompt == "string") ware.curPrompt = ware.microgame.prompt;
			else ware.curPrompt = ware.microgame.name; // TODO: figure it out fine fine
			cursor.stayHidden = gameHidesMouse(ware.microgame);
			currentBomb = null;
			ware.microgame.start(ware.ctx); // IMPORTANT: starts the game

			// behaviour that manages ware.microgame
			ware.ctx.onUpdate(() => {
				if (!ware.timeLeft) return;
				if (ware.timePaused) return;
				// bomb and such is not necessary bcause time is undefined
				if (ware.timeLeft == undefined) return;
				if (ware.timeLeft > 0) ware.timeLeft -= k.dt();
				ware.timeLeft = k.clamp(ware.timeLeft, 0, 20);

				// When there's 4 beats left
				const beatInterval = 60 / (140 * ware.speed);
				if (ware.timeLeft <= beatInterval * 4 && currentBomb == null) {
					if (ware.ctx.winState == true) return;
					currentBomb = addBomb(app);
					currentBomb.lit(140 * ware.speed);
				}

				if (ware.timeLeft <= 0 && !ware.timePaused) {
					if (!currentBomb.hasExploded && !currentBomb.conductor.paused) currentBomb.explode();
					ware.timePaused = true;
					ware.onTimeOutEvents.trigger();
				}
			});
		});

		transition.onStageStart("speed", () => {
			ware.speed = ware.getSpeed();
		});

		transition.onTransitionEnd(() => {
			// when the transition is unpause the scene and start counting the time (also cancel transition events)
			app.paused = false;
			ware.timePaused = false;
			app.sceneObj.paused = false;
			transition.ctx.cancel(); // clear the transCtx
			cursor.canPoint = true;
			gameHidesMouse(ware.microgame) ? cursor.opacity = 0 : 1;
		});

		// makes the transition happen and kickstarts the whole process
		transition.trigger(stages, {
			difficulty: ware.difficulty,
			lives: ware.lives,
			score: ware.score,
			speed: ware.speed,
			input: getGameInput(ware.microgame),
			prompt: ware.microgame.prompt,
			ctx: ware.ctx,
		});

		ware.winState = undefined;
		ware.onTimeOutEvents.add(() => app.inputs.paused = true); // pauses inputs when the time is over

		if (window.DEV_RECORDINPUT) {
			setPaused(true);
			managePreviewMode(app, ware, () => setPaused(false));
		}
	}

	ware.onWin(() => {
		ware.winState = true;
		currentBomb?.extinguish();
	});

	ware.onLose(() => {
		ware.winState = false;
		currentBomb?.explode();
		ware.lives--;
	});

	ware.onFinish(() => {
		// this runs when someone calls the game to be over (ctx.finish())
		if (ware.winState == undefined) {
			throw new Error("Finished ware.microgame without setting the win condition!! Please call ctx.win() or ctx.lose() before calling ctx.finish()");
		}

		if (!window.DEV_RECORDINPUT) runNextGame();
	});

	// start the game around here
	runNextGame();
});

const goGame = (opts?: KAPLAYwareOpts) => k.go("game", opts);
export default goGame;
