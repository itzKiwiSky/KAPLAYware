import { assets, crew } from "@kaplayjs/crew";
import { GameObj, KAPLAYCtx } from "kaplay";
import k from "./engine";
import { KaplayWareCtx } from "./types";

let sunAngle = 0;
let cloudX = 40;
let cloudY = 40;

export function makeTransition(parent: GameObj, ware: KaplayWareCtx, state: "win" | "lose" | "prep" | "speed") {
	const conductor = k.conductor(140 * ware.speed);
	const endEvent = new k.KEvent();
	const inputPromptEvent = new k.KEvent();
	const promptEvent = new k.KEvent();

	const trans = parent.add([k.scale(), k.pos(k.center()), k.anchor("center")]);
	const objs = trans.add([k.pos(-k.width() / 2, -k.height() / 2)]);
	objs.add([k.sprite("bg")]);

	const ZOOM_SCALE = k.vec2(5.9);
	const ZOOM_Y = 827;

	const screen = objs.add([
		k.sprite("screen"),
		k.pos(288, 147),
		k.opacity(),
	]);

	const computer = objs.add([
		k.sprite("computer"),
		k.pos(236, 130),
	]);

	const chillguy = objs.add([
		k.sprite("chillguy"),
		k.scale(),
		k.pos(214, 599),
		k.anchor("bot"),
	]);

	const calendar = objs.add([
		k.sprite("calendar"),
		k.pos(660, 42),
	]);

	const page = objs.add([
		k.sprite("page"),
		k.pos(calendar.pos),
		k.anchor("top"),
		k.scale(),
		k.z(1),
	]);
	page.pos.x += page.width / 2 - 15;
	page.add([k.text((ware.score - 1).toString(), { font: "happy" }), k.pos(0, 25), k.anchor("top"), k.z(1), k.color("#abdd64")]);

	function finishTrans() {
		trans.destroy();
		conductor.destroy();
	}

	objs.onUpdate(() => {
		// calendar.pos = k.mousePos();
		// k.debug.log(calendar.pos);

		// let oldScale = trans.scale;
		// let oldPos = trans.pos;

		// if (k.isKeyPressedRepeat("z")) trans.scale = trans.scale.add(0.1);
		// else if (k.isKeyPressedRepeat("x")) trans.scale = trans.scale.sub(0.1);

		// if (k.isKeyPressedRepeat("w")) trans.pos.y -= 1;
		// else if (k.isKeyPressedRepeat("a")) trans.pos.x -= 1;
		// else if (k.isKeyPressedRepeat("s")) trans.pos.y += 1;
		// else if (k.isKeyPressedRepeat("d")) trans.pos.x += 1;

		// if (oldScale != trans.scale || oldPos != trans.pos) {
		// 	k.debug.log("POS: " + trans.pos + " | SCALE: " + trans.scale);
		// }
	});

	if (state == "prep") {
		k.play("@prepJingle", { speed: ware.speed });

		k.tween(page.scale.y, 1.8, 0.5 / ware.speed, (p) => page.scale.y = p, k.easings.easeOutExpo).onEnd(() => {
			page.anchor;
			page.scale.y = 0.5;
			page.pos.y += calendar.height;
			page.anchor = "center";
			page.onUpdate(() => {
				page.pos.y += 1;
				page.scale.y -= 0.1;
				if (page.scale.y <= 0) page.destroy();
			});
		});

		const pagebelow = objs.add([
			k.sprite("page"),
			k.pos(page.pos),
			k.anchor(page.anchor),
			k.z(page.z - 1),
		]);
		pagebelow.add([k.text(ware.score.toString(), { font: "happy" }), k.pos(0, 25), k.anchor("top"), k.z(page.z - 1), k.color("#abdd64")]);

		conductor.onBeat((beat) => {
			if (beat == 1) {
				inputPromptEvent.trigger();
			}
			else if (beat == 2) {
				promptEvent.trigger();
			}

			if (beat == 3) {
				k.tween(trans.pos.y, ZOOM_Y, 1 / ware.speed, (p) => trans.pos.y = p, k.easings.easeOutQuint);
				k.tween(trans.scale, ZOOM_SCALE, 1 / ware.speed, (p) => trans.scale = p, k.easings.easeOutQuint).onEnd(() => {
					finishTrans();
				});
				k.tween(1, 0, 0.75, (p) => screen.opacity = p, k.easings.easeOutQuint).onEnd(() => {
					endEvent.trigger();
				});
			}
		});
	}
	else if (state == "lose" || state == "win") {
		k.tween(ZOOM_Y, k.center().y, 0.5 / ware.speed, (p) => trans.pos.y = p, k.easings.easeOutQuint);
		k.tween(ZOOM_SCALE, k.vec2(1), 0.5 / ware.speed, (p) => trans.scale = p, k.easings.easeOutQuint);
		k.tween(0, 1, 0.25 / ware.speed, (p) => screen.opacity = p, k.easings.easeOutQuint);

		if (state == "lose") {
			const sound = k.play("@loseJingle", { speed: ware.speed });
			chillguy.frame = 2;
			screen.frame = 2;
			k.wait(sound.duration(), () => {
				finishTrans();
				endEvent.trigger();
			});
		}
		else if (state == "win") {
			const sound = k.play("@winJingle", { speed: ware.speed });
			chillguy.frame = 1;
			screen.frame = 1;
			k.wait(sound.duration(), () => {
				finishTrans();
				endEvent.trigger();
			});
		}
	}

	return {
		onEnd(action: () => void) {
			return endEvent.add(action);
		},

		onInputPromptTime(action: () => void) {
			return inputPromptEvent.add(action);
		},

		onPromptTime(action: () => void) {
			return promptEvent.add(action);
		},
	};
}

