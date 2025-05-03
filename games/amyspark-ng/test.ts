import Minigame from "../../src/scenes/game/minigameType";

const testGame: Minigame = {
	author: "amyspark-ng",
	prompt: "TEST!",
	input: "keys",
	rgb: [255, 255, 255],
	duration: 4,
	urlPrefix: "games/amyspark-ng/assets/",
	load(ctx) {},
	start(ctx) {
		const bean = ctx.add([
			ctx.sprite("@bean"),
			ctx.pos(),
		]);

		const timeText = ctx.add([
			ctx.text(""),
			ctx.pos(ctx.center()),
			ctx.anchor("center"),
		]);

		ctx.onUpdate(() => {
			timeText.text = ctx.timeLeft.toFixed(2);
		});

		ctx.onUpdate(() => {
			ctx.setRGB(ctx.lerp(ctx.getRGB(), ctx.winState == true ? ctx.mulfok.GREEN : ctx.winState == false ? ctx.mulfok.RED : ctx.WHITE, 0.5));

			const angle = (ctx.time() * ctx.speed) % 360;
			const spinCamera = ctx.vec2(40 * Math.cos(angle), 40 * Math.sin(angle));
			ctx.setCamPos(ctx.center().add(spinCamera));
		});

		// TODO: add more things to test, camera, fixed, music, timeLeft, input, onDraw overloads, winState, etc

		ctx.onTimeout(() => {
			ctx.win();
			ctx.wait(1, () => {
				ctx.finish();
			});
		});

		ctx.onClick(() => {
			ctx.flashCam(ctx.GREEN, 0.5);
			if (ctx.winState != undefined) return;
			ctx.win();
			ctx.wait(1, () => {
				ctx.finish();
			});
		});
	},
};

export default testGame;
