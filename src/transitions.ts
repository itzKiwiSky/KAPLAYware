import { AudioPlay, KAPLAYCtx } from "kaplay";
import { Conductor } from "./conductor";
import { makeHeart, makeScoreText } from "./objects";
import { KaplayWareCtx } from "./types";

export function runTrans(type: "prep" | "win" | "lose" | "speed", k: KAPLAYCtx, ware: KaplayWareCtx) {
	let sound: AudioPlay = null;
	if (type == "prep") {
		sound = k.play("@prepJingle");
		return prepTransition(k, ware);
	}
}

export function prepTransition(k: KAPLAYCtx, ware: KaplayWareCtx) {
	const SKY_COLOR = k.rgb(141, 183, 255);
	const sound = k.play("@prepJingle", { speed: ware.speed });
	const conductor = new Conductor(k, sound, 140 * ware.speed);
	const transition = k.add([k.timer(), k.scale(), k.pos()]);

	const topBg = transition.add([
		k.rect(k.width(), k.height() / 2),
		k.color(SKY_COLOR),
		k.pos(k.vec2(0, 0)),
	]);

	const botBg = transition.add([
		k.rect(k.width(), k.height() / 2),
		k.color(SKY_COLOR),
		k.pos(0, k.center().y),
	]);

	const cloud = topBg.add([
		k.sprite("@cloud"),
		k.pos(k.vec2(k.rand(10, k.center().x), k.rand(80, 90))),
		k.scale(2),
		k.anchor("center"),
		k.opacity(),
	]);

	cloud.fadeIn(sound.duration() / ware.speed / 4);

	const sun = topBg.add([
		k.sprite("@sun"),
		k.pos(k.vec2(k.width() - 70, 70)),
		k.rotate(0),
		k.anchor("center"),
		k.scale(2),
	]);

	sun.onUpdate(() => {
		cloud.pos.x += 0.25 * ware.speed;
		sun.angle += 0.1 * ware.speed;
	});

	const ground = botBg.add([
		k.sprite("@grass_tile", { tiled: true, width: k.width() }),
		k.color(k.WHITE),
		k.outline(5, k.BLACK),
		k.pos(k.vec2(0, k.height() / 2 - 40)),
	]);

	const bean = ground.add([
		k.sprite("@bean"),
		k.scale(2.5),
		k.anchor("bot"),
		k.pos(k.vec2(k.width() / 2, 0)),
	]);

	const scoreText = topBg.add(makeScoreText(k, ware.score));
	scoreText.pos = k.vec2();

	for (let i = 0; i < ware.lives; i++) {
		const heart = botBg.add(makeHeart(k));
		heart.scale = k.vec2(1.8);
		const HEART_WIDTH = heart.width * heart.scale.x * 1.1;
		const INITIAL_POS = k.vec2(k.center().x - HEART_WIDTH * 1.5, 0);
		heart.pos = INITIAL_POS.add(k.vec2(HEART_WIDTH * i, heart.height * 2));
	}

	const beatHitEV = conductor.onBeat((beat) => {
		const theAngle = beat % 2 == 0 ? -20 : 20;
		// @ts-ignore
		transition.tween(theAngle, theAngle * -1, 0.2, (p) => scoreText.textStyles["a"].angle = p);
		transition.tween(2, 2.5, 0.2, (p) => bean.scale.y = p, k.easings.easeOutQuint);
		botBg.get("heart").forEach((heart: ReturnType<typeof makeHeart>) => {
			transition.tween(1, 1.8, 0.15, (p) => heart.scale.y = p, k.easings.easeOutQuint);
		});
	});

	let soundAtHalf = false;
	let quarterToEnd = false;

	transition.onUpdate(() => {
		if (sound.time() >= sound.duration() / ware.speed / 2 && !soundAtHalf) {
			soundAtHalf = true;
		}

		if (sound.time() >= (sound.duration() / ware.speed / 2 + sound.duration() / ware.speed * 0.25) && !quarterToEnd) {
			quarterToEnd = true;

			const TIME_LEFT = sound.duration() / ware.speed - sound.time();
			transition.tween(topBg.pos.y, -topBg.height, TIME_LEFT, (p) => topBg.pos.y = p, k.easings.easeOutQuint);
			transition.tween(botBg.pos.y, k.height() + botBg.height, TIME_LEFT, (p) => botBg.pos.y = p, k.easings.easeOutQuint);

			beatHitEV.cancel();
		}
	});

	return {
		onHalf: (action: () => void) => {
			let event = k.onUpdate(() => {
				if (sound.time() >= sound.duration() / ware.speed / 2 && event) {
					event.cancel();
					event = null;
					action();
				}
			});
		},

		onEnd: (action: () => void) => {
			const wait = transition.wait(sound.duration() / ware.speed, () => {
				wait.cancel();
				transition.removeAll();
				conductor.destroy();
				action();
			});
			return wait;
		},
	};
}

