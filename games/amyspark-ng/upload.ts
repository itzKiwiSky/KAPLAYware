import { Minigame } from "../../src/game/types";
import { curDraggin } from "../../src/plugins/drag";

const uploadGame: Minigame = {
	prompt: "upload",
	author: "amyspark-ng",
	rgb: (ctx) => ctx.mulfok.DARK_BEANT_BLUE,
	duration: 4,
	input: "mouse",
	urlPrefix: "games/amyspark-ng/assets/sprites/upload/",
	load(ctx) {
		ctx.loadSprite("window", "window.png");
		ctx.loadSprite("win", "win.png");
		ctx.loadSprite("lose", "lose.png");
		ctx.loadSprite("banned", "banned.png");
	},
	start(ctx) {
		let hasUploaded = false;

		function addFile(spr: string) {
			const randFilePos = () => ctx.vec2(ctx.rand(20, 50), ctx.rand(10, ctx.height() - 30));

			const file = ctx.add([
				ctx.sprite(`@${spr}`),
				ctx.pos(randFilePos()),
				ctx.scale(),
				ctx.area(),
				ctx.anchor("center"),
			]);
			file.add([
				ctx.text(`${spr}.png`, { align: "center", size: 10, font: "happy" }),
				ctx.opacity(0.5),
				ctx.pos(0, file.height / 2 + 10),
				ctx.anchor("center"),
			]);

			file.onClick(() => {
				if (hasUploaded) return;

				const ghostFile = ctx.add([
					ctx.sprite(file.sprite),
					ctx.opacity(0.5),
					ctx.drag(),
					ctx.pos(file.pos),
					ctx.area(),
					ctx.anchor("center"),
				]);
				ghostFile.add([
					ctx.text(`${spr}.png`, { align: "center", size: 10, font: "happy" }),
					ctx.opacity(0.5),
					ctx.pos(0, ghostFile.height / 2 + 10),
					ctx.anchor("center"),
				]);
				ghostFile.pick();

				ctx.onMouseRelease(() => ghostFile.drop());
				ghostFile.onDragEnd(() => {
					if (!ghostFile.dragging || hasUploaded) return;

					if (!dropArea.isHovering() && ghostFile.exists()) {
						file.pos = ctx.mousePos();
						ghostFile.destroy();
					}
					else if (dropArea.isHovering()) {
						ghostFile.destroy();
						hasUploaded = true;
						if (spr == "kat") {
							desktop.sprite = "win";
							ctx.win();
						}
						else if (spr == "zombean") {
							desktop.sprite = "lose";
							ctx.wait(0.5 / ctx.speed, () => desktop.sprite = "banned");
							ctx.lose();
						}

						ctx.wait(1 / ctx.speed, () => ctx.finish());
					}
				});
			});

			return file;
		}

		const desktop = ctx.add([
			ctx.sprite("window"),
		]);

		const dropArea = ctx.add([
			ctx.rect(415, 482),
			ctx.area(),
			ctx.color(ctx.BLACK),
			ctx.pos(362, 39),
			ctx.opacity(0),
			"ignorepoint",
		]);

		ctx.onUpdate(() => {
			if (dropArea.isHovering() && !hasUploaded && curDraggin != null) dropArea.opacity = ctx.lerp(dropArea.opacity, 0.5, 0.5);
			else dropArea.opacity = ctx.lerp(dropArea.opacity, 0, 0.5);
		});

		addFile("kat");
		addFile("zombean");

		ctx.onTimeout(() => {
			if (!hasUploaded) {
				desktop.sprite = "banned";
				ctx.lose();
				ctx.wait(0.5 / ctx.speed, () => {
					ctx.finish();
				});
			}
		});
	},
};

export default uploadGame;