export function makeHearts(parent: GameObj | KAPLAYCtx, amount: number) {
	const hearts: ReturnType<typeof makeHeart>[] = [];
	for (let i = 0; i < amount; i++) {
		const heart = parent.add(makeHeart());
		heart.scale = k.vec2(2);
		const HEART_WIDTH = heart.width * heart.scale.x * 1.1;
		const INITIAL_POS = k.vec2(k.center().x - HEART_WIDTH * 1.5, 0);
		heart.pos = INITIAL_POS.add(k.vec2(HEART_WIDTH * i, heart.height * 2));
		hearts.push(heart);
	}

	return hearts;
}

export function makeHeart() {
	const heart = k.make([
		k.sprite("@heart"),
		k.pos(),
		k.anchor("center"),
		k.scale(1),
		k.rotate(),
		k.opacity(),
		k.z(100),
		"heart",
		{
			kill() {
			},
		},
	]);

	heart.kill = () => {
		heart.fadeOut(0.5).onEnd(() => heart.destroy());
	};

	return heart;
}

export function makeScoreText(score: number) {
	return k.make([
		k.text(`${score.toString()}`, { align: "left" }),
		k.color(k.WHITE),
		k.anchor("center"),
		k.scale(4),
		k.rotate(0),
		k.pos(k.center().x, k.center().y - 150),
		k.timer(),
	]);
}

export function makeFriend(name: string) {
	return k.make([
		k.sprite("@" + name),
		k.scale(2),
		k.pos(),
		k.anchor("bot"),
		k.rotate(0),
	]);
}

function makeCloud() {
	const cloud = k.make([
		k.sprite("@cloud"),
		k.pos(cloudX, cloudY),
		k.anchor("center"),
		k.scale(2),
	]);

	cloud.onUpdate(() => {
		if (cloudX >= k.width() + cloud.width / 2) cloudX = -k.width / 2;
		cloud.pos.x = k.lerp(cloud.pos.x, cloudX, 0.5);
		cloud.pos.y = cloudY;
	});

	return cloud;
}

