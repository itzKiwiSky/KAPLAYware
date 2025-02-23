import kaplay, { GameObj, KAPLAYCtx } from "kaplay";
import { KaplayWareCtx } from "./kaplayware";
import { addHearts, addScoreText } from "./objects";

export function prepTransition(k: KAPLAYCtx, ware: KaplayWareCtx) {
	const sound = k.play("@prepJingle");

	const bg = k.add([
		k.rect(k.width(), k.height()),
		k.color(k.rgb(50, 156, 64)),
	]);

	const scoreText = addScoreText(k, ware.score);
	const hearts = addHearts(k, ware.lives);
	const bean = k.add([
		k.sprite("@bean"),
		k.scale(2),
		k.anchor("center"),
		k.pos(k.center()),
	]);

	return {
		onEnd: (action: () => void) => {
			sound.onEnd(() => {
				bg.destroy();
				scoreText.destroy();
				bean.destroy();
				hearts.forEach((heart) => heart.destroy());
				action();
			});
		},
	};
}

export function winTransition(k: KAPLAYCtx, ware: KaplayWareCtx) {
	const sound = k.play("@winJingle");

	const bg = k.add([
		k.rect(k.width(), k.height()),
		k.color(k.rgb(77, 255, 100)),
	]);

	const scoreText = addScoreText(k, ware.score);
	const hearts = addHearts(k, ware.lives);
	const bean = k.add([
		k.sprite("@bean"),
		k.scale(2),
		k.anchor("center"),
		k.pos(k.center()),
	]);

	return {
		onEnd: (action: () => void) => {
			sound.onEnd(() => {
				bg.destroy();
				scoreText.destroy();
				bean.destroy();
				hearts.forEach((heart) => heart.destroy());
				action();
			});
		},
	};
}

export function loseTransition(k: KAPLAYCtx, ware: KaplayWareCtx) {
	const sound = k.play("@loseJingle");

	const bg = k.add([
		k.rect(k.width(), k.height()),
		k.color(k.rgb(57, 81, 150)),
	]);

	const scoreText = addScoreText(k, ware.score);
	const hearts = addHearts(k, k.clamp(ware.lives + 1, 0, 4));
	hearts[hearts.length - 1].fadeOut(0.1);
	const beant = k.add([
		k.sprite("@beant"),
		k.scale(2),
		k.anchor("center"),
		k.pos(k.center()),
	]);

	return {
		onEnd: (action: () => void) => {
			sound.onEnd(() => {
				bg.destroy();
				scoreText.destroy();
				beant.destroy();
				hearts.forEach((heart) => heart.destroy());
				action();
			});
		},
	};
}

function speedupTransition(k: KAPLAYCtx, ware: KaplayWareCtx) {
	const sound = k.play("@speedJingle");
	return {
		onEnd: (action: () => void) => {
			sound.onEnd(() => {
				// bg.destroy();
				// bean.destroy();
				// hearts.forEach((heart) => heart.destroy());
				action();
			});
		},
	};
}
