import { Minigame } from "../../src/game/types";

const testGame: Minigame = {
	author: "amyspark-ng",
	prompt: "TEST!",
	input: "keys",
	rgb: [255, 255, 255],
	duration: 4,
	urlPrefix: "games/amyspark-ng/assets/",
	load(ctx) {},
	start(ctx) {
		const bean = ctx.add([
			ctx.sprite("@bean"),
			ctx.pos(),
		]);

		ctx.onUpdate(() => {
			// ctx.debug.log(ctx.timeLeft);
			ctx.debug.log(ctx.winState);
		});

		// TODO: add more things to test, music, timeLeft, input, onDraw overloads, winState, etc

		// bean.onUpdate(() => {
		ctx.debug.log("i'm alive!!!"); // This will run the moment you do game.start(ctx)
		// })

		ctx.onTimeout(() => {
			ctx.win();
			ctx.wait(1, () => {
				ctx.finish();
			});
		});

		ctx.onClick(() => {
			ctx.flashCam(ctx.GREEN, 0.5);
			if (ctx.winState != undefined) return;
			ctx.win();
			ctx.wait(1, () => {
				ctx.finish();
			});
		});
	},
};

export default testGame;