function makeSun() {
	const sun = k.make([
		k.sprite("@sun"),
		k.pos(k.vec2(k.width() - 70, 70)),
		k.rotate(0),
		k.anchor("center"),
		k.scale(2),
	]);

	sun.onUpdate(() => {
		sunAngle = sunAngle % 360;
		sun.angle = k.lerp(sun.angle, sunAngle, 0.5);
	});

	return sun;
}

export function prepTransition(ware: KaplayWareCtx) {
	const SKY_COLOR = k.rgb(141, 183, 255);
	const sound = k.play("@prepJingle", { speed: ware.speed });
	const DURATION = sound.duration() / ware.speed;
	const transition = k.add([k.timer(), k.scale(), k.pos()]);

	if (sunAngle == null) sunAngle = 0;

	function onHalf(action: () => void) {
		const ev = transition.onUpdate(() => {
			if (sound.time() >= DURATION / 2 && ev) {
				ev.cancel();
				action();
			}
		});
	}

	function onEnd(action: () => void) {
		return transition.wait(DURATION, () => {
			action();
		});
	}

	function onQuarterToEnd(action: () => void) {
		const ev = transition.onUpdate(() => {
			if (sound.time() >= (DURATION / 2) + (DURATION * 0.25) && ev) {
				ev.cancel();
				action();
			}
		});
	}

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

	topBg.add(makeCloud()).onUpdate(() => cloudX += 1 * ware.speed);
	topBg.add(makeSun()).onUpdate(() => sunAngle += 0.1 * ware.speed);

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

	const scoreText = topBg.add(makeScoreText(ware.score - 1));
	const hearts = makeHearts(botBg, ware.lives);

	let scoreTextAngle = 0;

	scoreText.onUpdate(() => scoreText.angle = k.lerp(scoreText.angle, scoreTextAngle, 0.25));
	transition.wait(DURATION / 4, () => {
		const TIME_LEFT = DURATION - DURATION / 4;
		scoreText.text = ware.score.toString();
		transition.tween(k.vec2(4), k.vec2(6), TIME_LEFT / 4, (p) => scoreText.scale = p, k.easings.easeOutQuint).onEnd(() => {
			transition.wait(TIME_LEFT / 4, () => {
				transition.tween(k.vec2(6), k.vec2(4), TIME_LEFT / 4, (p) => scoreText.scale = p, k.easings.easeOutQuint);
			});
		});
	});

	onQuarterToEnd(() => {
		topBg.pos.y = 0;
		botBg.pos.y = k.center().y;
		transition.tween(topBg.pos.y, -topBg.height, DURATION / 5, (p) => topBg.pos.y = p, k.easings.easeOutQuint);
		transition.tween(botBg.pos.y, k.height(), DURATION / 5, (p) => botBg.pos.y = p, k.easings.easeOutQuint);
	});

	onEnd(() => {
		transition.removeAll();
	});

	return {
		onHalf: onHalf,
		onEnd: onEnd,
	};
}

