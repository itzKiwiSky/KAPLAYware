import { Microgame } from "../../../src/types/Microgame";

const dodgeGame: Microgame = {
	name: "dodge",
	pack: "chill",
	author: "amyspark-ng",
	prompt: "DODGE!",
	input: "keys",
	duration: (ctx) => ctx.difficulty == 1 || ctx.difficulty == 2 ? 6 : 8,
	rgb: [255, 255, 255],
	urlPrefix: "games/chillPack/dodge/",
	load(ctx) {
		ctx.loadSprite("dino", "sprites/dino.png", { sliceX: 5, sliceY: 1 });
		ctx.loadSprite("ptero", "sprites/ptero.png", { sliceX: 2, sliceY: 1 });
		ctx.loadSprite("overlay", "sprites/overlay.png", { sliceX: 2, sliceY: 1 });
		ctx.loadSprite("comet", "sprites/comet.png", { sliceX: 2, sliceY: 1 });
		ctx.loadSprite("cactus", "sprites/cactus.png");
		ctx.loadSprite("cloud", "sprites/cloud.png");
		ctx.loadSprite("ground", "sprites/ground.png");
		ctx.loadSprite("sand", "sprites/sand.png");
		ctx.loadSprite("gameover", "sprites/gameover.png");
		ctx.loadSprite("kaboom", "sprites/kaboom.png");
		ctx.loadSprite("wifi", "sprites/wifi.png");
		ctx.loadSound("jump", "sounds/dino-jump.wav");
		ctx.loadSound("explosion", "sounds/explosion.wav");
	},
	// TODO: Touch up (add the browser overlya)
	start(ctx) {
		ctx.setGravity(3500);
		const overlay = ctx.add([ctx.sprite("overlay")]);
		const game = ctx.add([]);

		const isDarkMode = ctx.difficulty == 3;
		const SPEED = ctx.speed * 2;
		const DARK_COLOR = ctx.Color.fromHex("#4b3153");
		const GROUND_Y = 370;
		const frequencyChanger = () => 1 + 0.17 * ctx.difficulty;

		let frame = 0;
		let cloudTimer = 3;
		let sandTimer = 1.5;
		let cactusTimer = 1;
		let pteroTimer = 0.5;

		const dino = game.add([
			ctx.sprite("dino"),
			ctx.pos(85, GROUND_Y + 30),
			ctx.area({ scale: ctx.vec2(0.35, 1) }),
			ctx.body(),
			ctx.anchor("bot"),
			ctx.z(1),
			ctx.color(DARK_COLOR),
			"primary",
			{
				cJump() {
					dino.jump(1100);
					ctx.play("jump", { detune: ctx.rand(-50, 50) });
				},
			},
		]);

		// https://github.com/MaxRohowsky/chrome-dinosaur/blob/master/main.py

		const ground = game.add([
			ctx.rect(ctx.width(), 100, { fill: false }),
			ctx.area({ offset: ctx.vec2(0, 30) }),
			ctx.pos(0, GROUND_Y),
			ctx.body({ isStatic: true }),
			ctx.color(DARK_COLOR),
			"primary",
		]);

		let groundX = 0;
		ground.onDraw(() => {
			ctx.drawSprite({
				sprite: "ground",
				pos: ctx.vec2(groundX, 0),
				tiled: true,
				width: ctx.width(),
				color: ground.color,
			});

			ctx.drawSprite({
				sprite: "ground",
				pos: ctx.vec2(groundX + ctx.width(), 0),
				tiled: true,
				width: ctx.width(),
				color: ground.color,
			});
		});

		ctx.onUpdate(() => {
			if (game.paused) return;
			groundX -= 250 * SPEED * ctx.dt();
			if (groundX <= -ctx.width()) groundX = 0;

			frame = Math.round((ctx.time() / SPEED * 3.5) % 1);
			if (ctx.isButtonDown("down")) {
				if (dino.isGrounded()) dino.frame = 2 + frame;
				dino.area.scale.y = 0.5;
				dino.gravityScale = 2;
			}
			else {
				if (dino.isGrounded()) dino.frame = frame;
				dino.area.scale.y = 1;
				dino.gravityScale = 1;
			}

			cloudTimer += ctx.dt();
			if (cloudTimer >= ctx.rand(3, 5)) {
				cloudTimer = 0;
				const cloud = game.add([
					ctx.sprite("cloud"),
					ctx.pos(ctx.width() + 25, ctx.rand(120, 260)),
					ctx.anchor("center"),
					ctx.opacity(0.5),
					ctx.z(0),
					ctx.color(isDarkMode ? ctx.WHITE : DARK_COLOR),
					ctx.scale(ctx.rand(0.8, 1)),
					"primary",
				]);

				let xSpeed = ctx.rand(70, 140);

				cloud.onUpdate(() => {
					cloud.pos.x -= xSpeed * SPEED * ctx.dt();
					if (cloud.pos.x < -50) cloud.destroy();
				});
			}

			// TODO: have to see what to do with primaries, which ones should get turned dark inmediately, or make it so everytime one is added yeah that thing

			sandTimer += ctx.dt();
			if (sandTimer >= ctx.rand(1.5, 3.5)) {
				sandTimer = 0;
				const sand = game.add([
					ctx.sprite("sand", { flipX: ctx.choose([true, false]), flipY: ctx.choose([true, false]) }),
					ctx.pos(ctx.width() + 50, 400),
					ctx.color(isDarkMode ? ctx.WHITE : DARK_COLOR),
					ctx.anchor("center"),
					ctx.scale(ctx.rand(0.9, 1)),
					"primary",
				]);

				sand.onUpdate(() => {
					sand.pos.x -= 250 * SPEED * ctx.dt();
					if (sand.pos.x < -100) sand.destroy();
				});
			}

			// obstacles
			// check if there's no obstacles to add a new one or check length depending on difficulty
			cactusTimer += ctx.dt();
			if (cactusTimer >= ctx.rand(2, 4.5) / frequencyChanger()) {
				cactusTimer = 0;
				const cactus = game.add([
					ctx.sprite("cactus", { flipX: ctx.choose([true, false]) }),
					ctx.pos(ctx.width(), ctx.rand(400, 410)),
					ctx.color(isDarkMode ? ctx.WHITE : DARK_COLOR),
					ctx.anchor("bot"),
					ctx.area({ scale: ctx.vec2(0.75) }),
					ctx.scale(ctx.rand(0.9, 1.1)),
					"primary",
					"obstacle",
				]);

				cactus.onUpdate(() => {
					cactus.pos.x -= 250 * SPEED * ctx.dt();
					if (cactus.pos.x < -50) cactus.destroy();
				});

				if (ctx.difficulty > 1 && ctx.chance(0.5)) {
					cactus.scale.x = 1.5;
					cactus.area.scale.x = 1.5;
					cactus.onDraw(() => {
						ctx.drawSprite({
							sprite: "cactus",
							scale: ctx.vec2(0.5),
							pos: ctx.vec2(-35, -45),
							color: cactus.color,
						});

						ctx.drawSprite({
							sprite: "cactus",
							scale: ctx.vec2(0.5),
							pos: ctx.vec2(20, -45),
							color: cactus.color,
						});
					});
				}
			}

			// ptero stuff
			pteroTimer += ctx.dt();
			if (pteroTimer >= ctx.rand(3, 5) / frequencyChanger() && ctx.difficulty >= 2) {
				// top middle and bottom respectively
				const pteroYs = [220, 295, 360];
				let pteroY = ctx.choose(pteroYs);

				// if the timing is right, but the conditions aren't
				// hold on to it until they are
				const obstaclesFar = ctx.get("obstacle").some((obs) => ctx.width() - obs.pos.x < 800);
				if (!obstaclesFar && cactusTimer < 1) return;

				pteroTimer = 0;
				const ptero = game.add([
					ctx.sprite("ptero"),
					ctx.pos(ctx.width(), pteroY),
					ctx.color(isDarkMode ? ctx.WHITE : DARK_COLOR),
					ctx.anchor("center"),
					ctx.area({ scale: ctx.vec2(0.75, 0.6) }),
					"primary",
					"obstacle",
				]);

				// if no cactus or at least one, add ptero on top
				// if 2 cactus on screen add on middle or top

				// determine the Y pos based on the current obstacles

				let pteroSpeed = ctx.rand(270, 290);
				ptero.onUpdate(() => {
					ptero.frame = frame;
					ptero.pos.x -= pteroSpeed * SPEED * ctx.dt();
					if (ptero.pos.x < -50) ptero.destroy();
				});
			}
		});

		if (isDarkMode) {
			overlay.frame = 1;

			ctx.tween(ctx.WHITE, DARK_COLOR, 0.25 / ctx.speed, (p) => ctx.setRGB(p));
			game.get("primary").forEach((obj) => ctx.tween(obj.color, ctx.WHITE, 0.25 / ctx.speed, (p) => obj.color = p));
			game.get("secondary").forEach((obj) => ctx.tween(obj.color, DARK_COLOR, 0.25 / ctx.speed, (p) => obj.color = p));
		}

		ctx.onButtonPress(["action", "up"], dino.cJump);

		dino.onCollide("obstacle", () => {
			game.paused = true;
			dino.frame = 4;
			ctx.lose();
			ctx.play("jump", { detune: -500, speed: 0.5 });
			ctx.add([ctx.sprite("gameover"), ctx.color(isDarkMode ? ctx.WHITE : DARK_COLOR)]);
			ctx.wait(2 / ctx.speed, () => ctx.finish());
			const comet = ctx.add([
				ctx.sprite("comet", { frame: isDarkMode ? 1 : 0 }),
				ctx.pos(700, 200),
				ctx.anchor("center"),
			]);

			ctx.tween(comet.pos, dino.pos, 0.25 / ctx.speed, (p) => comet.pos = p).onEnd(() => {
				ctx.play("explosion");
				const kaboom = ctx.add([
					ctx.sprite("kaboom"),
					ctx.pos(dino.pos),
					ctx.scale(),
					ctx.color(dino.color),
					ctx.anchor("center"),
				]);

				ctx.tween(kaboom.scale, ctx.vec2(4.5), 0.5 / ctx.speed, (p) => kaboom.scale = p, ctx.easings.easeOutQuint).onEnd(() => {
					ctx.finish();
				});
			});
		});

		ctx.onTimeout(() => {
			if (game.paused) return;
			ctx.win();

			game.destroy();
			ctx.add([ctx.sprite("wifi"), ctx.color(isDarkMode ? ctx.WHITE : DARK_COLOR)]);
			ctx.wait(1 / ctx.speed, () => ctx.finish());
		});
	},
};

export default dodgeGame;
