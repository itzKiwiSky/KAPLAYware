import { Minigame } from "../../src/game/types";

const testGame: Minigame = {
	prompt: "test",
	author: "amyspark-ng",
	duration: 4,
	urlPrefix: "games/amyspark-ng/assets/",
	load(ctx) {},
	start(ctx) {
		const SPEED = 100; // set a speed the bean will move at
		const bean = ctx.add([
			ctx.sprite("@bean"), // do @ so you can get default assets.
			ctx.pos(ctx.center()), // adds it at the center of the screen.
		]);

		// now we move it with the input buttons
		ctx.onInputButtonDown("left", () => bean.move(-SPEED, 0));
		ctx.onInputButtonDown("down", () => bean.move(0, SPEED));
		ctx.onInputButtonDown("up", () => bean.move(0, -SPEED));
		ctx.onInputButtonDown("right", () => bean.move(SPEED, 0));
	},
};

export default testGame;