export function winTransition(ware: KaplayWareCtx) {
	const SKY_COLOR = k.rgb(141, 183, 255);
	const sound = k.play("@winJingle", { speed: ware.speed });
	const DURATION = sound.duration() / ware.speed;
	const transition = k.add([k.timer(), k.scale(), k.pos()]);

	function onHalf(action: () => void) {
		const ev = transition.onUpdate(() => {
			if (sound.time() >= DURATION / 2 && ev) {
				ev.cancel();
				action();
			}
		});
	}

	function onEnd(action: () => void) {
		return transition.wait(DURATION, () => {
			action();
		});
	}

	// because of the shake
	const bg = transition.add([
		k.rect(k.width() * 2, k.height() * 2),
		k.color(SKY_COLOR),
		k.pos(k.center()),
		k.anchor("center"),
		k.opacity(0),
	]);

	const topBg = transition.add([
		k.rect(k.width(), k.height() / 2),
		k.color(SKY_COLOR),
		k.pos(k.vec2(0, 0)),
		k.z(1),
	]);

	const botBg = transition.add([
		k.rect(k.width(), k.height() / 2),
		k.color(SKY_COLOR),
		k.pos(k.vec2(0, k.center().y)),
	]);

	cloudX = k.rand(k.center().x - 40, k.center().x + 40);
	topBg.add(makeCloud()).onUpdate(() => cloudX += 1 * ware.speed);
	topBg.add(makeSun()).onUpdate(() => sunAngle += 0.5 * ware.speed);

	const trophy = k.add([
		k.sprite("@trophy"),
		k.anchor("bot"),
		k.pos(k.vec2(k.center().x - 60, -40)),
	]);

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

	const mark = ground.add([
		k.sprite("@mark"),
		k.scale(2.5),
		k.anchor("bot"),
		k.pos(k.vec2(k.width() + 80, 0)),
		k.rotate(0),
	]);

	const scoreText = topBg.add(makeScoreText(ware.score - 1));
	const hearts = makeHearts(botBg, ware.lives);

	let heartToBop = -1;
	let scoreTextAngle = 0;
	// conductor.onBeat((beat) => {
	// 	scoreTextAngle = beat % 2 == 0 ? -20 : 20;
	// 	heartToBop = (heartToBop + 1) % ware.lives;

	// 	const BEAN_SCALE = 2.5;
	// 	transition.tween(BEAN_SCALE * 0.5, BEAN_SCALE, conductor.beatInterval, (p) => bean.scale.y = p, k.easings.easeOutQuint);
	// 	transition.tween(BEAN_SCALE * 1.5, BEAN_SCALE, conductor.beatInterval, (p) => bean.scale.x = p, k.easings.easeOutQuint);
	// 	if (hearts[heartToBop]) {
	// 		transition.tween(k.vec2(3), k.vec2(2), conductor.beatInterval, (p) => hearts[heartToBop].scale = p, k.easings.easeOutQuint);
	// 	}
	// });

	topBg.pos.y = -topBg.height;
	botBg.pos.y = k.height() + botBg.height;
	scoreText.onUpdate(() => scoreText.angle = k.lerp(scoreText.angle, scoreTextAngle, 0.25));
	transition.tween(topBg.pos.y, 0, DURATION / 6, (p) => topBg.pos.y = p, k.easings.easeOutQuint);
	transition.tween(botBg.pos.y, botBg.height, DURATION / 6, (p) => botBg.pos.y = p, k.easings.easeOutQuint).onEnd(() => bg.opacity = 1);

	// trophy falls down
	transition.tween(-trophy.height, k.height() - 38, DURATION / 4, (p) => trophy.pos.y = p, k.easings.linear).onEnd(() => {
		k.shake(10);
		// bean jumps
		transition.tween(bean.pos.y, bean.pos.y - bean.height * 2, DURATION / 8, (p) => bean.pos.y = p).onEnd(() => {
			transition.tween(bean.pos.y, bean.pos.y + bean.height * 2, DURATION / 8, (p) => bean.pos.y = p);
		});

		// mark goes swipes it away
		const SWIPE_TIME = (DURATION - sound.time()) * 0.5;
		transition.tween(mark.pos.x, -mark.width * 2, SWIPE_TIME, (p) => mark.pos.x = p);
		let markTookTrophy = false;
		mark.onUpdate(() => {
			mark.angle = k.wave(-20, 20, (k.time() * 10) / ware.speed);
			if (mark.pos.x <= trophy.pos.x && !markTookTrophy) {
				markTookTrophy = true;
				trophy.onUpdate(() => trophy.pos.x = mark.pos.x);
			}
		});
	});

	onEnd(() => {
		transition.removeAll();
		// conductor.destroy();
	});

	return {
		onHalf: onHalf,
		onEnd: onEnd,
	};
}

