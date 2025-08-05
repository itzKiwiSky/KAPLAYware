import { ButtonBindingDevice } from "kaplay";
import k from "../engine";

// TODO: make this better, it sucks!
let canPoint = true;
let lastInput: ButtonBindingDevice = "mouse";

/** The cursor object :) */
const cursor = k.add([
	k.sprite("@cursor"),
	k.pos(Infinity),
	k.anchor("topleft"),
	k.scale(2),
	k.opacity(),
	k.z(999),
	k.fixed(),
	k.color(),
	k.stay(),
	k.timer(),
	{
		reset() {
			this.opacity = 1;
		},

		set canPoint(param: boolean) {
			canPoint = param;
		},

		get canPoint() {
			return canPoint;
		},
	},
]);

cursor.onUpdate(() => {
	if (lastInput == "mouse") cursor.opacity = k.lerp(cursor.opacity, 1, 0.25);
	else cursor.opacity = k.lerp(cursor.opacity, 0, 0.25);

	const hovered = k.get("area", { recursive: true }).filter((obj) => {
		obj.isHovering() && canPoint && !obj.is("ignorepoint") && (!k.kaplaywared.ignoreWareInputEvents || !obj._isWare);
	}).length > 0;

	if (k.isMouseDown("left")) cursor.sprite = "cursor-knock";
	if (hovered && !k.isMouseDown("left")) cursor.sprite = "cursor-point";
	else if (!hovered && !k.isMouseDown("left")) cursor.sprite = "cursor";
});

cursor.onMouseMove(() => {
	cursor.pos = k.mousePos();
	lastInput = "mouse";
});

cursor.onKeyPress(() => lastInput = "keyboard");
cursor.onGamepadButtonPress(() => lastInput = "gamepad");

export default cursor;
