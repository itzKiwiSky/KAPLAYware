import { Minigame } from "../../src/game/types";

const testGame: Minigame = {
	author: "amyspark-ng",
	prompt: "TEST!",
	input: "keys",
	duration: 4,
	urlPrefix: "games/amyspark-ng/assets/",
	load(ctx) {},
	start(ctx) {
		const bean = ctx.add([
			ctx.sprite("@bean"),
			ctx.pos(),
		]);

		ctx.onClick(() => {
			ctx.win();
		});
	},
};

export default testGame;