export function loseTransition(ware: KaplayWareCtx) {
	const SKY_COLOR = k.rgb(60, 92, 148);
	const HAPPY_SKY_COLOR = k.rgb(141, 183, 255);

	const sound = k.play("@loseJingle", { speed: ware.speed });
	const DURATION = sound.duration() / ware.speed;

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

	const scoreText = topBg.add(makeScoreText(ware.score - 1));
	const hearts = makeHearts(botBg, k.clamp(ware.lives + 1, 0, 4));
	// hearts[ware.lives].kill();

	let soundAtHalf = false;
	let quarterToEnd = false;

	transition.onUpdate(() => {
		if (sound.time() >= DURATION / 2 && !soundAtHalf) {
			soundAtHalf = true;
		}

		if (sound.time() >= (DURATION / 2 + DURATION * 0.25) && !quarterToEnd) {
			quarterToEnd = true;
			const TIME_LEFT = DURATION - sound.time();
			cloud.fadeOut(TIME_LEFT);
			transition.tween(topBg.color, HAPPY_SKY_COLOR, TIME_LEFT, (p) => topBg.color = p);
			transition.tween(botBg.color, HAPPY_SKY_COLOR, TIME_LEFT, (p) => botBg.color = p);
		}
	});

	transition.tween(-topBg.height, 0, DURATION / 4, (p) => topBg.pos.y = p, k.easings.easeOutQuint);
	transition.tween(k.height() + botBg.height, k.height() / 2, DURATION / 4, (p) => botBg.pos.y = p, k.easings.easeOutQuint);
	transition.tween(bean.scale.y, 2.5 * 0.5, DURATION / 2, (p) => bean.scale.y = p, k.easings.easeOutQuint).onEnd(() => {
		transition.tween(bean.scale.y, 2.5, DURATION / 2, (p) => bean.scale.y = p, k.easings.easeOutElastic);
	});

	return {
		onHalf: (action: () => void) => {
			let event = k.onUpdate(() => {
				if (sound.time() >= DURATION / 2 && event) {
					event.cancel();
					event = null;
					action();
				}
			});
		},

		onEnd: (action: () => void) => {
			const wait = transition.wait(DURATION, () => {
				wait.cancel();
				transition.removeAll();
				// conductor.destroy();
				action();
			});
			return wait;
		},
	};
}

