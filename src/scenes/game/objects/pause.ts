import { Color, GameObj } from "kaplay";
import k from "../../../engine";
import { linearSelector } from "../../menu/linearSelector";

export const addPauseScreen = () => {
	// let canPress = false;
	let enabled = false
	const p = k.add([linearSelector(), k.z(100)])
	// const resumeBtn = addBtn(p, k.BLUE, "Resume")
	// resumeBtn.pos = k.vec2(188, 380)
	// const exitBtn = addBtn(p, k.RED, "Exit")
	// exitBtn.pos = k.vec2(300, 380)
	// p.menuItems = [resumeBtn, exitBtn]
	// p.menuBack = "left"
	// p.menuNext = "right"
	// p.menuSelect = "action"

	p.onDraw(() => {
		if (!enabled) return;
		k.drawRect({
			color: k.BLACK,
			width: k.width(),
			height: k.height(),
			opacity: 0.8
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
				}
			}
		})
	});

	// p.onChange((newSelect, oldSelect) => {
	// 	newSelect.opacity = 0.5
	// 	oldSelect.opacity = 0.5
	// })

	// p.onSelect(() => {
	// 	if (p.getSelected() == exitBtn) canPress = false
	// })

	// p.setSelected(resumeBtn)

	return {
		set isGamePaused(val: boolean) {
			enabled = val
		}
	}
}