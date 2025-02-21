import { assets } from "@kaplayjs/crew";
import { Minigame } from "../../../src/kaplayware";

const newGame: Minigame = {
	prompt: "find",
	author: "lajbel",
	hue: 1,
	urlPrefix: "games/lajbel/assets",
	load(ctx) {
		ctx.loadSprite("bean", assets.bean.sprite);
	},
	start(ctx) {
		const game = ctx.make();

		const bean = game.add([
			ctx.sprite("bean"),
			ctx.pos(),
		]);

		return game;
	},
};

export default newGame;