import { GameObj, Vec2 } from "kaplay";
import { Minigame, MinigameCtx } from "../../src/game/types.ts";

function getHexagonShape(ctx: MinigameCtx) {
	// some cool math
	const pts = [] as Vec2[];
	for (let i = 0; i < 6; i++) {
		const angle = Math.PI / 3 * i;
		const x = -221 * Math.cos(angle);
		const y = -221 * Math.sin(angle);
		pts.push(ctx.vec2(x, y));
	}
	return new ctx.Polygon(pts);
}

function addBackground(ctx: MinigameCtx) {
	const col1D = ctx.Color.fromHex("#291834");
	const col2D = ctx.Color.fromHex("#36213f");

	const bg = ctx.add([
		ctx.rect(ctx.width(), ctx.height()),
		ctx.pos(ctx.center()),
		ctx.anchor("center"),
		ctx.scale(8),
		{
			speed: 0.1,
		},
	]);

	// TODO: Fix background looking all weird
	bg.use(ctx.shader("background", () => ({
		"u_time": ctx.time() / 10,
		"u_color1": col1D,
		"u_color2": col2D,
		"u_speed": ctx.vec2(-1, 2).scale(bg.speed),
		"u_angle": 5,
		"u_scale": 2,
		"u_aspect": ctx.width() / ctx.height(),
	})));

	return bg;
}

function addComboText(ctx: MinigameCtx) {
	let blendFactor = 0;
	let words = ["MAX COMBO", "MAX COMBO!!", "YOO-HOO!!!", "YEEEOUCH!!", "FINISH IT"];
	let maxComboText = ctx.add([
		ctx.text(`[combo]${ctx.choose(words)}[/combo]`, {
			size: 55,
			align: "center",
			styles: {
				"combo": (idx) => ({
					pos: ctx.vec2(0, ctx.wave(-4, 4, ctx.time() * 6 + idx * 0.5)),
					color: ctx.WHITE.lerp(ctx.hsl2rgb((ctx.time() * 0.2 + idx * 0.1) % 1, 0.7, 0.8), blendFactor),
				}),
			},
		}),
		ctx.pos(ctx.vec2(ctx.mousePos().x, ctx.mousePos().y - 65)),
		ctx.color(),
		ctx.scale(),
		ctx.opacity(),
		ctx.anchor("center"),
		ctx.timer(),
		{
			update() {
				this.pos.y -= 1;

				blendFactor = 1;
				if (ctx.time() % 0.25 > (0.1 / 2)) blendFactor = 1;
				else blendFactor = 0;
			},
		},
	]);

	let timeToDie = 2;
	maxComboText.tween(ctx.vec2(0.5), ctx.vec2(1), 0.1, (p) => maxComboText.scale = p, ctx.easings.easeOutQuad);
	maxComboText.tween(0.5, 1, 0.1, (p) => maxComboText.opacity = p, ctx.easings.easeOutQuint).onEnd(() => {
		maxComboText.tween(maxComboText.opacity, 0, timeToDie, (p) => maxComboText.opacity = p, ctx.easings.easeOutQuint);
		maxComboText.wait(timeToDie, () => {
			maxComboText.destroy();
		});
	});
}

