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
			ctx.debug.log(ctx.timeLeft);
		});

		// bean.onUpdate(() => {
		// 	ctx.debug.log("i'm alive!!!")
		// })

		ctx.onClick(() => {
			ctx.win();
		});
	},
};

export default testGame;
