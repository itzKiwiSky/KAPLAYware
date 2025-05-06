import { AreaComp, GameObj, KEvent, KEventController, PosComp, RotateComp, ScaleComp, StateComp } from "kaplay";
import { WareApp } from "../app";
import k from "../../../engine";
import { Kaplayware } from "../kaplayware";
const baseStages = ["prep", "win", "lose", "bossPrep", "bossWin", "bossLose", "speed"] as const;

/** The many stages an animation can go through */
export type TransitionStage = typeof baseStages[number];

// should return the runTransition function
type CameraObject = GameObj<PosComp | ScaleComp | RotateComp>;
type ParentObject = GameObj<PosComp>;
type StateObject = {
	stages: TransitionStage[];
	defineStage(stage: TransitionStage, action: () => void): void;
	enterStage(stage: TransitionStage): void;
	finishStage(stage: TransitionStage): void;
	callPrompt(): void;
	callInput(): void;
};

/** A defined transition */
export type Transition = {
	readonly stages: TransitionStage[];
	/** Callback for when a stage starts */
	onStageStart(stage: TransitionStage, action: () => void): KEventController;
	/** Callback for when a stage ends */
	onStageEnd(stage: TransitionStage, action: () => void): KEventController;
	/** Callback for when a text prompt should appear */
	onPromptTime(action: () => void): KEventController;
	/** Callback for when the input prompt should appear */
	onInputPromptTime(action: () => void): KEventController;
	/** Callback for when all stages are over */
	onTransitionEnd(action: () => void): KEventController;
	trigger(stages: TransitionStage[]): void;
};

export type TransitionDefinition = (parent: ParentObject, camera: CameraObject, stageManager: StateObject, wareApp: WareApp, wareEngine: Kaplayware) => void;

export function createTransition(transAction: TransitionDefinition, wareApp: WareApp, wareEngine: Kaplayware): Transition {
	const startEv = new k.KEvent<[TransitionStage]>();
	const endEv = new k.KEvent<[TransitionStage]>();
	const promptEv = new k.KEvent();
	const inputEv = new k.KEvent();
	const endTransEv = new k.KEvent();

	const camera = wareApp.rootObj.add([k.scale(), k.pos(k.center()), k.rotate(0), k.anchor("center"), k.z(1)]);
	const parent = camera.add([k.pos(-k.width() / 2, -k.height() / 2)]);
	const stageManager: StateObject = {
		stages: [],
		defineStage(stage, action) {
			startEv.add((actionStage) => {
				if (actionStage == stage) action();
			});
		},
		enterStage(stage) {
			startEv.trigger(stage);
		},
		finishStage(stage) {
			endEv.trigger(stage);
		},
		callPrompt() {
			promptEv.trigger();
		},
		callInput() {
			inputEv.trigger();
		},
	};

	// when a stage over is called, go to the next one
	endEv.add((stage) => {
		if (stageManager.stages.indexOf(stage) < stageManager.stages.length - 1) stageManager.enterStage(stageManager.stages[stageManager.stages.indexOf(stage) + 1]);
		else endTransEv.trigger();
	});

	endTransEv.add(() => {
		inputEv.clear();
		promptEv.clear();
	});

	// run the transition definition
	transAction(parent, camera, stageManager, wareApp, wareEngine);
	// console.log("WARE: Creating Transition for the first time");

	return {
		get stages() {
			return stageManager.stages;
		},
		trigger(stages: TransitionStage[]) {
			startEv.trigger(stages[0]);
			stageManager.stages = stages;
			// console.log("WARE: Transition called with stages: " + stages);
		},
		onStageStart(stage, action) {
			const ev = startEv.add((actionStage) => {
				if (actionStage == stage) {
					action();
					ev.cancel();
				}
			});
			return ev;
		},
		onStageEnd(stage, action) {
			const ev = endEv.add((actionStage) => {
				if (actionStage == stage) {
					action();
					ev.cancel();
				}
			});
			return ev;
		},
		onTransitionEnd(action) {
			const ev = endTransEv.add(() => {
				action();
				ev.cancel();
			});
			return ev;
		},
		onPromptTime(action) {
			return promptEv.add(action);
		},
		onInputPromptTime(action) {
			return inputEv.add(action);
		},
	};
}
