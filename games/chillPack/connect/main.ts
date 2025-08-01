import { GameObj } from "kaplay";
import { Microgame } from "../../../src/types/Microgame";

const connectGame: Microgame = {
	name: "connect",
	pack: "chill",
	author: "amyspark-ng",
	prompt: "CONNECT!",
	input: "mouse",
	rgb: (k) => k.mulfok.DARK_BLUE,
	duration: (k) => k.difficulty == 3 ? 7 : 5,
	urlPrefix: "games/chillPack/connect/",
	colorDependant: true,
	load(k) {
		k.loadSprite("socket", "sprites/socket.png");
		k.loadSprite("plug", "sprites/plug.png");
		k.loadSprite("box", "sprites/box.png");
		k.loadSprite("light", "sprites/light.png");
		k.loadSprite("sparkles", "sprites/sparkles.png", {
			sliceX: 3,
			sliceY: 1,
			anims: {
				"a": { from: 0, to: 2, loop: true, speed: 2 },
			},
		});
		k.loadSound("plug", "sounds/plug.ogg");
		k.loadSound("unplug", "sounds/unplug.ogg");
		k.loadSound("lightsoff", "sounds/lightsoff.ogg");
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

		const COLOR_AMOUNT = k.difficulty == 3 ? 3 : k.difficulty + 1;
		const gameColors = k.chooseMultiple(allColors, COLOR_AMOUNT);

		gameColors.forEach((color, idx, arr) => {
			const socketObj = k.add([
				k.sprite("socket"),
				k.color(color),
				k.pos(0, 0),
				k.area({ scale: k.vec2(0.75, 0.95) }),
				k.anchor("top"),
				k.z(2),
				"socket",
				"ignorepoint",
				{
					plug: null as typeof plugObj,
				},
			]);

			const plugObj = k.add([
				k.sprite("plug"),
				k.color(color),
				k.pos(k.center().x, k.height()),
				k.area({ scale: k.vec2(0.75, 0.5), offset: k.vec2(0, 50) }),
				k.anchor("top"),
				k.z(1),
				"plug",
				{
					originX: socketObj.pos.x,
					dragging: false,
					getSocket() {
						return k.get("socket").find((socket) => socket.plug == this);
					},
				},
			]);

			plugObj.pos.y = k.height() - plugObj.height;

			k.onDraw(() => {
				const plugOrigin = plugObj.pos.add(0, plugObj.height - 15);
				const h = k.vec2(plugObj.originX, k.height() + 50).dist(plugOrigin); // height
				const w = k.map(h, 0, k.height(), 5, 10); // amplitude
				const f = k.mapc(plugObj.pos.y, k.height(), 119, 5, 100); // frequency
				const pos = k.vec2(plugObj.originX, k.height() + 50);
				const angle = pos.angle(plugOrigin) - 90;

				k.drawCurve(t => k.vec2(w * Math.cos(f * t), t * -h).rotate(angle), {
					color: k.mulfok.VOID_VIOLET.lerp(plugObj.color, 0.1),
					width: 20,
					pos: pos,
				});
			});

			plugObj.onUpdate(() => {
				// if the socket has the right plug don't check anything else
				if (socketObj.is("right")) return;

				// this sets draggging
				if (plugObj.isClicked()) {
					plugObj.dragging = true;

					// if no socket has this plug don't do anything anything
					const socketWithThisPlug = k.get("socket").find((socket) => socket.plug == plugObj);
					if (!socketWithThisPlug) return;
					socketWithThisPlug.plug = null;
					k.play("unplug", { detune: k.rand(-100, 100) });
				}

				// this only runs if dragging
				if (!plugObj.dragging) return;
				plugObj.pos = k.vec2(k.mousePos().x, k.mousePos().y - plugObj.height / 2);
				if (k.isButtonReleased("click")) plugObj.dragging = false;
			});

			socketObj.onUpdate(() => {
				plugObj.pos.x = k.clamp(plugObj.pos.x, 0, k.width());
				plugObj.pos.y = k.clamp(plugObj.pos.y, 0, k.height());

				if (socketObj.plug) {
					if (socketObj.plug == plugObj) {
						// this causes win flag condition
						socketObj.tag("right");
						plugObj.tag("ignorepoint");
					}
					socketObj.plug.pos.x = socketObj.pos.x;
					socketObj.plug.pos.y = socketObj.pos.y + socketObj.height / 2 + 35;
				}

				// conection flag
				const draggingPlug = k.get("plug").find((plug) => plug.dragging);

				if (draggingPlug && socketObj.isColliding(draggingPlug) && socketObj.isHovering() && !socketObj.plug) {
					draggingPlug.dragging = false;
					socketObj.plug = draggingPlug;
					k.play("plug", { detune: k.rand(-100, 100) });
				}
			});

			if (k.difficulty == 3) {
				socketObj.plug = k.get("plug").find((plug) => plug != plugObj && !plug.getSocket());
			}
		});

		// this code mixes them up
		let socketGap = (k.width() - k.getSprite("socket").data.width * k.get("socket").length) / (k.get("socket").length + 1);
		let socketX = socketGap;
		k.get("socket").forEach((socket) => {
			socket.pos.x = socketX;
			socketX += socketGap + socket.width;
		});

		k.get("plug").sort(() => Math.random() - 0.5); // shuffles them
		let sourceGap = (k.width() - k.getSprite("plug").data.width * k.get("plug").length) / (k.get("plug").length);
		let sourceX = sourceGap;
		k.get("plug").forEach((plug) => {
			plug.originX = sourceX;
			plug.pos.x = sourceX;
			sourceX += sourceGap + plug.width;
		});

		const light = k.add([
			k.sprite("light"),
			k.opacity(0.9),
			k.color(k.mulfok.VOID_VIOLET),
			k.anchor("center"),
			k.z(100),
			{
				update() {
					this.pos = k.mousePos();
				},
				draw() {
					// top
					k.drawRect({
						width: k.width() * 4,
						height: k.height(),
						pos: k.vec2(0, -this.height),
						color: this.color,
						anchor: "center",
						opacity: this.opacity,
					});

					// bottom
					k.drawRect({
						width: k.width() * 4,
						height: k.height(),
						pos: k.vec2(0, this.height),
						color: this.color,
						anchor: "center",
						opacity: this.opacity,
					});

					// left
					k.drawRect({
						width: k.width(),
						height: k.height(),
						pos: k.vec2(-this.width, 0),
						color: this.color,
						anchor: "center",
						opacity: this.opacity,
					});

					// right
					k.drawRect({
						width: k.width(),
						height: k.height(),
						pos: k.vec2(this.width, 0),
						color: this.color,
						anchor: "center",
						opacity: this.opacity,
					});
				},
			},
		]);

		k.onUpdate(() => {
			if (k.get("socket").every((socket) => socket.is("right")) && !k.winState) {
				k.tween(light.opacity, 0, 0.5, (p) => light.opacity = p);
				k.win();
				k.wait(1 / k.speed, () => k.finish());
			}
		});

		k.onTimeout(() => {
			const wrongSockets = k.get("socket").filter((socket) => !socket.is("right"));
			if (wrongSockets.length > 0 && !k.winState) {
				k.lose();
				k.play("lightsoff");

				wrongSockets.forEach((socket) => {
					socket.add([
						k.anchor("center"),
						k.pos(0, 150),
						k.sprite("sparkles", { anim: "a", animSpeed: 15 }),
						k.z(200),
					]);
				});

				k.wait(0.5, () => {
					k.add([
						k.rect(k.width(), k.height()),
						k.color(k.mulfok.VOID_VIOLET),
						k.z(300),
					]);

					k.wait(0.75, () => {
						k.finish();
					});
				});
			}
		});
	},
};

export default connectGame;
