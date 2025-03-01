import { assets } from "@kaplayjs/crew";
import { Minigame } from "../../src/types";

const getGame: Minigame = {
	prompt: "get",
	author: "amyspark-ng",
	rgb: [133, 97, 97],
	urlPrefix: "",
	load(ctx) {
		ctx.loadSprite("bean", assets.bean.sprite);
		ctx.loadSprite("beant", assets.beant.sprite);
		ctx.loadSprite("apple", assets.apple.sprite);
	},
	start(ctx) {
		const game = ctx.make([ctx.timer()]);
		const SPEED = 5 * ctx.speed;

		const bean = game.add([
			ctx.sprite("bean"),
			ctx.pos(),
			ctx.area(),
			ctx.anchor("center"),
		]);

		const apple = game.add([
			ctx.sprite("apple"),
			ctx.pos(),
			ctx.area(),
			"apple",
		]);

		// TODO: Fix this
		const getBeanPos = () => ctx.vec2(ctx.rand(0, ctx.width() - bean.width), ctx.rand(0, ctx.height() - bean.height));
		const getApplePos = () => {
			const randOffset = ctx.difficulty == 1
				? ctx.vec2(ctx.rand(60, 80), ctx.rand(60, 80))
				: ctx.difficulty == 2
				? ctx.vec2(ctx.rand(40, 60), ctx.rand(40, 60))
				: ctx.difficulty == 3
				? ctx.vec2(ctx.rand(60, 70), ctx.rand(60, 70))
				: ctx.vec2();
			return bean.pos.add(randOffset);
		};

		bean.pos = getBeanPos();
		apple.pos = getApplePos();

		bean.onUpdate(() => {
			bean.pos.x = ctx.clamp(bean.pos.x, -bean.width / 2, ctx.width() + bean.width / 2);
			bean.pos.y = ctx.clamp(bean.pos.y, -bean.height / 2, ctx.height() + bean.height / 2);
		});

		ctx.onButtonDown("left", () => bean.pos.x -= SPEED);

		ctx.onButtonDown("right", () => {
			bean.pos.x += SPEED * ctx.speed;
		});

		ctx.onButtonDown("down", () => {
			bean.pos.y += SPEED * ctx.speed;
		});

		ctx.onButtonDown("up", () => {
			bean.pos.y -= SPEED * ctx.speed;
		});

		bean.onCollide("apple", () => {
			apple.destroy();
			ctx.win();
			ctx.burp().onEnd(() => {
				game.wait(0.1, () => {
					ctx.finish();
				});
			});
		});

		ctx.onTimeout(() => {
			if (apple.exists()) {
				bean.sprite = "beant";
				ctx.lose();
				game.wait(0.5, () => ctx.finish());
			}
		});

		return game;
	},
};

export default getGame;
