import k from "../../engine";
import { WareApp } from "./app";
import { Kaplayware } from "./kaplayware";

// make a "trans context" for being able to pause thigns here idk

/** The many animations a transition can do */
export type TransitionState = "win" | "lose" | "prep" | "speed" | "bossPrep" | "bossWin";

export function runTransition(states: TransitionState[], wareApp: WareApp, wareEngine: Kaplayware) {
	const speed = wareEngine.speed;
	const difficulty = wareEngine.difficulty;
	const lives = wareEngine.lives;
	const score = wareEngine.score;

	const conductor = k.conductor(140 * speed);

	const stateStartEvent = new k.KEvent<TransitionState[]>();
	const stateEndEvent = new k.KEvent<TransitionState[]>();
	const transitionEndEvent = new k.KEvent<TransitionState[]>();
	const inputPromptEvent = new k.KEvent();
	const promptEvent = new k.KEvent();

	const pauseCtx = wareApp.pauseCtx;

	// woke agenda
	// "trans" controls scale and position of the transitions, obj is just to attach, don't remove this
	const trans = wareApp.rootObj.add([k.scale(), k.pos(k.center()), k.anchor("center"), k.state(states[0], states)]);
	const objs = trans.add([k.pos(-k.width() / 2, -k.height() / 2)]);
	objs.add([k.sprite("trans1-bg")]);
	objs.add([k.sprite("trans1-grass")]);
	objs.add([k.sprite("trans1-table")]);

	trans.onUpdate(() => {
		conductor.paused = true;
	});

	const ZOOM_SCALE = k.vec2(5.9);
	const ZOOM_Y = 827;

	const coffee = objs.add([
		k.sprite("trans1-coffee"),
		k.pos(65, 290),
		k.anchor("center"),
	]);
	coffee.play("hot", { speed: 8 * speed, loop: true });

	const flowerpot = objs.add([
		k.sprite("trans1-flowerpot"),
		k.pos(680, 280),
		k.anchor("top"),
	]);

	// add flowers
	for (let i = 0; i < difficulty; i++) {
		const flower = objs.add([
			k.sprite("trans1-flower"),
			k.pos(flowerpot.pos.x, flowerpot.pos.y + 2),
			k.anchor("bot"),
			k.scale(),
			"flower",
		]);

		let flowerGap = ((flowerpot.width * 0.8) - flower.width * objs.get("flower").length) / (objs.get("flower").length + 1);
		let flowerX = flowerGap;
		objs.get("flower").forEach((flower, index) => {
			flower.pos.x = (flowerpot.pos.x - 10) + flowerX;
			flowerX += flowerGap + flower.width;
		});

		flower.frame = difficulty - 1;
	}

	// add hearts
	for (let i = 0; i < (states[0] == "lose" ? lives + 1 : lives); i++) {
		let shake = 0;

		const heart = objs.add([
			k.sprite("trans1-heart"),
			k.pos(220, 60),
			k.scale(),
			k.color(),
			k.anchor("center"),
			k.opacity(),
			k.rotate(),
			"heart",
			{
				kill() {},
				shake(val: number = 14) {},
			},
		]);

		heart.pos.x += (heart.width * 1.15) * i;
		let pos = heart.pos;

		heart.onUpdate(() => {
			shake = k.lerp(shake, 0, 0.5);
			const newPos = pos.add(k.Vec2.fromAngle(k.rand(0, 360)).scale(shake));
			heart.pos = newPos;
		});

		heart.shake = (val: number = 14) => {
			shake = val;
		};

		heart.kill = () => {
			pauseCtx.tween(heart.color, k.BLACK, 0.75 / speed, (p) => heart.color = p);
			heart.fadeOut(0.75 / speed).onEnd(() => heart.destroy());
		};
	}

	// TODO: Fix all the screen stuff when the new screen aspect ratio comes out
	const screen = objs.add([
		k.sprite("trans1-screen"),
		k.pos(396, 214),
		k.opacity(),
		k.anchor("center"),
	]);

	const computer = objs.add([
		k.sprite("trans1-computer"),
		k.pos(236, 130),
	]);

	const chillguy = objs.add([
		k.sprite("trans1-chillguy"),
		k.scale(),
		k.pos(214, 599),
		k.anchor("bot"),
	]);

	const chillcat = objs.add([
		k.sprite("trans1-chillcat"),
		k.scale(),
		k.pos(598, 600),
		k.anchor("bot"),
	]);

	const chillbutterfly = objs.add([
		k.sprite("trans1-chillbutterfly"),
		k.scale(),
		k.pos(470, 491),
		k.anchor("center"),
	]);

	const calendar = objs.add([
		k.sprite("trans1-calendar"),
		k.pos(714, 84),
		k.anchor("center"),
	]);

	function addCalendarPage(score: number) {
		const fallingPage = objs.add([
			k.sprite("trans1-page"),
			k.pos(calendar.pos.sub(calendar.width / 2, calendar.height / 2)),
			k.anchor("top"),
			k.scale(),
			k.opacity(),
			k.z(1),
		]);
		fallingPage.pos.x += fallingPage.width / 2 - 15;
		fallingPage.onDraw(() => {
			k.drawText({
				text: score.toString(),
				font: "happy",
				anchor: fallingPage.anchor,
				align: "center",
				pos: k.vec2(-5, 20),
				color: k.Color.fromHex("#abdd64"),
				opacity: fallingPage.opacity,
			});
		});

		return fallingPage;
	}

	const fallingPage = addCalendarPage(score - 1);

	function destroy() {
		trans.destroy();
		pauseCtx.resetContext();
	}

	conductor.onBeat((beat) => {
		objs.get("flower").forEach((flower) => {
			if (difficulty == 1) {
				pauseCtx.tween(0.6, 1, 0.35 / speed, (p) => flower.scale.y = p, k.easings.easeOutBack);
			}
			else {
				if (beat % 2 == 0) {
					if (flower.id % 2 == 0) {
						pauseCtx.tween(1, 0.6, 0.35 / speed, (p) => flower.scale.y = p, k.easings.easeOutBack);
					}
					else {
						pauseCtx.tween(0.6, 1, 0.35 / speed, (p) => flower.scale.y = p, k.easings.easeOutBack);
					}
				}
				else {
					if (flower.id % 2 != 0) {
						pauseCtx.tween(1, 0.6, 0.35 / speed, (p) => flower.scale.y = p, k.easings.easeOutBack);
					}
					else {
						pauseCtx.tween(0.6, 1, 0.35 / speed, (p) => flower.scale.y = p, k.easings.easeOutBack);
					}
				}
			}
		});
	});

	function zoomOut() {
		pauseCtx.tween(ZOOM_Y, k.center().y, 0.5 / speed, (p) => trans.pos.y = p, k.easings.easeOutQuint);
		pauseCtx.tween(ZOOM_SCALE, k.vec2(1), 0.5 / speed, (p) => trans.scale = p, k.easings.easeOutQuint);
	}

	function zoomIn() {
		pauseCtx.tween(trans.pos.y, ZOOM_Y, 1 / speed, (p) => trans.pos.y = p, k.easings.easeOutQuint);
		pauseCtx.tween(trans.scale, ZOOM_SCALE, 1 / speed, (p) => trans.scale = p, k.easings.easeOutQuint);
	}

	trans.onStateEnter("prep", () => {
		stateStartEvent.trigger("prep");
		pauseCtx.play("prepJingle", { speed: speed });

		chillguy.frame = 0;
		screen.frame = 0;
		chillcat.frame = 0;
		chillbutterfly.frame = 0;

		const prepConductor = k.conductor(140 * speed);
		trans.onUpdate(() => prepConductor.paused = wareApp.gamePaused);

		// page funny
		pauseCtx.tween(fallingPage.scale.y, 1.8, 0.35 / speed, (p) => fallingPage.scale.y = p, k.easings.easeOutExpo).onEnd(() => {
			fallingPage.scale.y = 0.5;
			fallingPage.pos.y += calendar.height;
			const Xpos = fallingPage.pos.x;
			fallingPage.onUpdate(() => {
				const xWave = k.wave(Xpos - 20, Xpos + 20, k.time() * speed * 2);
				fallingPage.pos.x = k.lerp(fallingPage.pos.x, xWave, 0.5);
			});
			pauseCtx.tween(fallingPage.pos.y, fallingPage.pos.y + 50, 0.4 / speed, (p) => fallingPage.pos.y = p, k.easings.easeOutCubic);
			pauseCtx.tween(fallingPage.opacity, 0, 0.4 / speed, (p) => fallingPage.opacity = p, k.easings.linear);
		});

		const newPage = addCalendarPage(score);
		newPage.z = fallingPage.z - 1;

		// tween the first one here bc conductor doesn't do beat 0
		const hearts = objs.get("heart");
		pauseCtx.tween(k.vec2(1.5), k.vec2(1), 0.35 / speed, (p) => hearts[0].scale = p, k.easings.easeOutQuint);
		prepConductor.onBeat((beat) => {
			if (beat == 1) {
				inputPromptEvent.trigger();
			}
			else if (beat == 2) {
				promptEvent.trigger();
				// set gamebox
				wareApp.boxObj.width = screen.width;
				wareApp.boxObj.height = screen.height;
				wareApp.boxObj.pos = screen.pos;
				pauseCtx.tween(1, 0, 0.5 / speed, (p) => screen.opacity = p, k.easings.easeOutQuint);
			}

			const heartIdx = beat % (hearts.length);
			const heartToBeat = hearts[heartIdx];
			pauseCtx.tween(k.vec2(1.5), k.vec2(1), 0.35 / speed, (p) => heartToBeat.scale = p, k.easings.easeOutQuint);

			if (beat == 3) {
				zoomIn();
				pauseCtx.tween(
					k.vec2(wareApp.boxObj.width, wareApp.boxObj.height),
					k.vec2(k.width(), k.height()),
					0.5 / speed,
					(p) => [wareApp.boxObj.width, wareApp.boxObj.height] = [p.x, p.y],
					k.easings.easeOutQuint,
				);
				pauseCtx.tween(wareApp.boxObj.pos, k.center(), 0.5 / speed, (p) => wareApp.boxObj.pos = p, k.easings.easeOutQuint).onEnd(() => {
					stateEndEvent.trigger("prep");
					prepConductor.destroy();
				});
			}
		});
	});

	trans.onStateEnter("win", () => {
		stateStartEvent.trigger("win");
		screen.opacity = 0;
		zoomOut();
		pauseCtx.tween(0, 1, 0.5 / speed, (p) => screen.opacity = p, k.easings.easeOutQuint);
		pauseCtx.tween(wareApp.boxObj.pos, screen.pos, 0.5 / speed, (p) => screen.pos = p, k.easings.easeOutQuint);
		pauseCtx.tween(
			k.vec2(wareApp.boxObj.width, wareApp.boxObj.height),
			k.vec2(screen.width, screen.height),
			0.5 / speed,
			(p) => [wareApp.boxObj.width, wareApp.boxObj.height] = [p.x, p.y],
			k.easings.easeOutQuint,
		);

		const winConductor = k.conductor(140 * speed);
		const hearts = objs.get("heart");
		winConductor.onBeat(() => {
		});

		const sound = pauseCtx.play("winJingle", { speed: speed });
		chillguy.frame = 1;
		screen.frame = 1;
		chillcat.frame = 1;
		chillbutterfly.frame = 1;
		pauseCtx.wait(sound.duration() / speed, () => {
			stateEndEvent.trigger("win");
		});
	});

	trans.onStateEnter("lose", () => {
		stateStartEvent.trigger("lose");
		pauseCtx.tween(ZOOM_Y, k.center().y, 0.5 / speed, (p) => trans.pos.y = p, k.easings.easeOutQuint);
		pauseCtx.tween(ZOOM_SCALE, k.vec2(1), 0.5 / speed, (p) => trans.scale = p, k.easings.easeOutQuint);
		pauseCtx.tween(0, 1, 0.25 / speed, (p) => screen.opacity = p, k.easings.easeOutQuint);

		const sound = pauseCtx.play("loseJingle", { speed: speed });
		chillguy.frame = 2;
		screen.frame = 2;
		chillcat.frame = 2;
		chillbutterfly.frame = 2;

		const dyingHeart = objs.get("heart")[objs.get("heart").length - 1];
		dyingHeart.kill();
		objs.get("heart").forEach((heart, index, arr) => {
			if (index < arr.length - 1) heart.shake(7);
		});

		pauseCtx.wait(sound.duration() / speed, () => {
			stateEndEvent.trigger("lose");
		});
	});

	trans.onStateEnter("speed", () => {
		stateStartEvent.trigger("speed");
		const sound = pauseCtx.play("speedJingle", { speed: speed });

		const overlay = objs.add([
			k.rect(k.width(), k.height()),
			k.color(),
			k.opacity(0.5),
		]);

		overlay.onUpdate(() => {
			const HUE = (k.time() * (speed * 10)) % 1;
			overlay.color = k.lerp(overlay.color, k.hsl2rgb(HUE, 0.7, 0.8), 0.1);
		});

		pauseCtx.wait(sound.duration() / speed, () => {
			overlay.destroy();
			stateEndEvent.trigger("speed");
		});
	});

	// TODO: Do these
	trans.onStateEnter("bossPrep", () => {
		stateStartEvent.trigger("bossPrep");
		const sound = pauseCtx.play("bossJingle", { speed: speed });

		const bossText = objs.add([
			k.text("BOSS"),
			k.anchor("center"),
			k.pos(k.center()),
		]);

		pauseCtx.wait(sound.duration() / speed, () => {
			stateEndEvent.trigger("bossPrep");
			bossText.destroy();
		});
	});

	trans.onStateEnter("bossWin", () => {
		stateStartEvent.trigger("bossWin");
		const sound = pauseCtx.play("bossWinJingle", { speed: speed });

		pauseCtx.tween(ZOOM_Y, k.center().y, 0.5 / speed, (p) => trans.pos.y = p, k.easings.easeOutQuint);
		pauseCtx.tween(ZOOM_SCALE, k.vec2(1), 0.5 / speed, (p) => trans.scale = p, k.easings.easeOutQuint);
		pauseCtx.tween(0, 1, 0.25 / speed, (p) => screen.opacity = p, k.easings.easeOutQuint);
		chillguy.frame = 1;
		screen.frame = 1;
		chillcat.frame = 1;
		chillbutterfly.frame = 1;

		pauseCtx.wait(sound.duration() / speed, () => {
			stateEndEvent.trigger("bossWin");
		});
	});

	stateEndEvent.add((state) => {
		if (states.indexOf(state) == states.length - 1) transitionEndEvent.trigger();
		else trans.enterState(states[states.indexOf(state) + 1]);
	});

	return {
		destroy,

		onStateStart(stateName: TransitionState, action: () => void) {
			return stateStartEvent.add((state) => {
				if (stateName == state) action();
			});
		},

		onStateEnd(stateName: TransitionState, action: () => void) {
			return stateStartEvent.add((state) => {
				if (stateName == state) action();
			});
		},

		/** Runs when all the states passed end */
		onTransitionEnd(action: () => void) {
			return transitionEndEvent.add(action);
		},

		onInputPromptTime(action: () => void) {
			return inputPromptEvent.add(action);
		},

		onPromptTime(action: () => void) {
			return promptEvent.add(action);
		},
	};
}
