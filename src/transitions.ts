import { KAPLAYCtx } from "kaplay";
import { Conductor } from "./conductor";
import { addHearts, addScoreText } from "./objects";
import { KaplayWareCtx } from "./types";

export function prepTransition(k: KAPLAYCtx, ware: KaplayWareCtx) {
	const sound = k.play("@prepJingle");
	const conductor = new Conductor(k, sound, 140);

	const bg = k.add([
		k.rect(k.width(), k.height()),
		k.color(k.rgb(50, 156, 64)),
	]);

	conductor.onBeat(() => {
		bean.tween(k.vec2(2.5), k.vec2(2), 0.15, (p) => bean.scale = p, k.easings.easeOutQuint);
		hearts.forEach((heart) => {
			bean.tween(k.vec2(2.5), k.vec2(2), 0.15, (p) => heart.scale = p, k.easings.easeOutQuint);
		});
	});

	const scoreText = addScoreText(k, ware.score);
	const hearts = addHearts(k, ware.lives);

	const bean = k.add([
		k.sprite("@bean"),
		k.scale(2),
		k.anchor("center"),
		k.pos(k.center()),
		k.timer(),
	]);

	return {
		onHalf: (action: () => void) => {
			let event = k.onUpdate(() => {
				if (sound.time() >= sound.duration() / 2 && event) {
					event.cancel();
					event = null;
					action();
				}
			});
		},

		onEnd: (action: () => void) => {
			return sound.onEnd(() => {
				bg.destroy();
				scoreText.destroy();
				bean.destroy();
				conductor.destroy();
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
