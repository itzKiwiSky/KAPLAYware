import { assets } from "@kaplayjs/crew";
import { Minigame } from "../../src/kaplayware";

const getGame: Minigame = {
	prompt: "GET!",
	author: "amyspark-ng",
	hue: 1,
	urlPrefix: "",
	onLoad(ctx) {
		ctx.loadSprite("bean", assets.bean.sprite);
		ctx.loadSprite("beant", assets.beant.sprite);
		ctx.loadSprite("apple", assets.apple.sprite);
	},
	onStart(ctx) {
		const game = ctx.make();
		const SPEED = 5;

		const bean = game.add([
			ctx.sprite("bean"),
			ctx.pos(),
			ctx.area(),
		]);

		const apple = game.add([
			ctx.sprite("apple"),
			ctx.pos(),
			ctx.area(),
			"apple",
		]);

		bean.pos = ctx.vec2(ctx.rand(0, ctx.width()), ctx.rand(0, ctx.height()));
		apple.pos = ctx.vec2(ctx.rand(0, ctx.width()), ctx.rand(0, ctx.height()));

		ctx.onButtonDown("left", () => {
			bean.pos.x -= SPEED;
		});

		ctx.onButtonDown("right", () => {
			bean.pos.x += SPEED;
		});

		ctx.onButtonDown("down", () => {
			bean.pos.y += SPEED;
		});

		ctx.onButtonDown("up", () => {
			bean.pos.y -= SPEED;
		});

		bean.onCollide("apple", () => {
			apple.destroy();
			ctx.win();
			ctx.burp().onEnd(() => {
				ctx.wait(0.1, () => {
					ctx.finish();
				});
			});
		});

		ctx.onTimeout(() => {
			if (apple.exists()) {
				// TODO: Find a way to override the setter and getter
				bean.sprite = "amyspark-ng:GET!beant";
				ctx.lose();
				ctx.wait(0.5, () => ctx.finish());
			}
		});

		return game;
	},
};

export default getGame;
