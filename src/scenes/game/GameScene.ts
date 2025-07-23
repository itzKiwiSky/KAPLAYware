import k from "../../engine";
import cursor from "../../plugins/cursor";
import { createWareApp } from "./app";
import { createGameCtx } from "./context/gameContext";
import { addBomb, WareBomb } from "./objects/bomb";
import chillTransition from "./transitions/chill";
import { createTransition } from "./transitions/makeTransition";
import { gameHidesMouse, getGameColor, getGameDuration, getGameID, getGameInput } from "./utils";
import { createWareEngine, KAPLAYwareOpts } from "./ware";

k.scene("game", (kaplaywareOpt: KAPLAYwareOpts) => {
	const app = createWareApp();
	const transition = createTransition(chillTransition, app);
	const ware = createWareEngine({ availableGames: window.microgames });
	let gamePaused = false;
	let currentBomb: WareBomb = null;

	k.onUpdate(() => {
		cursor.canPoint = !app.sceneObj.paused;
		k.quickWatch("GAME.paused", gamePaused);
		app.handleQuickWatch();
		ware.handleQuickWatch();
		k.quickWatch("k.objects", k.debug.numObjects());

		// toggle the pause on the app
		if (k.isKeyPressed("escape")) {
			gamePaused = !gamePaused;
			app.paused = gamePaused;
			if (currentBomb) currentBomb.paused = gamePaused;
			transition.ctx.paused = gamePaused;
			app.draws.paused = false;
		}
	});

	k.add([k.z(999)]).onDraw(() => {
		if (!gamePaused) return;

		k.drawRect({
			color: k.BLACK,
			width: k.width(),
			height: k.height(),
		});

		k.drawText({
			text: "PAUSED",
			anchor: "center",
			pos: k.center(),
			color: k.WHITE,
		});
	});

	function clearPrevious() {
		app.clearAll();
		app.resetCamera();
		app.sceneObj.removeAll();
		// fixed objs are added to the mask so they're not affected by camera (parent of sceneObj)
		app.maskObj.get("fixed").forEach((obj) => obj.destroy());
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

		// chooses the next minigame
		const microgame = ware.getRandomGame();
		const ctx = createGameCtx(microgame, app, ware);
		const duration = getGameDuration(microgame, ctx);
		const stages = ware.getTransitionStages();

		transition.onStageStart("prep", () => {
			// prepares
			ctx.setRGB(getGameColor(microgame, ctx));
			ware.microgameHistory[ware.score - 1] = getGameID(microgame);
			ware.difficulty = ware.getDifficulty();
			ware.timeLeft = duration != undefined ? duration / ware.speed : undefined;
			ware.curDuration = duration;
			if (typeof microgame.prompt == "string") ware.curPrompt = microgame.prompt;
			else ware.curPrompt = microgame.name; // TODO: figure it out fine fine
			cursor.fadeAway = gameHidesMouse(microgame);
			currentBomb = null;
			microgame.start(ctx); // IMPORTANT: starts the game

			// behaviour that manages microgame
			ctx.onUpdate(() => {
				if (!ware.timeLeft) return;
				if (ware.timePaused) return;
				// bomb and such is not necessary bcause time is undefined
				if (ware.timeLeft == undefined) return;
				if (ware.timeLeft > 0) ware.timeLeft -= k.dt();
				ware.timeLeft = k.clamp(ware.timeLeft, 0, 20);

				// When there's 4 beats left
				const beatInterval = 60 / (140 * ware.speed);
				if (ware.timeLeft <= beatInterval * 4 && currentBomb == null) {
					if (ctx.winState == true) return;
					currentBomb = addBomb(app);
					currentBomb.lit(140 * ware.speed);
				}

				if (ware.timeLeft <= 0 && !ware.timePaused) {
					ware.timePaused = true;
					ware.onTimeOutEvents.trigger();
					if (!currentBomb.hasExploded && !ctx.winState) currentBomb.explode();
				}
			});
		});

		transition.onStageStart("speed", () => {
			// this changes the speedDivisor thing, check the engine
			ware.speed = ware.increaseSpeed();
		});

		transition.onTransitionEnd(() => {
			// when the transition is unpause the scene and start counting the time (also cancel transition events)
			app.paused = false;
			ware.timePaused = false;
			app.sceneObj.paused = false;
			transition.ctx.cancel(); // clear the transCtx
			cursor.canPoint = true;
			cursor.fadeAway = gameHidesMouse(microgame);
		});

		// makes the transition happen and kickstarts the whole process
		transition.trigger(stages, {
			difficulty: ware.difficulty,
			lives: ware.lives,
			score: ware.score,
			speed: ware.speed,
			input: getGameInput(microgame),
			prompt: microgame.prompt,
			ctx: ctx,
		});

		ware.winState = undefined;
		ware.onTimeOutEvents.add(() => app.inputs.paused = true); // pauses inputs when the time is over
	}

	ware.winGame = () => {
		ware.winState = true;
		currentBomb?.extinguish();
	};

	ware.loseGame = () => {
		ware.winState = false;
		currentBomb?.explode();
		ware.lives--;
	};

	ware.finishGame = () => {
		// this runs when someone calls the game to be over (ctx.finish())
		if (ware.winState == undefined) throw new Error("Finished microgame without setting the win condition!! Please call ctx.win() or ctx.lose() before calling ctx.finish()");
		runNextGame();
	};

	runNextGame();

	// start the game around here
});

const goGame = (opts?: KAPLAYwareOpts) => k.go("game", opts);
export default goGame;
