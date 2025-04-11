import { Minigame } from "../../src/game/types";

const killGame: Minigame = {
	author: "amyspark-ng",
	prompt: "KILL!",
	difficulty: "BOSS",
	urlPrefix: "games/amyspark-ng/assets/",
	load(ctx) {},
	start(ctx) {
		const bean = ctx.add([
			ctx.sprite("@bean"),
			ctx.pos(),
		]);
	},
};

export default killGame;
