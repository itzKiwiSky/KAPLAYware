import k from "../../../engine";
import { TransitionDefinition } from "./makeTransition";

/** The cool "chill guy" transition for first pack of games */
export const chillTransition: TransitionDefinition = (parent, camera, stageManager, wareApp, wareEngine) => {
	const speed = wareEngine.speed;
	const difficulty = wareEngine.difficulty;
	const lives = wareEngine.lives;
	const score = wareEngine.score;

	const conductor = k.conductor(140 * speed);
	const pauseCtx = wareApp.pauseCtx;
	// TODO: figure out a pauseCtx improvement
	// do something like wareApp.timers.tween() or simply wareApp.tween()?

	parent.add([k.sprite("trans1-bg")]);
	parent.add([k.sprite("trans1-grass")]);
	parent.add([k.sprite("trans1-table")]);

	parent.onUpdate(() => {
		conductor.paused = true;
	});

	const ZOOM_SCALE = k.vec2(5.9);
	const ZOOM_Y = 827;

	const coffee = parent.add([
		k.sprite("trans1-coffee"),
		k.pos(65, 290),
		k.anchor("center"),
	]);
	coffee.play("hot", { speed: 8 * speed, loop: true });

	const flowerpot = parent.add([
		k.sprite("trans1-flowerpot"),
		k.pos(680, 280),
		k.anchor("top"),
	]);

	// TODO: flowers aren't re added with difficulty changing, fix it!

	// add flowers
	for (let i = 0; i < difficulty; i++) {
		const flower = parent.add([
			k.sprite("trans1-flower"),
			k.pos(flowerpot.pos.x, flowerpot.pos.y + 2),
			k.anchor("bot"),
			k.scale(),
			"flower",
		]);

		let flowerGap = ((flowerpot.width * 0.8) - flower.width * parent.get("flower").length) / (parent.get("flower").length + 1);
		let flowerX = flowerGap;
		parent.get("flower").forEach((flower, index) => {
			flower.pos.x = (flowerpot.pos.x - 10) + flowerX;
			flowerX += flowerGap + flower.width;
		});

		flower.frame = difficulty - 1;
	}

	// add hearts
	for (let i = 0; i < (stageManager.stages[0] == "lose" ? lives + 1 : lives); i++) {
		let shake = 0;

		const heart = parent.add([
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

	// TODO: Fix all the screen stuff when the new transition comes out
	const screen = parent.add([
		k.sprite("trans1-screen"),
		k.pos(396, 214),
		k.opacity(),
		k.anchor("center"),
	]);

	const computer = parent.add([
		k.sprite("trans1-computer"),
		k.pos(236, 130),
	]);

	const chillguy = parent.add([
		k.sprite("trans1-chillguy"),
		k.scale(),
		k.pos(214, 599),
		k.anchor("bot"),
	]);

	const chillcat = parent.add([
		k.sprite("trans1-chillcat"),
		k.scale(),
		k.pos(598, 600),
		k.anchor("bot"),
	]);

	const chillbutterfly = parent.add([
		k.sprite("trans1-chillbutterfly"),
		k.scale(),
		k.pos(470, 491),
		k.anchor("center"),
	]);

	const calendar = parent.add([
		k.sprite("trans1-calendar"),
		k.pos(714, 84),
		k.anchor("center"),
	]);

	function addCalendarPage(score: number) {
		const fallingPage = parent.add([
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

	let fallingPage = addCalendarPage(wareEngine.score - 1);

	conductor.onBeat((beat) => {
		parent.get("flower").forEach((flower) => {
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
		pauseCtx.tween(ZOOM_Y, k.center().y, 0.5 / speed, (p) => camera.pos.y = p, k.easings.easeOutQuint);
		pauseCtx.tween(ZOOM_SCALE, k.vec2(1), 0.5 / speed, (p) => camera.scale = p, k.easings.easeOutQuint);
	}

	function zoomIn() {
		pauseCtx.tween(camera.pos.y, ZOOM_Y, 1 / speed, (p) => camera.pos.y = p, k.easings.easeOutQuint);
		pauseCtx.tween(camera.scale, ZOOM_SCALE, 1 / speed, (p) => camera.scale = p, k.easings.easeOutQuint);
	}

	stageManager.defineStage("prep", () => {
		pauseCtx.play("prepJingle", { speed: speed });
		chillguy.frame = 0;
		screen.frame = 0;
		chillcat.frame = 0;
		chillbutterfly.frame = 0;

		const prepConductor = k.conductor(140 * speed);
		parent.onUpdate(() => prepConductor.paused = wareApp.gamePaused);

		fallingPage.destroy();
		fallingPage = addCalendarPage(wareEngine.score - 1);
		k.readd(fallingPage);

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

		const newPage = addCalendarPage(wareEngine.score);
		newPage.z = fallingPage.z - 1;

		// tween the first one here bc conductor doesn't do beat 0
		const hearts = parent.get("heart");
		pauseCtx.tween(k.vec2(1.5), k.vec2(1), 0.35 / speed, (p) => hearts[0].scale = p, k.easings.easeOutQuint);
		prepConductor.onBeat((beat) => {
			if (beat == 1) {
				stageManager.callInput();
			}
			else if (beat == 2) {
				stageManager.callPrompt();
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
					prepConductor.destroy();
					stageManager.finishStage("prep");
				});
			}
		});
	});

	stageManager.defineStage("win", () => {
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
		const hearts = parent.get("heart");
		winConductor.onBeat(() => {
		});

		const sound = pauseCtx.play("winJingle", { speed: speed });
		chillguy.frame = 1;
		screen.frame = 1;
		chillcat.frame = 1;
		chillbutterfly.frame = 1;
		pauseCtx.wait(sound.duration() / speed, () => {
			stageManager.finishStage("win");
		});
	});

	stageManager.defineStage("lose", () => {
		pauseCtx.tween(ZOOM_Y, k.center().y, 0.5 / speed, (p) => camera.pos.y = p, k.easings.easeOutQuint);
		pauseCtx.tween(ZOOM_SCALE, k.vec2(1), 0.5 / speed, (p) => camera.scale = p, k.easings.easeOutQuint);
		pauseCtx.tween(0, 1, 0.25 / speed, (p) => screen.opacity = p, k.easings.easeOutQuint);

		const sound = pauseCtx.play("loseJingle", { speed: speed });
		chillguy.frame = 2;
		screen.frame = 2;
		chillcat.frame = 2;
		chillbutterfly.frame = 2;

		const dyingHeart = parent.get("heart")[parent.get("heart").length - 1];
		dyingHeart.kill();
		parent.get("heart").forEach((heart, index, arr) => {
			if (index < arr.length - 1) heart.shake(7);
		});

		pauseCtx.wait(sound.duration() / speed, () => {
			stageManager.finishStage("lose");
		});
	});

	stageManager.defineStage("speed", () => {
		const sound = pauseCtx.play("speedJingle", { speed: speed });

		const overlay = parent.add([
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
			stageManager.finishStage("speed");
		});
	});

	stageManager.defineStage("bossPrep", () => {
		const sound = pauseCtx.play("bossJingle", { speed: speed });

		const bossText = parent.add([
			k.text("BOSS"),
			k.anchor("center"),
			k.pos(k.center()),
		]);

		pauseCtx.wait(sound.duration() / speed, () => {
			stageManager.finishStage("bossPrep");
			bossText.destroy();
		});
	});

	stageManager.defineStage("bossWin", () => {
		const sound = pauseCtx.play("bossWinJingle", { speed: speed });

		pauseCtx.tween(ZOOM_Y, k.center().y, 0.5 / speed, (p) => camera.pos.y = p, k.easings.easeOutQuint);
		pauseCtx.tween(ZOOM_SCALE, k.vec2(1), 0.5 / speed, (p) => camera.scale = p, k.easings.easeOutQuint);
		pauseCtx.tween(0, 1, 0.25 / speed, (p) => screen.opacity = p, k.easings.easeOutQuint);
		chillguy.frame = 1;
		screen.frame = 1;
		chillcat.frame = 1;
		chillbutterfly.frame = 1;

		pauseCtx.wait(sound.duration() / speed, () => {
			stageManager.finishStage("bossWin");
		});
	});

	stageManager.defineStage("bossLose", () => {
		const sound = pauseCtx.play("loseJingle", { speed: speed });

		pauseCtx.tween(ZOOM_Y, k.center().y, 0.5 / speed, (p) => camera.pos.y = p, k.easings.easeOutQuint);
		pauseCtx.tween(ZOOM_SCALE, k.vec2(1), 0.5 / speed, (p) => camera.scale = p, k.easings.easeOutQuint);
		pauseCtx.tween(0, 1, 0.25 / speed, (p) => screen.opacity = p, k.easings.easeOutQuint);
		chillguy.frame = 2;
		screen.frame = 2;
		chillcat.frame = 2;
		chillbutterfly.frame = 2;

		pauseCtx.wait(sound.duration() / speed, () => {
			stageManager.finishStage("bossLose");
		});
	});
};

export default chillTransition;
