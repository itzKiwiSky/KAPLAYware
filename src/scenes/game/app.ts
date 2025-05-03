import { AudioPlay, Color, GameObj, KEventController, Vec2 } from "kaplay";
import { createPauseCtx, PauseCtx } from "./context/pause";
import k from "../../engine";

/** Creates a cute little object that contains a buncha game objects that can hold, a ware instance
 * @returns An object with a lot of objects
 */
export function createGameContainer() {
	const root = k.add([]);

	const gameBox = root.add([
		k.rect(k.width(), k.height()),
		k.color(k.BLUE.lighten(100)),
		k.scale(1),
		k.pos(k.center()),
		k.anchor("center"),
	]);

	const maskObj = gameBox.add([
		k.rect(gameBox.width, gameBox.height),
		k.pos(-gameBox.width / 2, -gameBox.height / 2),
		k.mask("intersect"),
	]);

	const shakeCameraObject = maskObj.add([
		k.pos(),
	]);

	const cameraObject = shakeCameraObject.add([
		k.rect(k.width(), k.height(), { fill: false }),
		k.pos(k.center()),
		k.rotate(0),
		k.anchor("center"),
		k.scale(1),
		{
			shake: 0,
		},
	]);

	const sceneObject = cameraObject.add([
		k.pos(-cameraObject.width / 2, -cameraObject.height / 2),
	]);

	cameraObject.onUpdate(() => {
		cameraObject.shake = k.lerp(cameraObject.shake, 0, 5 * k.dt());
		let posShake = k.Vec2.fromAngle(k.rand(0, 360)).scale(cameraObject.shake);
		shakeCameraObject.pos = k.vec2().add(posShake);
	});

	return {
		/** The root of all evil */
		root: root,
		/** Is the background and "window" of everything */
		box: gameBox,
		/** Masking object so things inside don't go out */
		mask: maskObj,
		/** Is the offset for the camera shaking */
		shakeCam: shakeCameraObject,
		/** Is the camera */
		camera: cameraObject,
		/** Is the real scene where minigame objects can be added with no problem, should have 0 children */
		scene: sceneObject,
		set scale(val: Vec2) {
			gameBox.scale = val;
		},
		get scale() {
			return gameBox.scale;
		},
		set pos(val: Vec2) {
			gameBox.pos = val;
		},
		get pos() {
			return gameBox.pos;
		},
	};
}

/** The ReturnType of {@link createGameContainer `createGameContainer()`} */
type GameContainer = ReturnType<typeof createGameContainer>;

/** Object that contains all the properties that a bare-bones instance should have */
export type WareApp = {
	readonly rootObj: GameContainer["root"];
	/** Is attached to root */
	readonly boxObj: GameContainer["box"];
	/** Is attached to camera */
	readonly sceneObj: GameContainer["scene"];
	/** Is attached to mask */
	readonly cameraObj: GameContainer["camera"];
	readonly pauseCtx: PauseCtx;
	backgroundColor: Color;
	everythingPaused: boolean;
	updateEvents: KEventController[];
	drawEvents: KEventController[];
	inputEvents: KEventController[];
	timerEvents: KEventController[];
	sounds: AudioPlay[];
	pausedSounds: AudioPlay[];
	soundsEnabled: boolean;
	inputEnabled: boolean;
	clearAll(): void;
	resetCamera(): void;
	handleQuickWatch(): void;
};

/** Function that creates an instance of {@link WareApp `WareApp`} */
export function createWareApp(): WareApp {
	const gameContainer = createGameContainer();
	const pauseCtx = createPauseCtx();
	const app = {
		get rootObj() {
			return gameContainer.root;
		},
		get boxObj() {
			return gameContainer.box;
		},
		get sceneObj() {
			return gameContainer.scene;
		},
		get cameraObj() {
			return gameContainer.camera;
		},
		get pauseCtx() {
			return pauseCtx;
		},
		backgroundColor: k.rgb(),
		everythingPaused: false,
		updateEvents: [],
		drawEvents: [],
		inputEnabled: true,
		inputEvents: [],
		timerEvents: [],
		soundsEnabled: false,
		sounds: [],
		pausedSounds: [],
		clearAll(this: WareApp) {
			this.updateEvents.forEach((ev) => ev.cancel());
			this.drawEvents.forEach((ev) => ev.cancel());
			this.inputEvents.forEach((ev) => ev.cancel());
			this.timerEvents.forEach((ev) => ev.cancel());
			this.sounds.forEach((ev) => ev.stop());
			this.pausedSounds.forEach((ev) => ev.stop());

			this.updateEvents = [];
			this.drawEvents = [];
			this.inputEvents = [];
			this.timerEvents = [];
			this.sounds = [];
			this.pausedSounds = [];
		},
		resetCamera(this: WareApp) {
			this.cameraObj.pos = k.center();
			this.cameraObj.scale = k.vec2(1);
			this.cameraObj.angle = 0;
			this.cameraObj.shake = 0;
		},
		handleQuickWatch() {
			k.quickWatch("updateEvents", this.updateEvents.length);
		},
	} as WareApp;

	gameContainer.root.onUpdate(() => {
		gameContainer.box.color = app.backgroundColor;
		gameContainer.root.paused = app.everythingPaused;

		// TODO: Figure out a way to pause all events on everything paused and inside of wareEngine also add the gameRunning condition for pausing
		// TODO: maybe would be as easy as attaching them to sceneObj when the input game obj thing gets fixed
		app.inputEvents.forEach((ev) => ev.paused = app.everythingPaused || !app.inputEnabled);
	});

	return app;
}
