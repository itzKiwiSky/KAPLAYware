import { Microgame } from "../../../src/types/Microgame";

const swatGame: Microgame = {
	name: "swat",
	pack: "chill",
	author: "amyspark-ng",
	prompt: "SWAT!",
	rgb: (ctx) => ctx.mulfok.LIGHT_BROWN,
	duration: (ctx) => ctx.difficulty == 3 ? 5 : 4,
	input: "mouse (hidden)",
	urlPrefix: "games/chillPack/swat/",
	load(ctx) {
		ctx.loadSprite("manopla", "sprites/manopla.png");
		ctx.loadSprite("shock", "sprites/shock.png");
		ctx.loadSprite("fly", "sprites/fly.png");
		ctx.loadSprite("table", "sprites/table.png");
		ctx.loadSprite("flowervase", "sprites/flowervase.png", { sliceX: 2, sliceY: 1 });
		ctx.loadSprite("picture", "sprites/picture.png", { sliceX: 2, sliceY: 1 });
		ctx.loadSprite("lightbulb", "sprites/lightbulb.png", { sliceX: 2, sliceY: 1 });
		ctx.loadSound("slap", "sounds/slap.mp3");
		ctx.loadSound("bzz", "sounds/bzz.mp3");
		ctx.loadSound("breakglass", "sounds/breakglass.ogg");
		ctx.loadSound("breakvase", "sounds/breakvase.ogg");
	},
	// TODO: Touch up the gameplay, flies are annoying
	start(ctx) {
		const table = ctx.add([
			ctx.sprite("table"),
			ctx.pos(200, 606),
			ctx.anchor("bot"),
		]);

		const flowervase = ctx.add([
			ctx.sprite("flowervase"),
			ctx.pos(208, 436),
			ctx.anchor("bot"),
			ctx.area({ scale: ctx.vec2(0.25, 0.5), offset: ctx.vec2(-10, 0) }),
			"fragile",
			{
				break() {
					this.frame = 1;
					ctx.play("breakvase", { detune: ctx.rand(-50, 50) });
				},
			},
		]);

		const picture = ctx.add([
			ctx.sprite("picture"),
			ctx.pos(652, 300),
			ctx.anchor("top"),
			ctx.area({ scale: ctx.vec2(0.5), offset: ctx.vec2(0, 50) }),
			ctx.rotate(0),
			"fragile",
			{
				break() {
					let angle = ctx.rand(50, 80);
					this.onUpdate(() => {
						angle = ctx.lerp(angle, 0, 0.015);
						this.angle = ctx.lerp(this.angle, ctx.wave(-angle, angle, ctx.time() * ctx.speed), 0.75);
					});

					this.frame = 1;
					ctx.play("breakglass", { detune: ctx.rand(-100, 100) });
				},
			},
		]);

		const lightbulb = ctx.add([
			ctx.sprite("lightbulb"),
			ctx.pos(431, -5),
			ctx.anchor("top"),
			ctx.area(),
			ctx.rotate(),
			"fragile",
			{
				break() {
					this.frame = 1;
					let angle = ctx.rand(50, 80);
					this.onUpdate(() => {
						angle = ctx.lerp(angle, 0, 0.05);
						this.angle = ctx.lerp(this.angle, ctx.wave(-angle, angle, ctx.time() * ctx.speed), 0.75);
					});

					ctx.play("breakglass", { detune: ctx.rand(-150, 150) });
					const dark = ctx.add([
						ctx.rect(ctx.width() * 2, ctx.height() * 2),
						ctx.anchor("center"),
						ctx.pos(),
						ctx.color(ctx.mulfok.VOID_VIOLET),
						ctx.z(5),
						ctx.opacity(0.5),
					]);
					dark.fadeIn(1 / ctx.speed);
				},
			},
		]);

		const manopla = ctx.add([
			ctx.sprite("manopla"),
			ctx.pos(),
			ctx.anchor("top"),
			ctx.z(1),
			ctx.scale(0.75),
		]);

		const getRandFlyPos = () => {
			if (ctx.chance(0.05)) return ctx.choose([flowervase.pos.sub(0, 50), lightbulb.pos.add(0, 50), picture.pos.add(0, 50)]);
			else return ctx.vec2(ctx.rand(50, ctx.width() - 50), ctx.rand(50, ctx.height() - 50));
		};
		let flies = ctx.difficulty;

		ctx.onButtonPress("action", () => {
			// TODO: Removing this line makes the game 1000x more fun i assure you
			if (ctx.get("shock").length > 0) return;

			ctx.play("slap", { detune: ctx.rand(-50, 50), volume: 0.5 });
			ctx.tween(ctx.vec2(0.25), ctx.vec2(0.75), 0.15 / ctx.speed, (p) => manopla.scale = p);
			const shock = ctx.add([
				ctx.sprite("shock"),
				ctx.pos(ctx.mousePos().sub(0, 25)),
				ctx.anchor("center"),
				ctx.area({ scale: ctx.vec2(0.4), offset: ctx.vec2(0, 50) }),
				ctx.z(0),
				ctx.scale(0.5),
				"shock",
			]);
			ctx.tween(ctx.vec2(0.75), ctx.vec2(0.5), 0.15 / ctx.speed, (p) => shock.scale = p);

			shock.onCollide("fragile", (fragile) => {
				fragile.break();
				fragile.untag("fragile");
			});

			shock.onCollide("fly", (fly) => {
				flies--;
				if (flies <= 0 && !ctx.winState) ctx.win();
				fly.tag("dead");
				ctx.play("bzz", { volume: 3, speed: 3 });
				ctx.tween(ctx.vec2(2), ctx.vec2(1), 0.15 / ctx.speed, (p) => fly.scale = p, ctx.easings.easeOutQuint);
				ctx.tween(ctx.RED, ctx.WHITE, 0.15 / ctx.speed, (p) => fly.color = p, ctx.easings.easeOutQuint);
				ctx.tween(fly.angle, 90, 0.15 / ctx.speed, (p) => fly.angle = p, ctx.easings.easeOutQuint);
				ctx.tween(fly.pos.y, ctx.height() + 10, 1 / ctx.speed, (p) => fly.pos.y = p, ctx.easings.easeOutQuint).onEnd(() => {
					if (ctx.winState == true) ctx.finish();
				});
			});

			ctx.wait(0.5 / ctx.speed, () => shock.destroy());
		});

		function addFly() {
			let flyTime = 0.5;
			const bzzSfx = ctx.play("bzz", { loop: true, volume: 1.5 });
			let intendedPos = getRandFlyPos();
			let magnitude = 1;

			const fly = ctx.add([
				ctx.sprite("fly"),
				ctx.anchor("center"),
				ctx.pos(intendedPos),
				ctx.area(),
				ctx.scale(ctx.rand(0.5, 0.75)),
				ctx.color(),
				ctx.rotate(0),
				"fly",
			]);

			fly.onUpdate(() => {
				// fly loop
				bzzSfx.paused = fly.is("dead");

				if (fly.is("dead")) return;
				const flyPos = intendedPos;
				flyPos.x = intendedPos.x + magnitude * Math.cos(ctx.time() * 8 * ctx.speed % 360);
				flyPos.y = intendedPos.y + magnitude * Math.sin(ctx.time() * 8 * ctx.speed % 360);
				fly.pos = ctx.lerp(fly.pos, flyPos, 0.1);

				flyTime -= ctx.dt();
				if (flyTime <= 0) {
					flyTime = ctx.rand(0.5 / ctx.speed, 0.9 / ctx.speed);
					intendedPos = getRandFlyPos();
					magnitude = ctx.rand(1, 2);
				}
			});
		}

		ctx.onUpdate(() => {
			manopla.pos = ctx.lerp(manopla.pos, ctx.mousePos().sub(0, 80), 0.5 * ctx.speed);
		});

		ctx.onTimeout(() => {
			if (flies > 0) {
				ctx.lose();
				ctx.wait(0.5 / ctx.speed, () => ctx.finish());
			}
		});

		for (let i = 0; i < flies; i++) addFly();
	},
};

export default swatGame;
