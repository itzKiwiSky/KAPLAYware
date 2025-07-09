import k from "../../engine";
import cursor from "../../plugins/cursor";
import { createWareApp } from "./app";
import { createGameCtx } from "./context/game";
import { KAPLAYwareOpts } from "./kaplayware";
import { addBomb, WareBomb } from "./objects/bomb";
import chillTransition from "./transitions/chill";
import { createTransition, TransitionStage } from "./transitions/makeTransition";
import { gameHidesMouse, getGameByID, getGameColor, getGameDuration, getGameID, getGameInput } from "./utils";
import { createWareEngine } from "./ware";

k.scene("game", (kaplaywareOpt: KAPLAYwareOpts) => {
	const app = createWareApp();
	const transition = createTransition(chillTransition, app);
	const ware = createWareEngine(kaplaywareOpt);
	let currentBomb: WareBomb = null;

	k.onUpdate(() => {
		app.handleQuickWatch();

		// toggle the pause on the app
		if (k.isKeyPressed("escape")) {
			app.paused = !app.paused;
			transition.ctx.paused = app.paused;
		}
	});

	function clearPrevious() {
		app.clearAll();
		app.resetCamera();
		app.sceneObj.removeAll();
		// fixed objs are added to root so they're not affected by camera (parent of sceneObj)
		app.rootObj.get("fixed").forEach((obj) => obj.destroy());
		// currentBomb?.destroy(); // TODO: do bomb stuff
		k.setGravity(0);
	}

	function nextGame() {
		ware.score++;

		// pauses the unimportant and unpauses transition and other stuff
		app.paused = true;
		app.rootObj.paused = false;
		app.draws.paused = false;
		app.sceneObj.paused = true;
		ware.timePaused = true;
		transition.ctx.paused = false;
		clearPrevious();

		// chooses the next minigame
		const microgame = getGameByID("amyspark-ng:test");
		const ctx = createGameCtx(microgame, app, ware);
		const duration = getGameDuration(microgame, ctx);

		// // prepares
		// ctx.setRGB(getGameColor(microgame, ctx));
		// ware.microgameHistory[ware.score - 1] = getGameID(microgame);
		// ware.difficulty = ware.getDifficulty();
		// ware.timeLeft = duration != undefined ? duration / ware.speed : undefined;
		// ware.curDuration = duration;
		// cursor.fadeAway = gameHidesMouse(microgame);
		// currentBomb = null;
		// microgame.start(ctx); // IMPORTANT: starts the game

		// // behaviour that manages microgame
		// ctx.onUpdate(() => {
		// 	if (!ware.timeLeft) return;
		// 	if (ware.timePaused) return;
		// 	// bomb and such is not necessary bcause time is undefined
		// 	if (ware.timeLeft == undefined) return;
		// 	if (ware.timeLeft > 0) ware.timeLeft -= k.dt();
		// 	ware.timeLeft = k.clamp(ware.timeLeft, 0, 20);

		// 	// When there's 4 beats left
		// 	const beatInterval = 60 / (140 * ware.speed);
		// 	if (ware.timeLeft <= beatInterval * 4 && currentBomb == null) {
		// 		currentBomb = addBomb(app);
		// 		currentBomb.lit(140 * ware.speed);
		// 	}

		// 	if (ware.timeLeft <= 0 && !ware.timePaused) {
		// 		ware.timePaused = true;
		// 		ware.onTimeOutEvents.trigger();
		// 		if (!currentBomb.hasExploded) currentBomb.explode();
		// 	}
		// });

		// // makes the transition happen
		// transition.trigger(ware.getTransitionStages(), {
		// 	difficulty: ware.difficulty,
		// 	lives: ware.lives,
		// 	score: ware.score,
		// 	speed: ware.speed,
		// 	input: getGameInput(microgame),
		// 	prompt: microgame.prompt,
		// 	ctx: ctx,
		// });

		// transition.onStageStart("speed", () => ware.speed = ware.increaseSpeed());
		// transition.onTransitionEnd(() => {
		// 	// when the transition is unpause the scene and start counting the time (also cancel transition events)
		// 	app.paused = false;
		// 	ware.timePaused = false;
		// 	app.sceneObj.paused = false;
		// 	transition.ctx.cancel(); // clear the transCtx
		// 	cursor.canPoint = true;
		// 	cursor.fadeAway = gameHidesMouse(microgame);
		// });

		// ware.winState = undefined; // reset it after transition so it does the win and lose
		// ware.onTimeOutEvents.add(() => app.inputs.paused = true); // pauses inputs when the time is over
	}

	nextGame();

	// start the game around here
});

const goGame = (opts?: KAPLAYwareOpts) => k.go("game", opts);
export default goGame;
