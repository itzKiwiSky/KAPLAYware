import { Asset, AudioPlay, AudioPlayOpt, Color, GameObj, KEventController, MusicData, SoundData, Vec2 } from "kaplay";
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
		k.timer(),
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
	gamePaused: boolean;

	updateEvents: KEventController[];
	drawEvents: KEventController[];

	inputEvents: KEventController[];
	inputPaused: boolean;

	timerEvents: KEventController[];
	timerPaused: boolean;

	sounds: AudioPlay[];
	soundPaused: boolean;
	clearAllEvs(): void;
	clearSounds(): void;
	resetCamera(): void;
	handleQuickWatch(): void;
	play(src: string | SoundData | Asset<SoundData> | Asset<string>, options?: AudioPlayOpt): AudioPlay;
};

/** Function that creates an instance of {@link WareApp `WareApp`} */
export function createWareApp(): WareApp {
	const gameContainer = createGameContainer();
	const pauseCtx = createPauseCtx();

	/** Wheter EVERYTHING should be paused */
	let gamePaused = false;
	let soundPaused = true;
	let inputPaused = true;
	let timerPaused = true;

	/** Sounds that were disabled by "soundsEnabled" setter */
	let disabledSounds: AudioPlay[] = [];

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
		updateEvents: [],
		drawEvents: [],
		inputEvents: [],
		timerEvents: [],
		get gamePaused() {
			return gamePaused;
		},
		set gamePaused(val: boolean) {
			gamePaused = val;
			app.inputPaused = gamePaused;
			app.soundPaused = gamePaused;
			app.rootObj.paused = gamePaused;
		},
		get timerPaused() {
			return timerPaused;
		},
		set timerPaused(val: boolean) {
			timerPaused = val;
			(this as WareApp).timerEvents.forEach((ev) => ev.paused = timerPaused);
		},
		get inputPaused() {
			return inputPaused;
		},
		set inputPaused(val: boolean) {
			inputPaused = val;
			(this as WareApp).inputEvents.forEach((ev) => ev.paused = inputPaused);
		},
		get soundPaused() {
			return soundPaused;
		},
		set soundPaused(val: boolean) {
			soundPaused = val;

			if (soundPaused == true) {
				(this as WareApp).sounds.forEach((sound) => {
					if (sound.paused) return;
					// sound is intended to play but sounds were disabled
					disabledSounds.push(sound);
					sound.paused = true;
				});
			}
			else if (soundPaused == false) {
				disabledSounds.forEach((sound) => {
					// re enable the good sounds
					sound.paused = false;
					disabledSounds.splice(disabledSounds.indexOf(sound), 1);
				});
			}
		},
		sounds: [],
		play(this: WareApp, src, options) {
			const sound = k.play(src, options);

			if (this.soundPaused && sound.paused == false) {
				sound.paused = true;
				disabledSounds.push(sound);
			}
			this.sounds.push(sound);

			sound.onEnd(() => {
				this.sounds.splice(this.sounds.indexOf(sound), 1);
				if (disabledSounds.includes(sound)) disabledSounds.splice(disabledSounds.indexOf(sound), 1);
			});
			return sound;
		},
		clearAllEvs(this: WareApp) {
			this.updateEvents.forEach((ev) => ev.cancel());
			this.drawEvents.forEach((ev) => ev.cancel());
			this.inputEvents.forEach((ev) => ev.cancel());
			this.timerEvents.forEach((ev) => ev.cancel());

			this.updateEvents = [];
			this.drawEvents = [];
			this.inputEvents = [];
			this.timerEvents = [];
		},
		resetCamera(this: WareApp) {
			this.cameraObj.pos = k.center();
			this.cameraObj.scale = k.vec2(1);
			this.cameraObj.angle = 0;
			this.cameraObj.shake = 0;
		},
		handleQuickWatch(this: WareApp) {
			k.quickWatch("events", `${this.updateEvents.length}`);
			k.quickWatch("draw", `${this.drawEvents.length}`);
			k.quickWatch("sound", `${this.sounds.length} (${!this.soundPaused})`);
			k.quickWatch("input", `${this.inputEvents.length} (${!this.inputPaused})`);
			k.quickWatch("timers", `${this.timerEvents.length} (${!this.timerPaused})`);
		},
		clearSounds(this: WareApp) {
			this.sounds.forEach((sound) => sound.stop());
			this.sounds = [];
			disabledSounds.forEach((sound) => sound.stop());
			disabledSounds = [];
		},
	} satisfies WareApp;

	gameContainer.root.onUpdate(() => {
		gameContainer.box.color = app.backgroundColor;
	});

	return app;
}
