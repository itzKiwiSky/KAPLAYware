import k from "../../engine";
import { TButton } from "../../main";
import { InputRecording } from "../menu/views/freeplayView";
import { WareApp } from "./app";
import { getGameID } from "./utils";
import { WareEngine } from "./ware";

export function managePreviewMode(app: WareApp, ware: WareEngine, unpause: () => void) {
	const RAND_SEED = 1225;
	let frame = 0;
	const data: InputRecording = { inputs: [] };

	// WAIT pause it and show you that you're on input recording mode
	app.paused = true;
	const message = k.add([
		k.rect(k.width(), k.height()),
		k.color(k.BLACK),
		{
			update() {
				if (k.isButtonPressed("action")) {
					this.destroy();
					unpause();
				}
			},

			draw() {
				k.drawText({
					text: `YOU'RE ON "INPUT RECORD" MODE\nPRESS "ACTION" TO CONTINUE`,
					pos: k.center(),
					size: 20,
					align: "center",
					color: k.WHITE,
					anchor: "center",
				});
			},
		},
	]);

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

	const oldFinishGame = ware.finishGame;
	ware.finishGame = () => {
		oldFinishGame();
		k.downloadJSON(`${getGameID(ware.microgame)}-inputs.json`, data);
	};
}
