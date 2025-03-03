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

		const COLOR_AMOUNT = ctx.difficulty == 1 ? 3 : ctx.difficulty == 2 ? 4 : ctx.difficulty == 3 ? 5 : 0;

		const gameColors = pickRandom(allColors, COLOR_AMOUNT);
		const shuffledColors = shuffleArray(gameColors);

		const START_POS = ctx.vec2(50, 150);
		const SIZE = ctx.vec2(100, 100);
		const sockets: GameObj[] = [];
		const plugs: GameObj[] = [];
		const plugsConnected: number[] = [];
		let curPlugIdx: number = null;

		gameColors.forEach((color, index, arr) => {
			const socket = game.add([
				ctx.rect(SIZE.x, SIZE.y),
				ctx.color(color),
				ctx.pos(START_POS.add(SIZE.x * 1.2 * index, 0)),
				ctx.outline(5, ctx.BLACK),
				ctx.anchor("center"),
				ctx.area(),
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
			]);

			plug.onClick(() => {
				if (plugsConnected.includes(index)) return;
				curPlugIdx = index;
			});

			ctx.onButtonRelease("click", () => {
				curPlugIdx = null;

				if (socket.isHovering()) {
					plugsConnected.push(index);
				}
			});

			plugs[index] = plug;
			sockets[index] = socket;
		});

		ctx.onButtonRelease("click", () => {
			if (plugsConnected.length == gameColors.length) {
				ctx.win();
				ctx.wait(1, () => {
					ctx.debug.log("FINISHED WON CONNECT GAME");
					ctx.finish();
				});
			}
		});

		game.onDraw(() => {
			// draw the connected ones
			plugsConnected.forEach((index) => {
				ctx.drawLine({
					p1: plugs[index].pos,
					p2: sockets[index].pos,
					color: gameColors[index],
					width: 10,
					outline: {
						width: 5,
						color: ctx.BLACK,
					},
				});
			});

			// draw the current wire
			if (curPlugIdx != null) {
				ctx.drawLine({
					p1: plugs[curPlugIdx].pos,
					p2: ctx.mousePos(),
					color: gameColors[curPlugIdx],
					width: 10,
					outline: {
						width: 5,
						color: ctx.BLACK,
					},
				});
			}
		});

		ctx.onTimeout(() => {
			if (plugsConnected.length < gameColors.length) {
				ctx.wait(1, () => {
					ctx.finish();
					ctx.debug.log("FINISHED LOST CONNECT GAME");
				});
				ctx.lose();
			}
		});

		return game;
	},
};

export default newGame;
