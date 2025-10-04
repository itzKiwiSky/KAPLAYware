import { GameObj, KEvent, KEventController, PosComp, RotateComp, ScaleComp, StateComp } from "kaplay";
import { WareApp } from "../app";
import k from "../../../engine";
import { Microgame } from "../../../types/Microgame";
import { createTransCtx, TransCtx } from "./transContext";
import { MicrogameCtx, MicrogameInput } from "../context/types";

const baseStages = ["prep", "win", "lose", "bossPrep", "bossWin", "bossLose", "speed", "gameOver"] as const;
/** The many stages an animation can go through */
export type TransitionStage = typeof baseStages[number];

type CameraObject = GameObj<PosComp | ScaleComp | RotateComp>;
type ParentObject = GameObj<PosComp>;
type StateObject = {
	/** KEvents that shouldn't be cleared */
	startEv: KEvent<[TransitionStage]>;
	endEv: KEvent<[TransitionStage]>;
	/** The last stages the transition was called with */
	stages: TransitionStage[];
	opts: WareTransOpt;
	/** Runs when the first stage runs */
	onStart(action: () => void): void;
	/** Defines a stage of the transition */
	defineStage(stage: TransitionStage, action: () => void): void;
	/** Triggers a stage of the transition, will cause it to run all over them */
	enterStage(stage: TransitionStage): void;
	/** Mark the ending of a stage */
	finishStage(stage: TransitionStage): void;
	/** Trigger the prompt */
	callPrompt(): void;
	/** Trigger the input prompt */
	callInput(): void;
};

/** A defined transition */
export type Transition = {
	/** The root where the transition objects are added to */
	readonly root: GameObj;
	/** The stages the transition should run */
	readonly stages: TransitionStage[];
	/** The context used (timer functions) */
	readonly ctx: TransCtx;
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
	trigger(stages: TransitionStage[], opts: WareTransOpt): void;
};

/** Options for the transition */
export type WareTransOpt = {
	speed: number;
	input: MicrogameInput;
	difficulty: 1 | 2 | 3;
	lives: number;
	score: number;
	prompt: Microgame["prompt"];
	ctx?: MicrogameCtx;
};

/** A transition function, is the one that plays the songs and adds the objects and such */
export type TransitionDefinition = (ctx: TransCtx, parent: ParentObject, camera: CameraObject, stageManager: StateObject, wareApp: WareApp) => void;

/** Runs one time and creates a transition for actual use inside the KAPLAYWARE engine
 * @param transAction (clave) Gets called after creating all the events and such
 * @param wareApp The ware app necessary to add trans camera and such
 * @param wareEngine The ware engine necessary to pass into the transition so it can use speed, lives etc etc
 */
export function createTransition(transAction: TransitionDefinition, wareApp: WareApp): Transition {
	const ctx = createTransCtx();
	const startEv = new k.KEvent<[TransitionStage]>();
	const endEv = new k.KEvent<[TransitionStage]>();
	const promptEv = new k.KEvent();
	const inputEv = new k.KEvent();
	const endTransEv = new k.KEvent();

	const camera = wareApp.rootObj.add([k.scale(), k.pos(k.center()), k.rotate(0), k.anchor("center"), k.z(1)]);
	const parent = camera.add([k.pos(-k.width() / 2, -k.height() / 2)]);
	const stageManager: StateObject = {
		startEv: new k.KEvent<[TransitionStage]>(),
		endEv: new k.KEvent<[TransitionStage]>(),
		stages: [],
		opts: { difficulty: 1, lives: 4, score: 1, speed: 1, input: "keys", prompt: "do" },
		onStart(action) {
			this.startEv.add((stage) => {
				if (stage == this.stages[0]) action();
			});
		},
		defineStage(stage, action) {
			this.startEv.add((actionStage) => {
				if (actionStage == stage) action();
			});
		},
		enterStage(stage) {
			this.startEv.trigger(stage);
			startEv.trigger(stage);
		},
		finishStage(stage) {
			this.endEv.trigger(stage);
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
	stageManager.endEv.add((stage) => {
		if (stageManager.stages.indexOf(stage) < stageManager.stages.length - 1) stageManager.enterStage(stageManager.stages[stageManager.stages.indexOf(stage) + 1]);
		else {
			camera.paused = true;
			camera.hidden = true;
			endTransEv.trigger();
			startEv.clear();
			endEv.clear();
			inputEv.clear();
			promptEv.clear();
			endTransEv.clear();
		}
	});

	// run the transition definition (only runs once)
	transAction(ctx, parent, camera, stageManager, wareApp);
	// console.log("WARE: Creating Transition for the first time");

	return {
		get root() {
			return camera;
		},

		get stages() {
			return stageManager.stages;
		},
		get ctx() {
			return ctx;
		},
		trigger(stages: TransitionStage[], opts: WareTransOpt) {
			stageManager.opts = opts;
			stageManager.stages = stages;
			stageManager.enterStage(stages[0]);
			camera.paused = false;
			camera.hidden = false;
			// console.log("WARE: Transition called with stages: " + stages);
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
		onTransitionEnd(action) {
			return endTransEv.add(() => {
				action();
			});
		},
		onPromptTime(action) {
			return promptEv.add(action);
		},
		onInputPromptTime(action) {
			return inputEv.add(action);
		},
	};
}
