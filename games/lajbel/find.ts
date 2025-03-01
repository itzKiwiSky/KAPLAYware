import { assets } from "@kaplayjs/crew";
import { Minigame } from "../../src/types.ts";

const newGame: Minigame = {
	prompt: "find",
	author: "lajbel",
	rgb: [1, 1, 1],
	urlPrefix: "games/lajbel/assets",
	load(ctx) {
		ctx.loadSprite("bean", assets.bean.sprite);
	},
	start(ctx) {
		const game = ctx.make([ctx.timer()]);

		const bean = game.add([
			ctx.sprite("bean"),
			ctx.pos(),
		]);

		return game;
	},
};

export default newGame;
