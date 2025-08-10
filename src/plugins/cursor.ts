import { AreaComp, ButtonBindingDevice, GameObj } from "kaplay";
import k from "../engine";

let lastInput: ButtonBindingDevice = "mouse";

/** The cursor object :) */
const cursor = k.add([
	k.sprite("@cursor"),
	k.pos(),
	k.anchor("topleft"),
	k.scale(2),
	k.opacity(),
	k.z(999),
	k.fixed(),
	k.color(),
	k.stay(),
	{
		stayHidden: false,
		canPoint: false,
	},
]);

cursor.onUpdate(() => {
	if (lastInput == "mouse" && !cursor.stayHidden) cursor.opacity = k.lerp(cursor.opacity, 1, 0.25);
	else cursor.opacity = k.lerp(cursor.opacity, 0, 0.25);
	if (cursor.stayHidden) return;

	const hovered = k.get("area", { recursive: true }).filter((obj: GameObj<AreaComp>) => {
		return obj.isHovering() && cursor.canPoint && obj.area.cursor != "none";
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
