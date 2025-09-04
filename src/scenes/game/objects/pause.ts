import { Color, GameObj, Vec2 } from "kaplay";
import k from "../../../engine";
import { linearSelector } from "../../menu/linearSelector";
import cursor from "../../../plugins/cursor";
import { WareEngine } from "../ware";
import { gameHidesMouse } from "../../../utils";

export function createPauseScreen(ware: WareEngine, resume: () => void, menu: () => void) {
	let enabled = false;
	const p = k.add([linearSelector<"resume" | "menu">(), k.z(2)]);
	p.menuItems = ["resume", "menu"];
	p.menuBack = "left";
	p.menuNext = "right";
	p.menuSelect = "action";

	p.onUpdate(() => {
		if (enabled == true && k.getLastInputDeviceType() == "mouse") {
			cursor.stayHidden = false;
		}
	});

	function addBtn(parent: GameObj, pos: Vec2, color: Color, text: string) {
		const button = parent.add([
			k.rect(190, 60, { radius: 50 }),
			k.pos(pos),
			k.color(color),
			k.area(),
			k.outline(5, color.darken(10)),
			k.anchor("center"),
			k.z(3),
			{
				focused: false,
			},
		]);

		const btn = text.toLowerCase() as "resume" | "menu";

		button.onUpdate(() => {
			button.hidden = !enabled;

			if (button.isHovering() && p.getSelected() != btn) p.setSelected(btn);
			button.focused = p.getSelected() == btn;
		});

		button.onDraw(() => {
			k.drawText({
				text: text,
				size: 30,
				anchor: "center",
				align: "center",
			});

			k.drawRect({
				width: 190,
				height: 60,
				radius: 50,
				anchor: "center",
				fill: false,
				outline: {
					width: 10,
					color: k.mulfok.VOID_VIOLET,
				},
			});

			if (button.focused) {
				k.drawRect({
					width: 200,
					height: 70,
					radius: 50,
					anchor: "center",
					fill: false,
					outline: {
						width: 5,
						color: k.WHITE,
					},
				});
			}
		});

		return button;
	}

	p.onDraw(() => {
		if (!enabled) return;
		k.drawRect({
			color: k.BLACK,
			width: k.width(),
			height: k.height(),
			opacity: 0.8,
		});

		k.drawText({
			text: "PAUSED",
			pos: k.center().sub(0, 25),
			anchor: "center",
			size: 50,
			transform: (idx, ch) => {
				return {
					pos: k.vec2(0, k.wave(-4, 4, k.time() * 4 + idx * 0.5)),
					// scale: k.wave(1, 1.2, k.time() * 3 + idx),
					// angle: k.wave(-9, 9, k.time() * 3 + idx),
				};
			},
		});

		// draw buttons
		// drawBtn(k.center().add(-150, 70), k.mulfok.DARK_BLUE, "RESUME", p.getSelected() == "resume");
		// drawBtn(k.center().add(150, 70), k.mulfok.DARK_RED, "MENU", p.getSelected() == "menu");
	});

	addBtn(p, k.center().add(-150, 70), k.mulfok.DARK_BLUE, "RESUME");
	addBtn(p, k.center().add(150, 70), k.mulfok.DARK_RED, "MENU");

	p.onSelect(() => {
		if (!enabled) return;
		if (p.getSelected() == "resume") {
			resume();
			if (gameHidesMouse(ware.microgame)) cursor.stayHidden = true;
		}
		if (p.getSelected() == "menu") menu();
	});

	return {
		set isGamePaused(val: boolean) {
			enabled = val;
		},
	};
}
