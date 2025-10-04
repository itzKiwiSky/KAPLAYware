import k from "../../../engine";
import { addInputPrompt, addTextPrompt } from "../objects/prompts";
import { TransitionDefinition } from "./makeTransition";

/** The cool "chill guy" transition for first pack of games */
export const chillTransition: TransitionDefinition = (ctx, parent, camera, stageManager, wareApp) => {
	const { tween, wait, play, createConductor } = ctx;
	let opts = stageManager.opts;

	const conductor = createConductor(140 * opts.speed);
	conductor.onUpdate(() => {
		conductor.bpm = 140 * opts.speed;
	});

	parent.add([k.sprite("trans1-bg")]);
	parent.add([k.sprite("trans1-grass")]);
	parent.add([k.sprite("trans1-table")]);

	const ZOOM_SCALE = k.vec2(5.9);
	const ZOOM_Y = 827;

	const coffee = parent.add([
		k.sprite("trans1-coffee"),
		k.pos(65, 290),
		k.anchor("center"),
	]);
	coffee.play("hot", { speed: 8 * opts.speed, loop: true });

	const flowerpot = parent.add([
		k.sprite("trans1-flowerpot"),
		k.pos(680, 280),
		k.anchor("top"),
	]);

	function addFlower() {
		const flower = parent.add([
			k.sprite("trans1-flower"),
			k.pos(flowerpot.pos.x, flowerpot.pos.y + 2),
			k.anchor("bot"),
			k.scale(),
			k.color(),
			"flower",
			{
				canBeat: true,
				rise() {},
				bury() {},
			},
		]);

		flower.rise = () => {
			flower.canBeat = false;
			tween(0, 1, 1 / opts.speed, (p) => flower.scale.y = p, k.easings.easeOutElastic).onEnd(() => flower.canBeat = true);
		};

		flower.bury = () => {
			flower.untag("flower");
			flower.canBeat = false;
			tween(1, 0, 0.25 / opts.speed, (p) => flower.scale.y = p).onEnd(() => flower.destroy());
		};

		flower.rise();

		let flowerGap = ((flowerpot.width * 0.8) - flower.width * parent.get("flower").length) / (parent.get("flower").length + 1);
		let flowerX = flowerGap;
		parent.get("flower").forEach((flower, index) => {
			flower.pos.x = (flowerpot.pos.x - 10) + flowerX;
			flowerX += flowerGap + flower.width;
		});

		flower.frame = opts.difficulty - 1;
		return flower;
	}

	function addHearts() {
		parent.get("heart").forEach((c) => c.destroy());

		// adds the hearts
		for (let i = 0; i < (stageManager.stages[0] == "lose" ? opts.lives + 1 : opts.lives); i++) {
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
				tween(heart.color, k.BLACK, 0.75 / opts.speed, (p) => heart.color = p);
				heart.fadeOut(0.75 / opts.speed).onEnd(() => heart.destroy());
			};
		}
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

	let fallingPage = addCalendarPage(opts.score - 1);

	conductor.onBeat((beat) => {
		parent.get("flower").forEach((flower) => {
			if (!flower.canBeat) return;

			if (opts.difficulty == 1) {
				tween(0.6, 1, 0.35 / opts.speed, (p) => flower.scale.y = p, k.easings.easeOutBack);
			}
			else {
				if (beat % 2 == 0) {
					if (flower.id % 2 == 0) {
						tween(1, 0.6, 0.35 / opts.speed, (p) => flower.scale.y = p, k.easings.easeOutBack);
					}
					else {
						tween(0.6, 1, 0.35 / opts.speed, (p) => flower.scale.y = p, k.easings.easeOutBack);
					}
				}
				else {
					if (flower.id % 2 != 0) {
						tween(1, 0.6, 0.35 / opts.speed, (p) => flower.scale.y = p, k.easings.easeOutBack);
					}
					else {
						tween(0.6, 1, 0.35 / opts.speed, (p) => flower.scale.y = p, k.easings.easeOutBack);
					}
				}
			}
		});
	});

	function zoomOut() {
		tween(ZOOM_Y, k.center().y, 0.5 / opts.speed, (p) => camera.pos.y = p, k.easings.easeOutQuint);
		tween(ZOOM_SCALE, k.vec2(1), 0.5 / opts.speed, (p) => camera.scale = p, k.easings.easeOutQuint);
	}

	function zoomIn() {
		tween(camera.pos.y, ZOOM_Y, 1 / opts.speed, (p) => camera.pos.y = p, k.easings.easeOutQuint);
		tween(camera.scale, ZOOM_SCALE, 1 / opts.speed, (p) => camera.scale = p, k.easings.easeOutQuint);
	}

	stageManager.onStart(() => {
		opts = stageManager.opts; // re defines the opts
		conductor.time = 0; // desyncing
		coffee.play("hot", { speed: 8 * opts.speed, loop: true });
		addHearts();
	});

	stageManager.defineStage("prep", () => {
		play("prepJingle", { speed: opts.speed });
		chillguy.frame = 0;
		screen.frame = 0;
		chillcat.frame = 0;
		chillbutterfly.frame = 0;

		const prepConductor = createConductor(140 * opts.speed);
		fallingPage.destroy();
		fallingPage = addCalendarPage(opts.score - 1);

		// page funny
		tween(fallingPage.scale.y, 1.8, 0.35 / opts.speed, (p) => fallingPage.scale.y = p, k.easings.easeOutExpo).onEnd(() => {
			fallingPage.scale.y = 0.5;
			fallingPage.pos.y += calendar.height;
			const Xpos = fallingPage.pos.x;
			fallingPage.onUpdate(() => {
				const xWave = k.wave(Xpos - 20, Xpos + 20, k.time() * opts.speed * 2);
				fallingPage.pos.x = k.lerp(fallingPage.pos.x, xWave, 0.5);
			});
			tween(fallingPage.pos.y, fallingPage.pos.y + 50, 0.4 / opts.speed, (p) => fallingPage.pos.y = p, k.easings.easeOutCubic);
			tween(fallingPage.opacity, 0, 0.4 / opts.speed, (p) => fallingPage.opacity = p, k.easings.linear);
		});

		const newPage = addCalendarPage(opts.score);
		newPage.z = fallingPage.z - 1;

		// TODO: when there are 3 flowers they don't beat anymore

		// tween the first one here bc conductor doesn't do beat 0
		const hearts = parent.get("heart");
		tween(k.vec2(1.5), k.vec2(1), 0.35 / opts.speed, (p) => hearts[0].scale = p, k.easings.easeOutQuint);
		prepConductor.onBeat((beat) => {
			if (beat == 1) {
				addInputPrompt(wareApp, opts.input, opts.speed, ctx);
			}
			else if (beat == 2) {
				const prompt = typeof opts.prompt == "string" ? opts.prompt : "";
				const promptObj = addTextPrompt(wareApp, prompt, opts.speed, ctx);
				if (typeof opts.prompt == "function") opts.prompt(opts.ctx, promptObj);

				// set gamebox
				wareApp.boxObj.width = screen.width;
				wareApp.boxObj.height = screen.height;
				wareApp.boxObj.pos = screen.pos;
				tween(1, 0, 0.5 / opts.speed, (p) => screen.opacity = p, k.easings.easeOutQuint);
			}

			const heartIdx = beat % (hearts.length);
			const heartToBeat = hearts[heartIdx];
			tween(k.vec2(1.5), k.vec2(1), 0.35 / opts.speed, (p) => heartToBeat.scale = p, k.easings.easeOutQuint);

			if (beat == 3) {
				zoomIn();
				tween(
					k.vec2(wareApp.boxObj.width, wareApp.boxObj.height),
					k.vec2(k.width(), k.height()),
					0.5 / opts.speed,
					(p) => [wareApp.boxObj.width, wareApp.boxObj.height] = [p.x, p.y],
					k.easings.easeOutQuint,
				);
				tween(wareApp.boxObj.pos, k.center(), 0.5 / opts.speed, (p) => wareApp.boxObj.pos = p, k.easings.easeOutQuint).onEnd(() => {
					prepConductor.destroy();
					stageManager.finishStage("prep");
				});
			}
		});

		// adds the first flower in case there isn't one
		if (!parent.get("flower")[0] && !parent.get("piranha")[0]) {
			for (let i = 0; i < opts.difficulty; i++) {
				addFlower();
			}
		}
	});

	stageManager.defineStage("win", () => {
		screen.opacity = 0;
		zoomOut();
		tween(0, 1, 0.5 / opts.speed, (p) => screen.opacity = p, k.easings.easeOutQuint);
		tween(wareApp.boxObj.pos, screen.pos, 0.5 / opts.speed, (p) => screen.pos = p, k.easings.easeOutQuint);
		tween(
			k.vec2(wareApp.boxObj.width, wareApp.boxObj.height),
			k.vec2(screen.width, screen.height),
			0.5 / opts.speed,
			(p) => [wareApp.boxObj.width, wareApp.boxObj.height] = [p.x, p.y],
			k.easings.easeOutQuint,
		);

		const winConductor = createConductor(140 * opts.speed);
		const hearts = parent.get("heart");
		winConductor.onBeat(() => {
		});

		const sound = play("winJingle", { speed: opts.speed });
		chillguy.frame = 1;
		screen.frame = 1;
		chillcat.frame = 1;
		chillbutterfly.frame = 1;
		wait(sound.duration() / opts.speed, () => {
			stageManager.finishStage("win");
		});
	});

	stageManager.defineStage("lose", () => {
		tween(ZOOM_Y, k.center().y, 0.5 / opts.speed, (p) => camera.pos.y = p, k.easings.easeOutQuint);
		tween(ZOOM_SCALE, k.vec2(1), 0.5 / opts.speed, (p) => camera.scale = p, k.easings.easeOutQuint);
		tween(0, 1, 0.25 / opts.speed, (p) => screen.opacity = p, k.easings.easeOutQuint);

		const sound = play("loseJingle", { speed: opts.speed });
		chillguy.frame = 2;
		screen.frame = 2;
		chillcat.frame = 2;
		chillbutterfly.frame = 2;

		const dyingHeart = parent.get("heart")[parent.get("heart").length - 1];
		dyingHeart.kill();
		parent.get("heart").forEach((heart, index, arr) => {
			if (index < arr.length - 1) heart.shake(7);
		});

		wait(sound.duration() / opts.speed, () => {
			stageManager.finishStage("lose");
		});
	});

	stageManager.defineStage("speed", () => {
		const sound = play("speedJingle", { speed: opts.speed });

		const overlay = parent.add([
			k.rect(k.width(), k.height()),
			k.color(),
			k.opacity(0.5),
		]);

		overlay.onUpdate(() => {
			const HUE = (k.time() * (opts.speed * 10)) % 1;
			overlay.color = k.lerp(overlay.color, k.hsl2rgb(HUE, 0.7, 0.8), 0.1);
		});

		wait(sound.duration() / opts.speed, () => {
			overlay.destroy();
			stageManager.finishStage("speed");
		});
	});

	function cleanFlowers() {
		parent.get("flower").forEach((flower) => flower.bury());
		const piranhaFlower = addFlower();
		piranhaFlower.canBeat = false;
		piranhaFlower.untag("flower");
		piranhaFlower.tag("piranha");
		piranhaFlower.color = k.RED;
	}

	function bossPrepCleanup() {
		const piranhaFlower = parent.get("piranha")[0];
		piranhaFlower.bury();
	}

	stageManager.defineStage("bossPrep", () => {
		const sound = play("bossJingle", { speed: opts.speed });

		const bossText = parent.add([
			k.text("BOSS"),
			k.anchor("center"),
			k.pos(k.center()),
		]);

		cleanFlowers();
		wait(sound.duration() / opts.speed, () => {
			stageManager.finishStage("bossPrep");
			bossText.destroy();
		});
	});

	stageManager.defineStage("bossWin", () => {
		const sound = play("bossWinJingle", { speed: opts.speed });

		bossPrepCleanup();
		tween(ZOOM_Y, k.center().y, 0.5 / opts.speed, (p) => camera.pos.y = p, k.easings.easeOutQuint);
		tween(ZOOM_SCALE, k.vec2(1), 0.5 / opts.speed, (p) => camera.scale = p, k.easings.easeOutQuint);
		tween(0, 1, 0.25 / opts.speed, (p) => screen.opacity = p, k.easings.easeOutQuint);
		chillguy.frame = 1;
		screen.frame = 1;
		chillcat.frame = 1;
		chillbutterfly.frame = 1;

		wait(sound.duration() / opts.speed, () => {
			stageManager.finishStage("bossWin");
		});
	});

	stageManager.defineStage("bossLose", () => {
		const sound = play("loseJingle", { speed: opts.speed });

		bossPrepCleanup();
		tween(ZOOM_Y, k.center().y, 0.5 / opts.speed, (p) => camera.pos.y = p, k.easings.easeOutQuint);
		tween(ZOOM_SCALE, k.vec2(1), 0.5 / opts.speed, (p) => camera.scale = p, k.easings.easeOutQuint);
		tween(0, 1, 0.25 / opts.speed, (p) => screen.opacity = p, k.easings.easeOutQuint);
		chillguy.frame = 2;
		screen.frame = 2;
		chillcat.frame = 2;
		chillbutterfly.frame = 2;

		wait(sound.duration() / opts.speed, () => {
			stageManager.finishStage("bossLose");
		});
	});

	stageManager.defineStage("gameOver", () => {
		const sound = play("gameOverJingle");

		const gameoverText = addTextPrompt(wareApp, "GAME OVER", 1, ctx);
		gameoverText.overrideAnimation = true;

		// the shaky letters
		let magnitude = 0;
		let angle = 0;
		gameoverText.onUpdate(() => {
			magnitude = k.lerp(magnitude, k.randi(2, 8), 0.1);
			angle = k.lerp(angle, angle + 1, 0.1) % 360;
			gameoverText.textTransform = (idx, ch) => ({
				pos: k.vec2(magnitude * Math.cos(angle * ((idx % 2) + 1) + 1), magnitude * Math.sin(angle * ((idx % 2) + 1) + 1)),
			});
		});

		// the jumpy
		tween(0, 1.2, sound.duration() / 2, (p) => gameoverText.scale.x = p, k.easings.easeOutExpo);
		tween(0, 0.9, sound.duration() / 2, (p) => gameoverText.scale.y = p, k.easings.easeOutExpo).onEnd(() => {
			tween(gameoverText.scale, k.vec2(1), sound.duration() / 2, (p) => gameoverText.scale = p, k.easings.easeOutElastic).onEnd(() => {
			});
		});

		wait(sound.duration() / opts.speed, () => {
			stageManager.finishStage("gameOver");
		});
	});
};

export default chillTransition;
