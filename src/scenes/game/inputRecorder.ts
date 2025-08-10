import k from "../../engine";
import { TButton } from "../../main";
import { InputRecording } from "../menu/views/freeplayView";
import { WareApp } from "./app";
import { getGameID } from "./utils";
import { WareEngine } from "./ware";

export function managePreviewMode(app: WareApp, ware: WareEngine, runFunction: () => void) {
	const RAND_SEED = 1225;
	let frame = 0;
	const data: InputRecording = { inputs: [] };

	const message = k.add([
		k.rect(k.width(), k.height()),
		k.color(k.BLACK),
		k.z(999),
		{
			text: `YOU'RE ON "INPUT RECORD" MODE\nPRESS "ACTION" TO CONTINUE\n\nWHEN YOU'RE FINISHED\nYOUR INPUT DATA WILL BE DOWNLOADED`,
			draw() {
				k.drawText({
					text: this.text,
					pos: k.center(),
					size: 20,
					align: "center",
					color: k.WHITE,
					anchor: "center",
				});
			},
		},
	]);

	const actionCheck = k.onButtonPress("action", () => {
		message.hidden = true;
		actionCheck.cancel();
		runFunction();
	});

	// CHANGE RNG
	ware.ctx.randSeed(RAND_SEED);

	// RECORD INPUTS
	ware.ctx.onUpdate(() => {
		frame++;
		if (!k.mouseDeltaPos().isZero()) {
			data.inputs.push({
				frame: frame,
				device: "mouse",
				type: "mouseMove",
				position: k.mousePos(),
			});
		}

		["up", "down", "left", "right", "action"].forEach((btn: TButton) => {
			// now we'd have to do this for every press,
			if (k.isButtonPressed(btn)) {
				data.inputs.push({
					frame: frame,
					button: btn,
					device: k.getLastInputDeviceType(),
					type: "press",
				});
			}
			// now we'd have to do this for every press,
			else if (k.isButtonDown(btn)) {
				data.inputs.push({
					frame: frame,
					button: btn,
					device: k.getLastInputDeviceType(),
					type: "down",
				});
			}
			// now we'd have to do this for every press,
			else if (k.isButtonReleased(btn)) {
				data.inputs.push({
					frame: frame,
					button: btn,
					device: k.getLastInputDeviceType(),
					type: "release",
				});
			}
		});
	});

	ware.onFinish(() => {
		message.text = `THANK YOU FOR COMPLYING\nKEEP DEVELOPING :)\n(Game won't run any further, restart it)`;
		message.hidden = false;
		k.downloadJSON(`${getGameID(ware.microgame)}-inputs.json`, data);
	});
}
