import { AreaComp, GameObj, KEventController, PosComp, RotateComp, ScaleComp, StateComp } from "kaplay";
import { WareApp } from "../app";
import k from "../../../engine";
import { Kaplayware } from "../kaplayware";
const baseStages = ["prep", "win", "lose", "bossPrep", "bossWin", "bossLose", "speed"] as const;

/** The many animations a transition can do */
export type TransitionStage = typeof baseStages[number];

// should return the runTransition function
type CameraObject = GameObj<PosComp | ScaleComp | RotateComp>;
type ParentObject = GameObj<PosComp>;

type Transition = {
	readonly stages: TransitionStage[];
	startStage(stage: TransitionStage): void;
	endStage(stage: TransitionStage): void;
	onStageEnd(stage: TransitionStage, action: () => void): KEventController;
	onStageStart(stage: TransitionStage, action: () => void): KEventController;
	triggerPrompt(): void;
	triggerInputPrompt(): void;
	onPromptTime(action: () => void): KEventController;
	onInputPromptTime(action: () => void): KEventController;
	onTransitionEnd(action: () => void): KEventController;
};

type TransitionDefinition = (parent: ParentObject, camera: CameraObject, stageManager: Transition, wareApp: WareApp, wareEngine: Kaplayware) => void;
type TransitionFunction = (stages: TransitionStage[], wareApp: WareApp, wareEngine: Kaplayware) => Transition;

// you thought you were smart huh? this is all busted!!!!!!!!!!!!!

export function defineTransition(action: TransitionDefinition): TransitionFunction {
	return (stages, wareApp, wareEngine) => {
		const camera = wareApp.rootObj.add([k.scale(), k.pos(k.center()), k.rotate(0), k.anchor("center"), k.z(1)]);
		const parent = camera.add([k.pos(-k.width() / 2, -k.height() / 2)]);
		const transitionEv = new k.KEvent<[action: "start" | "end" | "prompt" | "inputPrompt", stage?: TransitionStage]>();

		const stageManager: Transition = {
			get stages() {
				return stages;
			},
			startStage(stage) {
				transitionEv.trigger("start", stage);
			},
			endStage(stage) {
				transitionEv.trigger("end", stage);
			},
			triggerPrompt() {
				transitionEv.trigger("prompt");
			},
			triggerInputPrompt() {
				transitionEv.trigger("inputPrompt");
			},
			onStageStart(stage, action) {
				return transitionEv.add((evAction, evStage) => {
					if (evAction == "start" && evStage == stage) action();
				});
			},
			onStageEnd(stage, action) {
				return transitionEv.add((evAction, evStage) => {
					if (evAction == "end" && evStage == stage) action();
				});
			},
			onPromptTime(action) {
				return transitionEv.add((evAction, evStage) => {
					if (evAction == "prompt") action();
				});
			},
			onInputPromptTime(action) {
				return transitionEv.add((evAction, evStage) => {
					if (evAction == "inputPrompt") action();
				});
			},
			onTransitionEnd(this: Transition, action) {
				return this.onStageEnd(this.stages[this.stages.length - 1], action);
			},
		};

		// when a stage is over, go to the next one
		transitionEv.add((action, stage) => {
			if (stage == stages[stages.length - 1]) return;
			// will only run if it's not the final stage
			if (action == "end") stageManager.startStage(stages[stages.indexOf(stage) + 1]);
		});

		// destroy everything when done
		stageManager.onTransitionEnd(() => {
			camera.destroy();
			// TODO: should this be cleared? idk, since it runs before the onTransition end on kaplayware() it doesn't let it happen there
			// transitionEv.clear();
		});

		// actually runs the transition, cool!
		action(parent, camera, stageManager, wareApp, wareEngine);

		// bueno el problema es el siguiente, cuando uno llama la funcion, startStage ya fue llamado
		// por lo tanto las funciones que fueron definidas despues de que se llamara ya no se corren

		// kickstart the whole process
		// stageManager.startStage(stages[0]);
		// hasBeenTriggered = true

		// now return the transition for me to use in the kaplayware engine
		return stageManager;
	};
}