const clickGame: Minigame = {
	prompt: "click",
	author: "amyspark-ng", // of course
	rgb: [41, 24, 52],
	input: "mouse",
	playsOwnMusic: true,
	urlPrefix: "games/amyspark-ng/assets/",
	duration: (ctx) => ctx.difficulty == 3 ? 6 : 4,
	load(ctx) {
		ctx.loadSprite("hexagon", "sprites/click/hexagon.png");
		ctx.loadSprite("background", "sprites/click/background.png");
		ctx.loadSound("music", "sounds/clicker.ogg");
		ctx.loadSound("fullcombo", "sounds/clickeryfullcombo.ogg");
		ctx.loadSound("explode", "sounds/explode.mp3");
		ctx.loadSound("clickpress", "sounds/clickPress.ogg");
		// made by MF
		ctx.loadShader(
			"background",
			null,
			`
	uniform float u_time;
	uniform vec3 u_color1;
	uniform vec3 u_color2;
	uniform vec2 u_speed;
	uniform float u_angle;
	uniform float u_scale;
	uniform float u_aspect;
	
	#define PI 3.14159265359
	vec4 frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {
		float angle = u_angle * PI / 180.0;
		mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
		vec2 size = vec2(u_scale);
		vec2 p = (pos + vec2(u_time) * u_speed) * vec2(u_aspect, 1.0);
		p = p * rot;
		float total = floor(p.x * size.x) + floor(p.y * size.y);
		bool isEven = mod(total, 2.0) == 0.0;
		vec4 col1 = vec4(u_color1 / 255.0, 1.0);
		vec4 col2 = vec4(u_color2 / 255.0, 1.0);
		return (isEven) ? col1 : col2;
	}
	`,
		);
	},
	start(ctx) {
		const SCORE_TO_WIN = ctx.difficulty == 1 ? ctx.randi(4, 6) : ctx.difficulty == 2 ? ctx.randi(8, 10) : ctx.difficulty == 3 ? ctx.randi(18, 20) : ctx.rand(18, 20);
		let score = 0;
		let spinspeed = ctx.speed;
		let clicksInSecond = 0;
		let secondTimer = 0;

		addBackground(ctx);
		ctx.play("music", { speed: ctx.speed });

		const scoreText = ctx.add([
			ctx.text(`0/${SCORE_TO_WIN}`),
			ctx.pos(ctx.center().x, 60),
			ctx.anchor("center"),
			ctx.scale(2),
			ctx.rotate(0),
		]);

		const cpsText = scoreText.add([
			ctx.text("0/sec"),
			ctx.pos(0, 25),
			ctx.scale(0.5),
			ctx.anchor("center"),
		]);

		const hexagon = ctx.add([
			ctx.sprite("hexagon"),
			ctx.anchor("center"),
			ctx.color(),
			ctx.opacity(),
			ctx.pos(ctx.center().x, ctx.center().y + 50),
			ctx.rotate(ctx.rand(0, 360)),
			ctx.area({ scale: ctx.vec2(0.85), shape: getHexagonShape(ctx) }),
			ctx.scale(),
		]);

		hexagon.onUpdate(() => {
			const hexagonClicked = hexagon.isHovering() && ctx.isInputButtonDown("click");
			hexagon.scale = ctx.lerp(hexagon.scale, hexagonClicked ? ctx.vec2(0.95) : ctx.vec2(1), 0.25);
			hexagon.angle = ctx.lerp(hexagon.angle, hexagon.angle + 0.1 + (score / 8 * spinspeed), 0.5);
			scoreText.angle = ctx.wave(-15, 15, ctx.time() * ctx.speed);
			secondTimer += ctx.dt();
			if (secondTimer >= 1) {
				cpsText.text = `${clicksInSecond}/sec`;
				secondTimer = 0;
				clicksInSecond = 0;
			}
		});

		hexagon.onClick(() => {
			score++;
			clicksInSecond++;
			ctx.tween(ctx.vec2(2.25), ctx.vec2(2), 0.75 / ctx.speed, (p) => scoreText.scale = p, ctx.easings.easeOutQuint);
			ctx.play("clickpress", { detune: ctx.rand(-100, 100) });
			scoreText.text = `${score.toString()}/${SCORE_TO_WIN}`;
			const plusScoreText = ctx.add([
				ctx.text("+1"),
				ctx.anchor("center"),
				ctx.opacity(),
				ctx.scale(1.5),
				ctx.pos(ctx.mousePos().add(ctx.rand(-10, 10), ctx.rand(-10, 10))),
			]);
			plusScoreText.fadeOut(1 / ctx.speed, ctx.easings.easeOutQuad).onEnd(() => plusScoreText.destroy());
			plusScoreText.onUpdate(() => plusScoreText.move(0, ctx.rand(-80, -90) * ctx.speed));
		});

		ctx.onInputButtonRelease("click", () => {
			ctx.play("clickpress", { detune: ctx.rand(-400, -200) });
		});

		if (ctx.difficulty == 3) hexagon.color = ctx.choose(Object.values(ctx.mulfok)).lerp(ctx.WHITE, 0.5);

		ctx.onTimeout(() => {
			if (score >= SCORE_TO_WIN) {
				ctx.play("fullcombo", { detune: ctx.rand(-50, 50) });
				ctx.win();
				addComboText(ctx);
				ctx.addConfetti({ pos: ctx.mousePos() });
				ctx.tween(-25, 0, 1 / ctx.speed, (p) => ctx.setCamAngle(p), ctx.easings.easeOutQuint);
			}
			else {
				ctx.shakeCam();
				ctx.lose();
				ctx.tween(hexagon.pos.y, ctx.height() * 1.5, 1 / ctx.speed, (p) => hexagon.pos.y = p, ctx.easings.easeOutExpo);
				ctx.tween(spinspeed, spinspeed * 2, 1 / ctx.speed, (p) => spinspeed = p, ctx.easings.easeOutExpo);
				ctx.play("explode", { detune: ctx.rand(-50, 50) });
				hexagon.fadeOut(1 / ctx.speed, ctx.easings.easeOutQuint);
			}

			ctx.wait(1.5 / ctx.speed, () => {
				ctx.finish();
			});
		});
	},
};

export default clickGame;
