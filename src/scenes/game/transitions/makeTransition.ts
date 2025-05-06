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
type StateObject = GameObj<
	StateComp | {
		readonly stages: TransitionStage[];
		defineStage(stage: TransitionStage, action: () => void): void;
		finishStage(stage: TransitionStage): void;
		callPrompt(): void;
		callInput(): void;
	}
>;

/** A defined transition */
type Transition = {
	/** The stages that were called to run on the transition */
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
};

type TransitionDefinition = (parent: ParentObject, camera: CameraObject, stageManager: StateObject, wareApp: WareApp, wareEngine: Kaplayware) => void;
/** A defined transition that when called will return {@link Transition `Transition`} */
type TransitionFunction = (stages: TransitionStage[], wareApp: WareApp, wareEngine: Kaplayware) => Transition;

/** Defines a cool transition for the KAPLAYWARE gameplay
 * @param transAction The actual content of the transition, must use stageManager.defineStage() and stageManager.finishStage() (es clave)
 */
export function defineTransition(transAction: TransitionDefinition): TransitionFunction {
	return (stages, wareApp, wareEngine) => {
		// define the KEvents
		const startEv = new k.KEvent<[TransitionStage]>();
		const endEv = new k.KEvent<[TransitionStage]>();
		const prompt = new k.KEvent();
		const inputPrompt = new k.KEvent();

		// create objects for the transition to build on

		const camera = wareApp.rootObj.add([k.scale(), k.pos(k.center()), k.rotate(0), k.anchor("center"), k.z(1)]);
		const parent = camera.add([k.pos(-k.width() / 2, -k.height() / 2)]);
		const stageManager: StateObject = parent.add([k.state(stages[0], stages), {
			get stages() {
				return stages;
			},
			defineStage(stage: TransitionStage, action: () => void) {
				return stageManager.onStateEnter(stage, () => {
					startEv.trigger(stage);
					action();
				});
			},
			finishStage(stage: TransitionStage) {
				endEv.trigger(stage);
			},
			callPrompt() {
				prompt.trigger();
			},
			callInput() {
				inputPrompt.trigger();
			},
		}]);

		// when a stage over is called, go to the next one
		endEv.add((stage) => {
			if (stages.indexOf(stage) < stages.length - 1) stageManager.enterState(stages[stages.indexOf(stage) + 1]);
		});

		// run the transition definition
		transAction(parent, camera, stageManager, wareApp, wareEngine);

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