export function winTransition(k: KAPLAYCtx, ware: KaplayWareCtx) {
	const SKY_COLOR = k.rgb(141, 183, 255);

	const sound = k.play("@winJingle");
	sound.speed = ware.speed;
	const conductor = new Conductor(k, sound, 140 * ware.speed);

	const transition = k.add([k.timer(), k.scale(), k.pos()]);

	const topBg = transition.add([
		k.rect(k.width(), k.height() / 2),
		k.color(SKY_COLOR),
		k.pos(k.vec2(0, 0)),
	]);

	const botBg = transition.add([
		k.rect(k.width(), k.height() / 2),
		k.color(SKY_COLOR),
		k.pos(0, k.center().y),
	]);

	const cloud = topBg.add([
		k.sprite("@cloud"),
		k.pos(k.vec2(k.rand(10, k.center().x), k.rand(80, 90))),
		k.scale(2),
		k.anchor("center"),
		k.opacity(),
	]);

	cloud.fadeIn(sound.duration() / ware.speed / 4);

	const sun = topBg.add([
		k.sprite("@sun"),
		k.pos(k.vec2(k.width() - 70, 70)),
		k.rotate(0),
		k.anchor("center"),
		k.scale(2),
	]);

	sun.onUpdate(() => {
		cloud.pos.x += 0.25 * ware.speed;
		sun.angle += 0.1 * ware.speed;
	});

	const ground = botBg.add([
		k.sprite("@grass_tile", { tiled: true, width: k.width() }),
		k.color(k.WHITE),
		k.outline(5, k.BLACK),
		k.pos(k.vec2(0, k.height() / 2 - 40)),
	]);

	const bean = ground.add([
		k.sprite("@bean"),
		k.scale(2.5),
		k.anchor("bot"),
		k.pos(k.vec2(k.width() / 2, 0)),
	]);

	const scoreText = topBg.add(makeScoreText(k, ware.score));
	scoreText.pos = k.vec2();

	for (let i = 0; i < ware.lives; i++) {
		const heart = botBg.add(makeHeart(k));
		heart.scale = k.vec2(1.8);
		const HEART_WIDTH = heart.width * heart.scale.x * 1.1;
		const INITIAL_POS = k.vec2(k.center().x - HEART_WIDTH * 1.5, 0);
		heart.pos = INITIAL_POS.add(k.vec2(HEART_WIDTH * i, heart.height * 2));
	}

	const beatHitEV = conductor.onBeat((beat) => {
		const theAngle = beat % 2 == 0 ? -20 : 20;
		// @ts-ignore
		transition.tween(theAngle, theAngle * -1, 0.2, (p) => scoreText.textStyles["a"].angle = p);
		transition.tween(2, 2.5, 0.2, (p) => bean.scale.y = p, k.easings.easeOutQuint);
		botBg.get("heart").forEach((heart: ReturnType<typeof makeHeart>) => {
			transition.tween(1, 1.8, 0.15, (p) => heart.scale.y = p, k.easings.easeOutQuint);
		});
	});

	let soundAtHalf = false;
	let quarterToEnd = false;

	transition.onUpdate(() => {
		if (sound.time() >= sound.duration() / ware.speed / 2 && !soundAtHalf) {
			soundAtHalf = true;
		}

		if (sound.time() >= (sound.duration() / ware.speed / 2 + sound.duration() / ware.speed * 0.25) && !quarterToEnd) {
			quarterToEnd = true;

			const TIME_LEFT = sound.duration() / ware.speed - sound.time();
			// transition.tween(topBg.pos.y, -topBg.height, TIME_LEFT, (p) => topBg.pos.y = p, k.easings.easeOutQuint);
			// transition.tween(botBg.pos.y, k.height() + botBg.height, TIME_LEFT, (p) => botBg.pos.y = p, k.easings.easeOutQuint);

			beatHitEV.cancel();
		}
	});

	return {
		onHalf: (action: () => void) => {
			let event = k.onUpdate(() => {
				if (sound.time() >= sound.duration() / ware.speed / 2 && event) {
					event.cancel();
					event = null;
					action();
				}
			});
		},

		onEnd: (action: () => void) => {
			const wait = transition.wait(sound.duration() / ware.speed, () => {
				wait.cancel();
				transition.removeAll();
				conductor.destroy();
				action();
			});
			return wait;
		},
	};
}

