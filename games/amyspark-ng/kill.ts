import { Minigame } from "../../src/game/types";

// TODO: Do the whole squid cool game
const killGame: Minigame = {
	author: "amyspark-ng",
	prompt: "KILL!",
	isBoss: true,
	urlPrefix: "games/amyspark-ng/assets/",
	load(ctx) {},
	start(ctx) {
		const bean = ctx.add([
			ctx.sprite("@bean"),
			ctx.pos(ctx.center()),
			ctx.area(),
		]);

		bean.onClick(() => {
			bean.destroy();
			ctx.win();
			ctx.finish();
		});
	},
};

export default killGame;
