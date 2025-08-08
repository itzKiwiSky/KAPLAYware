import { KEvent } from "kaplay";
import { Microgame } from "../../types/Microgame";
import { MicrogameCtx, MicrogameInput } from "./context/types";
import k from "../../engine";
import { TransitionStage } from "./transitions/makeTransition";
import { getGameByID, getGameColor } from "./utils";

/** Certain options to instantiate kaplayware (ware-engine) */
export type KAPLAYwareOpts = {
	/** What games will be available generally */
	availableGames?: Microgame[];
	/** What input should be determined? */
	inputFilter?: MicrogameInput | "any";
	// mods here
};

export type WareEngine = {
	lives: number;
	score: number;
	timeLeft: number;
	speed: number;
	difficulty: 1 | 2 | 3;
	timePaused: boolean;
	microgameHistory: string[];
	onTimeOutEvents: KEvent;
	/** Wheter you lost or won the last game, true or false means won or lost, undefined means still playing */
	winState: boolean | undefined;
	paused: boolean;
	ctx: MicrogameCtx;
	microgame: Microgame;
	curDuration: number;
	curPrompt: string;

	readonly shouldSpeedUp: boolean;

	/** Basically there's this microgame hat, when you pick a microgame, that microgame gets taken out of the hat, when there's no more microgames just add more again to the hat */
	getRandomGame(games?: Microgame[]): Microgame;
	getSpeed(score?: number): number;
	getDifficulty(score?: number): 1 | 2 | 3;
	getTransitionStages(): TransitionStage[];
	shouldBoss(): boolean;
	increaseSpeed(): number;
	isGameOver(): boolean;
	handleQuickWatch(): void;
	winGame(): void;
	loseGame(): void;
	/** Is re-set after, runs when the game should be over (ctx.finish()) */
	finishGame(): void;
};

export function createWareEngine(opts: KAPLAYwareOpts): WareEngine {
	const HOW_FREQUENT_BOSS = 10;
	const MAX_SPEED = 1.6;

	let microgameHat: Microgame[] = [];

	// when the engine deals a boss minigame the speed divisor should change to a random value
	let speedDivisor = 5;

	let gamesSinceLastSpeedUp = 0;
	let nextSpeedUp = k.randi(3, 7);
	let shouldSpeedUp = false;

	return {
		lives: 4,
		score: 0, // will increase to 1 when it starts and trans will show 0 to 1
		difficulty: 1,
		curDuration: 20,
		curPrompt: "",
		microgameHistory: [],
		onTimeOutEvents: new k.KEvent(),
		paused: false,
		ctx: null,
		speed: 1,
		microgame: null,
		timeLeft: 20,
		timePaused: false,
		winState: undefined,
		getRandomGame() {
			let randomGame: Microgame = null;

			const regularHat = microgameHat.filter((g) => !g.isBoss);
			const bossHat = microgameHat.filter((g) => g.isBoss);

			// first check if there's items available in the hat, if not, push to the arrays above
			if (this.shouldBoss() && bossHat.length == 0) bossHat.push(...opts.availableGames.filter((g) => g.isBoss));
			else if (!this.shouldBoss() && regularHat.length == 0) regularHat.push(...opts.availableGames.filter((g) => !g.isBoss));
			microgameHat = regularHat.concat(bossHat);

			// now choose a random microgame based on if should boss or not
			randomGame = k.choose(this.shouldBoss() ? bossHat : regularHat);
			microgameHat.splice(microgameHat.indexOf(randomGame), 1); // remove it from hat

			return randomGame;
		},
		getSpeed() {
			if (window.DEV_SPEED) return window.DEV_SPEED;
			else return 1;
		},
		getDifficulty(score = this.score) {
			if (window.DEV_DIFFICULTY) return window.DEV_DIFFICULTY;
			else return Math.max(1, (Math.floor(score / 10) + 1) % 4) as 1 | 2 | 3;
		},
		shouldBoss(games = window.microgames) {
			const scoreEqualsBoss = () => this.score % HOW_FREQUENT_BOSS == 0;
			const onlyBoss = () => games.length == 1 && games[0].isBoss == true;
			return scoreEqualsBoss() || onlyBoss();
		},
		get shouldSpeedUp() {
			return shouldSpeedUp;
		},
		isGameOver(this: WareEngine) {
			return this.winState == false && this.lives == 0;
		},
		getTransitionStages(this: WareEngine) {
			let transitionStages: TransitionStage[] = ["prep"];

			const lastGame = () => getGameByID(this.microgameHistory[this.microgameHistory.length - 1]);
			const winThing: TransitionStage = lastGame()?.isBoss ? (this.winState == true ? "bossWin" : "bossLose") : this.winState == true ? "win" : "lose";
			if (this.winState != undefined) transitionStages.splice(0, 0, winThing);
			if (this.shouldSpeedUp) transitionStages.splice(1, 0, "speed");
			if (this.isGameOver()) transitionStages = [lastGame().isBoss ? "bossLose" : "lose", "gameOver"];
			if (this.shouldBoss()) transitionStages.splice(1, 0, "bossPrep"); // this would be before the prep, so it does BOSS! then regular prep

			return transitionStages;
		},
		increaseSpeed(this: WareEngine) {
			speedDivisor = k.randi(4, 8);
			return k.clamp(this.speed + this.speed * 0.07, 0, MAX_SPEED);
		},
		handleQuickWatch(this: WareEngine) {
			// k.quickWatch("ware.scenePaused", wareEngine.scenePaused);
			// k.quickWatch("ware.objects", wareApp.sceneObj.get("*", { recursive: true }).length);
			k.quickWatch("ware.score", this.score);
			k.quickWatch("ware.time", this.timeLeft?.toFixed(2));
			k.quickWatch("ware.lives", this.lives);
			k.quickWatch("ware.speed", this.speed.toFixed(2));
			k.quickWatch("ware.difficulty", this.difficulty);
			k.quickWatch("ware.winState", this.winState);
			k.quickWatch("ware.gamehat", microgameHat.length);
		},
		winGame() {},
		loseGame() {},
		finishGame(this: WareEngine) {
			if (this.shouldBoss() || this.speed >= MAX_SPEED) {
				shouldSpeedUp = false;
				return;
			}

			gamesSinceLastSpeedUp++;
			if (this.score >= nextSpeedUp) {
				shouldSpeedUp = true;
				gamesSinceLastSpeedUp = 0;
				nextSpeedUp = k.randi(3, 7);
			}
		},
	};
}
