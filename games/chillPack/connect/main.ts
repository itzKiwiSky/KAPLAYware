import { GameObj } from "kaplay";
import { Microgame } from "../../../src/types/Microgame";

const connectGame: Microgame = {
	name: "connect",
	pack: "chill",
	author: "amyspark-ng",
	prompt: "CONNECT!",
	input: "mouse",
	rgb: (k) => k.mulfok.DARK_BLUE,
	// duration: (k) => k.difficulty == 3 ? 7 : 5,
	duration: undefined,
	urlPrefix: "games/chillPack/connect/",
	colorDependant: true,
	load(k) {
		k.loadSprite("socket", "sprites/socket.png");
		k.loadSprite("plug", "sprites/plug.png");
		k.loadSprite("box", "sprites/box.png");
		k.loadSound("plug", "sounds/plug.ogg");
		k.loadSound("unplug", "sounds/unplug.ogg");
	},
	// TODO: Do the remake
	start(k) {
		const allColors = [
			k.Color.fromHex("#cc425e"),
			k.Color.fromHex("#6bc96c"),
			k.Color.fromHex("#8db7ff"),
			k.Color.fromHex("#ffb879"),
			k.Color.fromHex("#fcef8d"),
			k.Color.fromHex("#ee8fcb"),
		];

		const COLOR_AMOUNT = k.difficulty + 1;
		const gameColors = k.chooseMultiple(allColors, COLOR_AMOUNT);

		const sockets: GameObj[] = [];
		const plugs: GameObj[] = [];

		gameColors.forEach((color, idx, arr) => {
			const socketObj = k.add([
				k.sprite("socket"),
				k.color(color),
				k.pos(0, 0),
				k.area(),
				k.anchor("top"),
				k.z(2),
				"socket",
				"ignorepoint",
				{
					plug: null as typeof plugObj,
				},
			]);

			sockets[idx] = socketObj;

			const plugObj = k.add([
				k.sprite("plug"),
				k.color(color),
				k.pos(k.center().x, k.height()),
				k.area({ scale: k.vec2(1, 0.5), offset: k.vec2(0, 50) }),
				k.anchor("top"),
				k.z(1),
				"plug",
				{
					socket: null as typeof socketObj,
					originX: socketObj.pos.x,
					dragging: false,
				},
			]);

			plugObj.pos.y = k.height() - plugObj.height;
			plugs[idx] = plugObj;

			k.onDraw(() => {
				const cableOrigin = plugObj.pos.add(0, plugObj.height - 15);
				const h = k.vec2(plugObj.originX, k.height()).dist(cableOrigin); // height
				const w = k.map(h, 0, k.height(), 5, 10); // amplitude
				const f = k.mapc(h, 0, k.height(), 10, 100); // frequency
				const pos = k.vec2(plugObj.originX, k.height() + 20);
				const angle = pos.angle(cableOrigin) - 90;

				k.drawCurve(t => k.vec2(w * Math.cos(f * t), t * -h).rotate(angle), {
					color: k.mulfok.VOID_VIOLET,
					width: 20,
					pos: pos,
				});
			});

			plugObj.onUpdate(() => {
				// conection flag
				const plugs = k.get("plug").find((plug) => plug.dragging);
				const currentPlug = plugs[0]; // find may return undefined

				if (socketObj.isHovering() && currentPlug) {
					currentPlug.dragging = false;
					currentPlug.socket = socketObj;
					socketObj.plug = currentPlug;
					k.play("plug", { detune: k.rand(-100, 100) });
				}

				// this causes win flag condition
				if (socketObj.plug == plugObj && !socketObj.is("right")) {
					socketObj.tag("right");
					plugObj.tag("ignorepoint");
				}

				// if the socket has the right plug don't check anything else
				if (socketObj.is("right")) return;

				// this sets draggging
				if (plugObj.isClicked()) {
					plugObj.dragging = true;

					// if there's no socket don't run anything
					if (!plugObj.socket) return;
					plugObj.socket.plug = null;
					plugObj.socket = null;
					k.play("unplug", { detune: k.rand(-100, 100) });
				}

				// this only runs if dragging
				if (!plugObj.dragging) return;
				plugObj.pos = k.vec2(k.mousePos().x, k.mousePos().y - plugObj.height / 2);
				if (k.isButtonReleased("click")) plugObj.dragging = false;
			});
		});

		// this code mixes them up
		let socketGap = (k.width() - k.getSprite("socket").data.width * sockets.length) / (sockets.length + 1);
		let socketX = socketGap;
		sockets.forEach((socket) => {
			socket.pos.x = socketX;
			socketX += socketGap + socket.width;
		});

		plugs.sort(() => Math.random() - 0.5); // shuffles them
		let sourceGap = (k.width() - k.getSprite("plug").data.width * plugs.length) / (plugs.length + 1);
		let sourceX = sourceGap;
		plugs.forEach((plug) => {
			plug.originX = sourceX;
			plug.pos.x = sourceX;
			sourceX += sourceGap + plug.width;
		});

		k.onUpdate(() => {
			if (k.get("socket").every((socket) => socket.is("right")) && !k.winState) {
				k.win();
				k.wait(1 / k.speed, () => k.finish());
			}
		});

		k.onTimeout(() => {
			if (!(k.get("socket").every((socket) => socket.is("right")) && !k.winState)) {
				k.lose();
				k.wait(1 / k.speed, () => k.finish());
			}
		});
	},
};

export default connectGame;
