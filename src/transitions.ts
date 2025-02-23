import { KAPLAYCtx } from "kaplay";
import { Conductor } from "./conductor";
import { addHearts, addScoreText } from "./objects";
import { KaplayWareCtx } from "./types";

export function prepTransition(k: KAPLAYCtx, ware: KaplayWareCtx) {
	const sound = k.play("@prepJingle");
	const conductor = new Conductor(k, sound, 140);

	const bg = k.add([
		k.rect(k.width(), k.height()),
		k.color(k.rgb(141, 183, 255)),
	]);

	const ground = k.add([
		k.rect(k.width(), 40),
		k.color(k.WHITE),
		k.outline(5, k.BLACK),
		k.pos(k.vec2(0, k.height() - 40)),
	]);

	const bean = k.add([
		k.sprite("@bean"),
		k.scale(2.5),
		k.anchor("bot"),
		k.pos(k.center().x, k.height() - 40),
		k.timer(),
	]);

	const scoreText = addScoreText(k, ware.score);
	scoreText.pos = k.vec2();
	const hearts = addHearts(k, ware.lives);

	const beatHitEV = conductor.onBeat((beat) => {
		bean.tween(2, 2.5, 0.2, (p) => bean.scale.y = p, k.easings.easeOutQuint);
		const theAngle = beat % 2 == 0 ? -20 : 20;
		// @ts-ignore
		bean.tween(theAngle, theAngle * -1, 0.2, (p) => scoreText.textStyles["a"].angle = p);
	});

	let evForFinishing = k.onUpdate(() => {
		if (sound.time() >= (sound.duration() / 2 + sound.duration() * 0.25) && evForFinishing) {
			evForFinishing.cancel();
			evForFinishing = null;
			beatHitEV.cancel();
			bean.tween(bean.scale, k.vec2(22), 0.15, (p) => bean.scale = p);
		}
	});

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
				ground.destroy();
				conductor.destroy();
				hearts.forEach((heart) => heart.destroy());
				action();
			});
		},
	};
}

export function winTransition(k: KAPLAYCtx, ware: KaplayWareCtx) {
	const sound = k.play("@winJingle");
	const conductor = new Conductor(k, sound, 140);

	const bg = k.add([
		k.rect(k.width(), k.height()),
		k.color(k.rgb(141, 183, 255)),
	]);

	const ground = k.add([
		k.rect(k.width(), 40),
		k.color(k.WHITE),
		k.outline(5, k.BLACK),
		k.pos(k.vec2(0, k.height() - 40)),
	]);

	const bean = k.add([
		k.sprite("@bean"),
		k.scale(2.5),
		k.anchor("bot"),
		k.pos(k.center().x, k.height() - 40),
		k.timer(),
		k.opacity(),
	]);

	bean.scale = k.vec2(40);
	bean.pos = k.center();
	bean.fadeIn(0.05);
	bean.tween(bean.scale, k.vec2(2.5), 0.1, (p) => bean.scale = p);
	bean.tween(bean.pos, k.vec2(k.center().x, k.height() - 40), 0.1, (p) => bean.pos = p);

	const scoreText = addScoreText(k, ware.score);
	scoreText.pos = k.vec2();
	const hearts = addHearts(k, ware.lives);

	const beatHitEV = conductor.onBeat((beat) => {
		bean.tween(2, 2.5, 0.2, (p) => bean.scale.y = p, k.easings.easeOutQuint);
		const theAngle = beat % 2 == 0 ? -20 : 20;
		// @ts-ignore
		bean.tween(theAngle, theAngle * -1, 0.2, (p) => scoreText.textStyles["a"].angle = p);
	});

	let evForFinishing = k.onUpdate(() => {
		if (sound.time() >= (sound.duration() / 2 + sound.duration() * 0.25) && evForFinishing) {
			evForFinishing.cancel();
			evForFinishing = null;
			beatHitEV.cancel();
			bean.tween(bean.scale, k.vec2(22), 0.15, (p) => bean.scale = p);
		}
	});

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
				ground.destroy();
				conductor.destroy();
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
			return sound.onEnd(() => {
				bg.destroy();
				scoreText.destroy();
				beant.destroy();
				hearts.forEach((heart) => heart.destroy());
				action();
			});
		},
		onHalf: (action: () => void) => {
			return;
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