export function loseTransition(k: KAPLAYCtx, ware: KaplayWareCtx) {
	const SKY_COLOR = k.rgb(60, 92, 148);
	const HAPPY_SKY_COLOR = k.rgb(141, 183, 255);

	const sound = k.play("@loseJingle");
	sound.speed = ware.speed;
	const conductor = new Conductor(k, sound, 140 * ware.speed);

	const transition = k.add([k.timer(), k.scale(), k.pos()]);

	const topBg = transition.add([
		k.rect(k.width(), k.height() / 2),
		k.color(SKY_COLOR),
		k.pos(k.vec2(0, 0)),
	]);

	const botBg = transition.add([
		k.rect(k.width(), k.height() / 2),
		k.color(SKY_COLOR),
		k.pos(0, k.center().y),
	]);

	const cloud = topBg.add([
		k.sprite("@cloud"),
		k.pos(k.vec2(k.rand(10, k.center().x), k.rand(80, 90))),
		k.scale(2),
		k.anchor("center"),
		k.z(1),
		k.opacity(),
	]);

	const sun = topBg.add([
		k.sprite("@sun"),
		k.pos(k.vec2(k.width() - 70, 70)),
		k.rotate(0),
		k.anchor("center"),
		k.scale(2),
	]);

	sun.onUpdate(() => {
		cloud.pos = sun.pos;
		sun.angle += 0.1 * ware.speed;
	});

	const ground = botBg.add([
		k.sprite("@grass_tile", { tiled: true, width: k.width() }),
		k.color(k.WHITE),
		k.outline(5, k.BLACK),
		k.pos(k.vec2(0, k.height() / 2 - 40)),
	]);

	const bean = ground.add([
		k.sprite("@beant"),
		k.scale(2.5),
		k.anchor("bot"),
		k.pos(k.vec2(k.width() / 2, 0)),
	]);

	const scoreText = topBg.add(makeScoreText(k, ware.score));
	scoreText.pos = k.vec2();

	for (let i = 0; i < k.clamp(ware.lives + 1, 0, 4); i++) {
		const heart = botBg.add(makeHeart(k));
		heart.scale = k.vec2(1.8);
		const HEART_WIDTH = heart.width * heart.scale.x * 1.1;
		const INITIAL_POS = k.vec2(k.center().x - HEART_WIDTH * 1.5, 0);
		heart.pos = INITIAL_POS.add(k.vec2(HEART_WIDTH * i, heart.height * 2));
	}

	botBg.get("heart")[botBg.get("heart").length - 1].kill();

	const beatHitEV = conductor.onBeat((beat) => {
		const theAngle = beat % 2 == 0 ? -20 : 20;
	});

	let soundAtHalf = false;
	let quarterToEnd = false;

	transition.onUpdate(() => {
		if (sound.time() >= sound.duration() / ware.speed / 2 && !soundAtHalf) {
			soundAtHalf = true;
		}

		if (sound.time() >= (sound.duration() / ware.speed / 2 + sound.duration() / ware.speed * 0.25) && !quarterToEnd) {
			quarterToEnd = true;
			const TIME_LEFT = sound.duration() / ware.speed - sound.time();
			cloud.fadeOut(TIME_LEFT);
			transition.tween(topBg.color, HAPPY_SKY_COLOR, TIME_LEFT, (p) => topBg.color = p);
			transition.tween(botBg.color, HAPPY_SKY_COLOR, TIME_LEFT, (p) => botBg.color = p);

			beatHitEV.cancel();
		}
	});

	transition.tween(-topBg.height, 0, sound.duration() / ware.speed / 4, (p) => topBg.pos.y = p, k.easings.easeOutQuint);
	transition.tween(k.height() + botBg.height, k.height() / 2, sound.duration() / ware.speed / 4, (p) => botBg.pos.y = p, k.easings.easeOutQuint);

	return {
		onHalf: (action: () => void) => {
			let event = k.onUpdate(() => {
				if (sound.time() >= sound.duration() / ware.speed / 2 && event) {
					event.cancel();
					event = null;
					action();
				}
			});
		},

		onEnd: (action: () => void) => {
			const wait = transition.wait(sound.duration() / ware.speed, () => {
				wait.cancel();
				transition.removeAll();
				conductor.destroy();
				action();
			});
			return wait;
		},
	};
}