export function speedupTransition(ware: KaplayWareCtx) {
	const sound = k.play("@speedJingle", { speed: ware.speed });
	const DURATION = sound.duration() / ware.speed;
	const transition = k.add([k.timer(), k.scale(), k.pos()]);

	function onEnd(action: () => void) {
		return transition.wait(DURATION, () => {
			action();
		});
	}

	// only 1 bg since it doesn't need to open and close like the others
	const bg = transition.add([
		k.rect(k.width() * 2, k.height() * 2),
		k.color(),
		k.pos(k.center()),
		k.anchor("center"),
	]);

	let camOffset = 0;
	let camAngle = 0;
	let spinSpeed = 0.1;
	transition.onUpdate(() => {
		camAngle = camAngle + spinSpeed;
		const TIME_TO_FINISH = sound.time() >= DURATION / 2 + DURATION / 4;
		const HUE = (k.time() * (spinSpeed * 10)) % 1;

		if (TIME_TO_FINISH) bg.color = k.lerp(bg.color, k.rgb(141, 183, 255), 0.1);
		else bg.color = k.lerp(bg.color, k.hsl2rgb(HUE, 0.7, 0.8), 0.5);

		// time to finish
		if (TIME_TO_FINISH) {
			camOffset = k.lerp(camOffset, 1, 0.1);
			spinSpeed = k.lerp(spinSpeed, 0.5, 0.5);
		}
		// getting faster!!
		else if (sound.time() >= DURATION / 2) {
			camOffset = k.lerp(camOffset, 20, 0.1);
			spinSpeed = k.lerp(spinSpeed, 0.2, 0.5);
		}
		// initial fast
		else {
			camOffset = k.lerp(camOffset, 10, 0.1);
			spinSpeed = k.lerp(spinSpeed, 0.1, 0.5);
		}

		// X = magnitude * Math.cos(angle) :sunglasses:
		const camX = k.center().x + camOffset * Math.cos(camAngle);
		const camY = k.center().y + camOffset * Math.sin(camAngle);
		k.setCamPos(camX, camY);
	});

	const cloud = transition.add(makeCloud());
	cloud.onUpdate(() => {
		cloudX += spinSpeed * 10;
	});
	const sun = transition.add(makeSun());
	sun.onUpdate(() => sunAngle += spinSpeed);

	const ground = transition.add([
		k.sprite("@grass_tile", { tiled: true, width: k.width() * 2 }),
		k.color(k.WHITE),
		k.anchor("top"),
		k.outline(5, k.BLACK),
		k.pos(k.vec2(-k.width() / 2, k.height() - 40)),
	]);

	const bean = transition.add([
		k.sprite("@bean"),
		k.scale(2.5),
		k.anchor("bot"),
		k.z(1),
		k.pos(k.center().x, k.height() - 40),
	]);

	const scoreText = transition.add(makeScoreText(ware.score - 1));
	const hearts = makeHearts(bg, ware.lives);
	hearts.forEach((heart) => heart.pos.x -= 50);

	const prompt = k.addPrompt("SPEED UP");
	// conductor.onBeat((beat) => {
	// 	const theAngle = beat % 2 == 0 ? -20 : 20;
	// 	const BEAN_SCALE = 2.5;
	// 	transition.tween(BEAN_SCALE * 0.5, BEAN_SCALE, conductor.beatInterval, (p) => bean.scale.y = p, k.easings.easeOutQuint);
	// 	transition.tween(BEAN_SCALE * 1.5, BEAN_SCALE, conductor.beatInterval, (p) => bean.scale.x = p, k.easings.easeOutQuint);
	// 	hearts.forEach((heart) => {
	// 		transition.tween(1, 2, conductor.beatInterval, (p) => heart.scale.y = p, k.easings.easeOutQuint);
	// 		transition.tween(2.5, 2, conductor.beatInterval, (p) => heart.scale.x = p, k.easings.easeOutQuint);
	// 	});
	// 	transition.tween(2, 1, 0.15, (p) => prompt.scale.y = p, k.easings.easeOutQuint);
	// });

	let friendsAmount = 3;
	let friendsChosen: string[] = [];
	const friendsLoop = transition.loop(DURATION / 4, () => {
		friendsAmount--;
		if (friendsAmount = 0) {
			friendsLoop.cancel();
			return;
		}

		const friends = Object.keys(assets).filter((key) => assets[key].type == "crew");
		const friendToAdd = k.choose(friends.filter((friendThing) => !friendsChosen.includes(friendThing)));
		const friend = transition.add(makeFriend(friendToAdd));
		const direction = k.choose([-1, 1]);
		friend.pos.y = bean.pos.y;
		if (direction == -1) transition.tween(-k.width() - friend.width * 2, k.width() + friend.width * 2, DURATION / 3.5, (p) => friend.pos.x = p);
		else transition.tween(k.width() + friend.width * 2, -k.width() - friend.width * 2, DURATION / 3.5, (p) => friend.pos.x = p);
		friend.onUpdate(() => {
			friend.angle = k.wave(-20, 20, (k.time() * 10) / ware.speed);
		});
	});

	onEnd(() => {
		transition.removeAll();
		transition.destroy();
		// conductor.destroy();
		prompt.fadeOut(0.05).onEnd(() => prompt.destroy());
	});

	return {
		onHalf: (action: () => void) => {
			let event = k.onUpdate(() => {
				if (sound.time() >= DURATION / 2 && event) {
					event.cancel();
					event = null;
					action();
				}
			});
		},

		onEnd: onEnd,
	};
}
