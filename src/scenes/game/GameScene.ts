import k from "../../engine";
import cursor from "../../plugins/cursor";
import { createWareApp } from "./app";
import { createGameCtx } from "./context/game";
import { KAPLAYwareOpts } from "./kaplayware";
import { addBomb, WareBomb } from "./objects/bomb";
import chillTransition from "./transitions/chill";
import { createTransition } from "./transitions/makeTransition";
import { gameHidesMouse, getGameByID, getGameColor, getGameDuration, getGameID, getGameInput } from "./utils";
import { createWareEngine } from "./ware";

k.scene("game", (kaplaywareOpt: KAPLAYwareOpts) => {
	const app = createWareApp();
	const transition = createTransition(chillTransition, app);
	const ware = createWareEngine(kaplaywareOpt);
	let gamePaused = false;
	let currentBomb: WareBomb = null;

	k.onUpdate(() => {
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

	k.add([k.z(10)]).onDraw(() => {
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
		// fixed objs are added to root so they're not affected by camera (parent of sceneObj)
		app.rootObj.get("fixed").forEach((obj) => obj.destroy());
		currentBomb?.destroy();
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

		// chooses the next minigame
		const microgame = getGameByID("amyspark-ng:test");
		const ctx = createGameCtx(microgame, app, ware);
		const duration = getGameDuration(microgame, ctx);

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
				currentBomb = addBomb(app);
				currentBomb.lit(140 * ware.speed);
			}

			if (ware.timeLeft <= 0 && !ware.timePaused) {
				ware.timePaused = true;
				ware.onTimeOutEvents.trigger();
				if (!currentBomb.hasExploded) currentBomb.explode();
			}
		});

		// makes the transition happen
		transition.trigger(ware.getTransitionStages(), {
			difficulty: ware.difficulty,
			lives: ware.lives,
			score: ware.score,
			speed: ware.speed,
			input: getGameInput(microgame),
			prompt: microgame.prompt,
			ctx: ctx,
		});

		transition.onStageStart("speed", () => ware.speed = ware.increaseSpeed());
		transition.onTransitionEnd(() => {
			// when the transition is unpause the scene and start counting the time (also cancel transition events)
			app.paused = false;
			ware.timePaused = false;
			app.sceneObj.paused = false;
			transition.ctx.cancel(); // clear the transCtx
			cursor.canPoint = true;
			cursor.fadeAway = gameHidesMouse(microgame);
		});

		ware.winState = undefined; // reset it after transition so it does the win and lose
		ware.onTimeOutEvents.add(() => app.inputs.paused = true); // pauses inputs when the time is over
	}

	ware.winGame = () => ware.winState = true;
	ware.loseGame = () => ware.winState = false;
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
