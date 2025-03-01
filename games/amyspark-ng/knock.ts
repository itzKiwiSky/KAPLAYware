import { assets } from "@kaplayjs/crew";
import { Minigame } from "../../src/types";

const newGame: Minigame = {
	prompt: "knock",
	usesMouse: true,
	author: "amyspark-ng",
	rgb: [74, 48, 82],
	urlPrefix: "/games/amyspark-ng/assets",
	load(ctx) {
		ctx.loadSprite("bean", assets.bean.sprite);
		ctx.loadSprite("door", "/sprites/door.png");
	},
	start(ctx) {
		const game = ctx.make([ctx.timer()]);

		let knocksLeft = ctx.randi(4, 5);
		if (ctx.difficulty == 1) knocksLeft = ctx.randi(2, 4);
		else if (ctx.difficulty == 2) knocksLeft = ctx.randi(4, 6);
		else if (ctx.difficulty == 3) knocksLeft = ctx.randi(6, 8);

		const door = game.add([
			ctx.sprite("door"),
			ctx.anchor("center"),
			ctx.pos(ctx.center()),
			ctx.scale(2),
			ctx.area(),
		]);

		ctx.onClickPress(() => {
			if (!door.isHovering()) return;
			ctx.debug.log(knocksLeft);

			if (knocksLeft > 0) {
				knocksLeft--;
				return;
			}
			else if (knocksLeft == 0) {
				door.destroy();

				const bean = game.add([
					ctx.sprite("bean"),
					ctx.pos(ctx.center()),
					ctx.scale(3),
					ctx.anchor("center"),
				]);

				const WHATTEXT = game.add([
					ctx.text("WHAT"),
					ctx.pos(bean.pos.add(0, bean.height)),
				]);

				ctx.win();

				game.wait(1, () => {
					ctx.finish();
				});
			}
		});

		ctx.onTimeout(() => {
			if (knocksLeft > 0) ctx.lose();
			game.wait(1, () => {
				ctx.finish();
			});
		});

		return game;
	},
};

export default newGame;
