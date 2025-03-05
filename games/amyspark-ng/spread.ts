import { Outline } from "kaplay";
import mulfokColors from "../../src/plugins/colors";
import { Minigame } from "../../src/types";

const spreadGame: Minigame = {
	prompt: "spread",
	author: "amyspark-ng",
	rgb: mulfokColors.PINK,
	mouse: { hidden: false },
	urlPrefix: "games/amyspark-ng/assets/",
	duration: 4,
	load(ctx) {
	},
	start(ctx) {
		const game = ctx.make();
		let timeOver = false;
		let canSpread = true;
		let hasFinished = false;

		const outline: Outline = {
			width: 30,
			cap: "round",
		};

		const bean = game.add([
			ctx.sprite("@bean"),
			ctx.scale(2),
			ctx.area(),
			ctx.opacity(0),
			ctx.pos(ctx.center()),
			ctx.anchor("center"),
		]);

		const doodles = [[bean.pos]]; // array of Vec2[]
		game.onDraw(() => {
			function drawContent() {
				doodles.forEach((pts) => {
					ctx.drawLines({
						...outline,
						pts: pts,
					});
				});
			}

			function drawMask() {
				ctx.drawSprite({
					sprite: "@bean",
					pos: ctx.center(),
					angle: 0,
					anchor: "center",
					scale: 2,
				});
			}

			ctx.drawMasked(drawMask, drawContent);
		});

		game.onUpdate(() => {
			if (ctx.isMouseMoved() && bean.isHovering() && canSpread) {
				doodles[doodles.length - 1].push(ctx.mousePos());
			}

			const Xs = doodles[0].map((d) => d.x);
			const Ys = doodles[0].map((d) => d.y);
			const minX = Math.min(...Xs) + outline.width / 2;
			const maxX = Math.max(...Xs) + outline.width / 2;
			const minY = Math.min(...Ys) + outline.width / 2;
			const maxY = Math.max(...Ys) + outline.width / 2;

			const jamXLength = maxX - minX;
			const jamYLength = maxY - minY;
			const areaOfJam = jamXLength * jamYLength;
			const areaOfBean = bean.width * bean.scale.x * bean.height * bean.scale.y;
			const areaLeft = areaOfBean - areaOfJam;
			if (areaLeft < 4000 && !hasFinished) {
				hasFinished = true;
				ctx.debug.log("####### look a bean!!");
				ctx.win();
				ctx.wait(0.5 / ctx.speed, () => ctx.finish());
			}

			if (!hasFinished && timeOver) {
				canSpread = false;
				ctx.lose();
				ctx.wait(0.5 / ctx.speed, () => ctx.finish());
			}
		});

		ctx.onTimeout(() => {
			timeOver = true;
		});

		return game;
	},
};

export default spreadGame;