export function speedupTransition(k: KAPLAYCtx, ware: KaplayWareCtx) {
	let SKY_COLOR = k.rgb(141, 183, 255);

	const sound = k.play("@speedJingle");
	sound.speed = ware.speed;
	const conductor = new Conductor(k, sound, 140 * ware.speed);

	const transition = k.add([k.timer(), k.scale(), k.pos()]);

	const topBg = transition.add([
		k.rect(k.width(), k.height() / 2),
		k.color(SKY_COLOR),
		k.pos(k.vec2(0, 0)),
	]);

	const botBg = transition.add([
		k.rect(k.width(), k.height() / 2),
		k.color(SKY_COLOR),
		k.pos(0, k.center().y),
	]);

	transition.onUpdate(() => {
		SKY_COLOR = k.hsl2rgb((k.time() * 0.2) % 1, 0.7, 0.8);
		topBg.color = SKY_COLOR;
		botBg.color = SKY_COLOR;
	});

	const cloud = topBg.add([
		k.sprite("@cloud"),
		k.pos(k.vec2(k.rand(10, k.center().x), k.rand(80, 90))),
		k.scale(2),
		k.anchor("center"),
		k.opacity(),
	]);

	cloud.fadeIn(sound.duration() / ware.speed / 4);

	const sun = topBg.add([
		k.sprite("@sun"),
		k.pos(k.vec2(k.width() - 70, 70)),
		k.rotate(0),
		k.anchor("center"),
		k.scale(2),
	]);

	sun.onUpdate(() => {
		cloud.pos.x += 0.25 * ware.speed;
		sun.angle += 0.1 * ware.speed;
	});

	const ground = botBg.add([
		k.sprite("@grass_tile", { tiled: true, width: k.width() }),
		k.color(k.WHITE),
		k.outline(5, k.BLACK),
		k.pos(k.vec2(0, k.height() / 2 - 40)),
	]);

	const bean = ground.add([
		k.sprite("@bean"),
		k.scale(2.5),
		k.anchor("bot"),
		k.pos(k.vec2(k.width() / 2, 0)),
	]);

	const scoreText = topBg.add(makeScoreText(k, ware.score));
	scoreText.pos = k.vec2();

	for (let i = 0; i < ware.lives; i++) {
		const heart = botBg.add(makeHeart(k));
		heart.scale = k.vec2(1.8);
		const HEART_WIDTH = heart.width * heart.scale.x * 1.1;
		const INITIAL_POS = k.vec2(k.center().x - HEART_WIDTH * 1.5, 0);
		heart.pos = INITIAL_POS.add(k.vec2(HEART_WIDTH * i, heart.height * 2));
	}

	const beatHitEV = conductor.onBeat((beat) => {
		const theAngle = beat % 2 == 0 ? -20 : 20;
		// @ts-ignore
		transition.tween(theAngle, theAngle * -1, 0.2, (p) => scoreText.textStyles["a"].angle = p);
		transition.tween(2, 2.5, 0.2, (p) => bean.scale.y = p, k.easings.easeOutQuint);
		botBg.get("heart").forEach((heart: ReturnType<typeof makeHeart>) => {
			transition.tween(1, 1.8, 0.15, (p) => heart.scale.y = p, k.easings.easeOutQuint);
		});
	});

	let soundAtHalf = false;
	let quarterToEnd = false;

	transition.onUpdate(() => {
		if (sound.time() >= sound.duration() / ware.speed / 2 && !soundAtHalf) {
			soundAtHalf = true;
		}

		if (sound.time() >= (sound.duration() / ware.speed / 2 + sound.duration() / ware.speed * 0.25) && !quarterToEnd) {
			quarterToEnd = true;
			beatHitEV.cancel();
		}
	});

	return {
		onHalf: (action: () => void) => {
			let event = k.onUpdate(() => {
				if (sound.time() >= sound.duration() / ware.speed / 2 && event) {
					event.cancel();
					event = null;
					action();
				}
			});
		},

		onEnd: (action: () => void) => {
			const wait = transition.wait(sound.duration() / ware.speed, () => {
				wait.cancel();
				transition.removeAll();
				conductor.destroy();
				action();
			});
			return wait;
		},
	};
}
