import { ButtonBindingDevice, SerializedVec2, Vec2 } from "kaplay";
import { TButton } from "../../../../main";
import { MicrogameCtx } from "../../../game/context/types";
import k from "../../../../engine";
import { overload2 } from "../../../../utils";

/*
	seed: number;
	inputs: {
		// REQUIRED
		frame: number; // frame it happened
		type: "press" | "down" | "release" | "mouseMove";
		button?: TButton;
		position?: SerializedVec2; // Made with Vec2.serialize(), it is just for mouseMove type

		// NON REQUIRED, BUT COOL TO HAVE
		device: ButtonBindingDevice;
	}[];
*/

type SingleInput =
	& {
		frame: number;
	}
	& ({
		type: "press" | "down" | "release";
		button: TButton;
	} | {
		type: "mouseMove";
		position: SerializedVec2;
		delta: SerializedVec2;
	});

/** Is the final JSON that gets downloaded when you finish a minigame in recording mode (?) */
export type FreeplayPreviewData = {
	seed: number;
	inputs: SingleInput[];
};

interface PreviewGameCtx extends MicrogameCtx {
	clearInputHandlers(): void;
	triggerButton(btn: TButton | "moveMouse", action: "press" | "down" | "release"): void;
	triggerButton(btn: "moveMouse", pos: Vec2, delta: Vec2): void;
}

const setHasOrIncludes = <T extends any>(set: Set<T>, key: T) => {
	if (Array.isArray(key)) {
		return key.some((k) => set.has(k));
	}

	return set.has(key);
};

export function createPreviewGameCtx(ctx: MicrogameCtx): PreviewGameCtx {
	const pressButtonHandler = new k.KEvent<[TButton]>();
	const downButtonHandler = new k.KEvent<[TButton]>();
	const releaseButtonHandler = new k.KEvent<[TButton]>();
	const moveMouseHandler = new k.KEvent<[pos: Vec2, delta: Vec2]>();

	ctx.onButtonPress = overload2((btn, action) => {
		return pressButtonHandler.add((nBtn) => nBtn == btn ? action(nBtn) : false);
	}, (action) => {
		return pressButtonHandler.add((nBtn) => action(nBtn));
	});

	ctx.onButtonDown = overload2((btn, action) => {
		return downButtonHandler.add((nBtn) => nBtn == btn ? action(nBtn) : false);
	}, (action) => {
		return downButtonHandler.add((nBtn) => action(nBtn));
	});

	ctx.onButtonRelease = overload2((btn, action) => {
		return releaseButtonHandler.add((nBtn) => nBtn == btn ? action(nBtn) : false);
	}, (action) => {
		return releaseButtonHandler.add((nBtn) => action(nBtn));
	});

	ctx.onMouseMove = (action) => moveMouseHandler.add((pos, delta) => action(pos, delta));

	ctx.mousePos = () => k.vec2();

	const buttonState = {
		pressed: new Set<TButton>([]),
		pressedRepeat: new Set<TButton>([]),
		released: new Set<TButton>([]),
		down: new Set<TButton>([]),
		update() {
			this.pressed.clear();
			this.released.clear();
			this.pressedRepeat.clear();
		},
		press(btn: TButton) {
			this.pressed.add(btn);
			this.pressedRepeat.add(btn);
			this.down.add(btn);
		},
		pressRepeat(btn: TButton) {
			this.pressedRepeat.add(btn);
		},
		release(btn: TButton) {
			this.down.delete(btn);
			this.pressed.delete(btn);
			this.released.add(btn);
		},
	};

	ctx.isButtonPressed = (btn: TButton | TButton[]) => {
		return btn === undefined
			? buttonState.pressed.size > 0
			: setHasOrIncludes(buttonState.pressed, btn);
	};

	ctx.isButtonDown = (btn: TButton | TButton[]) => {
		return btn === undefined
			? buttonState.pressed.size > 0
			: setHasOrIncludes(buttonState.pressed, btn);
	};

	ctx.isButtonReleased = (btn: TButton | TButton[]) => {
		return btn === undefined
			? buttonState.pressed.size > 0
			: setHasOrIncludes(buttonState.pressed, btn);
	};

	return {
		...ctx,
		clearInputHandlers() {
			pressButtonHandler.clear();
			downButtonHandler.clear();
			releaseButtonHandler.clear();
			moveMouseHandler.clear();
		},

		triggerButton(btn: TButton | "moveMouse", arg2: any, arg3?: any) {
			if (btn === "moveMouse" && typeof arg2 === "object") {
				const pos = arg2 as Vec2;
				const delta = arg3 as Vec2;
				moveMouseHandler.trigger(pos, delta);
			}
			else {
				const action = arg2 as "press" | "down" | "release";
				if (action === "press") {
					pressButtonHandler.trigger(btn as TButton);
					buttonState.press(btn as TButton);
				}
				else if (action === "down") {
					downButtonHandler.trigger(btn as TButton);
				}
				else if (action === "release") {
					releaseButtonHandler.trigger(btn as TButton);
					buttonState.release(btn as TButton);
				}
			}
		},
	};
}
