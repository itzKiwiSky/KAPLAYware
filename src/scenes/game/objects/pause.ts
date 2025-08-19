import { Color, GameObj, Vec2 } from "kaplay";
import k from "../../../engine";
import { linearSelector } from "../../menu/linearSelector";

export function createPauseScreen(resume: () => void, menu: () => void) {
	// let canPress = false;
	let enabled = false;
	const p = k.add([linearSelector<"resume" | "menu">(), k.z(100)]);
	p.menuItems = ["resume", "menu"];
	p.menuBack = "left";
	p.menuNext = "right";
	p.menuSelect = "action";

	const drawBtn = (pos: Vec2, color: Color, text: string, selected = false) => {
		if (selected) {
			k.drawRect({
				width: 190,
				height: 60,
				pos: pos,
				radius: 50,
				outline: { color: k.mulfok.WHITE, width: 25 },
				anchor: "center",
			});
		}

		k.drawRect({
			width: 190,
			height: 60,
			pos: pos,
			radius: 50,
			color: color,
			outline: { color: k.mulfok.VOID_VIOLET, width: 10 },
			anchor: "center",
		});

		k.drawText({
			text: text,
			pos: pos,
			size: 35,
			align: "center",
			anchor: "center",
		});
	};

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
		drawBtn(k.center().add(-150, 70), k.mulfok.DARK_BLUE, "RESUME", p.getSelected() == "resume");
		drawBtn(k.center().add(150, 70), k.mulfok.DARK_RED, "MENU", p.getSelected() == "menu");
	});

	p.onSelect(() => {
		if (p.getSelected() == "resume") resume();
		if (p.getSelected() == "menu") menu();
	});

	return {
		set isGamePaused(val: boolean) {
			enabled = val;
			if (enabled == true) p.index = 0;
		},
	};
}
