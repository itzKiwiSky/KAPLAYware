import { assets } from "@kaplayjs/crew";
import kaplay, { Color, GameObj, Vec2 } from "kaplay";
import { Minigame } from "../../src/types.ts";

function shuffleArray<T extends any>(arr: T[]): T[] {
	const copy = [...arr];
	copy.sort(() => Math.random() - 0.5);
	return copy;
}

function pickRandom<T extends any>(arr: T[], amount: number): T[] {
	const copy = [...arr];
	return copy.sort(() => 0.5 - Math.random()).slice(0, amount);
}

const newGame: Minigame = {
	prompt: "connect",
	author: "amyspark-ng",
	mouse: { hidden: false },
	rgb: [78, 24, 124],
	duration: 5,
	urlPrefix: "games/amyspark-ng/assets",
	load(ctx) {
		ctx.loadSprite("bean", assets.bean.sprite);
	},
	start(ctx) {
		const game = ctx.make();

		const allColors = [
			ctx.Color.fromHex("#cc425e"),
			ctx.Color.fromHex("#6bc96c"),
			ctx.Color.fromHex("#8db7ff"),
			ctx.Color.fromHex("#ffb879"),
			ctx.Color.fromHex("#ee8fcb"),
		];

		const COLOR_AMOUNT = ctx.difficulty == 1 ? 2 : ctx.difficulty == 2 ? 3 : ctx.difficulty == 3 ? 4 : 0;

		const gameColors = pickRandom(allColors, COLOR_AMOUNT);
		const shuffledColors = shuffleArray(gameColors);

		const START_POS = ctx.vec2(50, 150);
		const SIZE = ctx.vec2(100, 100);
		const sockets: GameObj[] = [];
		const plugs: GameObj[] = [];
		const plugSocketState: ("wiring" | "connected" | "disconnected")[] = [];
		const winCondition = () => !plugSocketState.some((state) => state != "connected");

		gameColors.forEach((color, index, arr) => {
			plugSocketState[index] = "disconnected";

			const socket = game.add([
				ctx.rect(SIZE.x, SIZE.y),
				ctx.color(color),
				ctx.pos(START_POS.add(SIZE.x * 1.2 * index, 0)),
				ctx.outline(5, ctx.BLACK),
				ctx.anchor("center"),
				ctx.area(),
				"socket",
			]);

			// create plug
			let plug_pos = ctx.vec2(START_POS.x + SIZE.x * 1.2 * shuffledColors.indexOf(color), ctx.height() * 0.75);

			const plug = game.add([
				ctx.rect(SIZE.x, SIZE.y),
				ctx.color(color),
				ctx.pos(plug_pos),
				ctx.outline(5, ctx.BLACK),
				ctx.anchor("center"),
				ctx.area(),
				"plug",
			]);

			plug.onClick(() => {
				if (plugSocketState[index] == "disconnected") {
					plugSocketState[index] = "wiring";
				}
			});

			ctx.onButtonRelease("click", () => {
				if (socket.isHovering() && plugSocketState[index] == "wiring") {
					plugSocketState[index] = "connected";
				}
				else {
					if (plugSocketState[index] != "connected") plugSocketState[index] = "disconnected";
				}
			});

			plugs[index] = plug;
			sockets[index] = socket;
		});

		ctx.onButtonRelease("click", () => {
			if (winCondition()) {
				ctx.win();
				ctx.wait(1, () => ctx.finish());
			}
		});

		game.onDraw(() => {
			// draw the connected ones
			gameColors.forEach((color, index) => {
				if (plugSocketState[index] == "disconnected") return;

				ctx.drawLine({
					p1: plugs[index].pos,
					p2: plugSocketState[index] == "wiring" ? ctx.mousePos() : sockets[index].pos,
					color: gameColors[index],
					width: 10,
					outline: {
						width: 5,
						color: ctx.BLACK,
					},
				});
			});
		});

		ctx.onTimeout(() => {
			if (!winCondition()) {
				ctx.lose();
				ctx.wait(1, () => {
					ctx.finish();
				});
			}
		});

		return game;
	},
};

export default newGame;
