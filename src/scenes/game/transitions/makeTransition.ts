import { AreaComp, GameObj, KEvent, KEventController, PosComp, RotateComp, ScaleComp, StateComp } from "kaplay";
import { WareApp } from "../app";
import k from "../../../engine";
import { Kaplayware } from "../kaplayware";
const baseStages = ["prep", "win", "lose", "bossPrep", "bossWin", "bossLose", "speed"] as const;

/** The many animations a transition can do */
export type TransitionStage = typeof baseStages[number];

// should return the runTransition function
type CameraObject = GameObj<PosComp | ScaleComp | RotateComp>;
type ParentObject = GameObj<PosComp>;
type StateObject = {
	readonly stages: TransitionStage[];
	defineStage(stage: TransitionStage, action: () => void): void;
	finishStage(stage: TransitionStage): void;
	callPrompt(): void;
	callInput(): void;
};

type Transition = {
	readonly stages: TransitionStage[];
	onStageStart(stage: TransitionStage, action: () => void): KEventController;
	onStageEnd(stage: TransitionStage, action: () => void): KEventController;
	onPromptTime(action: () => void): KEventController;
	onInputPromptTime(action: () => void): KEventController;
	onTransitionEnd(action: () => void): KEventController;
};

type TransitionDefinition = (parent: ParentObject, camera: CameraObject, stageManager: StateObject, wareApp: WareApp, wareEngine: Kaplayware) => void;
type TransitionFunction = (stages: TransitionStage[], wareApp: WareApp, wareEngine: Kaplayware) => Transition;

// you thought you were smart huh? this is all busted!!!!!!!!!!!!!

export function defineTransition(action: TransitionDefinition): TransitionFunction {
	return (stages, wareApp, wareEngine) => {
		const camera = wareApp.rootObj.add([k.scale(), k.pos(k.center()), k.rotate(0), k.anchor("center"), k.z(1)]);
		const parent = camera.add([k.pos(-k.width() / 2, -k.height() / 2)]);
		const stateObject = parent.add([k.state(stages[0], stages)]);

		const startEv = new k.KEvent<[TransitionStage]>();
		const endEv = new k.KEvent<[TransitionStage]>();
		const prompt = new k.KEvent();
		const inputPrompt = new k.KEvent();

		const stageManager: StateObject = {
			get stages() {
				return stages;
			},
			callInput() {
				inputPrompt.trigger();
			},
			callPrompt() {
				prompt.trigger();
			},
			defineStage(stage, action) {
				startEv.trigger(stage);
				stateObject.onStateEnter(stage, action);
			},
			finishStage(stage) {
				endEv.trigger(stage);
			},
		};

		action(parent, camera, stageManager, wareApp, wareEngine);

		endEv.add((state) => {
			if (stages.indexOf(state) == stages.length - 1) camera.destroy();
			else stateObject.enterState(stages[stages.indexOf(state) + 1]);
		});

		// now return the transition for me to use in the kaplayware engine
		return {
			get stages() {
				return stages;
			},
			onStageStart(stage, action) {
				return startEv.add((actionStage) => {
					if (actionStage == stage) action();
				});
			},
			onStageEnd(stage, action) {
				return endEv.add((actionStage) => {
					if (actionStage == stage) action();
				});
			},
			onPromptTime(action) {
				return prompt.add(action);
			},
			onInputPromptTime(action) {
				return inputPrompt.add(action);
			},
			onTransitionEnd(action) {
				return endEv.add((actionStage) => {
					if (stages.indexOf(actionStage) == stages.length - 1) action();
				});
			},
		};
	};
}
