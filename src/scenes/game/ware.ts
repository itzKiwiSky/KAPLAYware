import { KEvent, KEventController } from "kaplay";
import { Microgame } from "../../types/Microgame";
import { MicrogameCtx } from "./context/types";
import { KAPLAYwareOpts } from "./kaplayware";
import k from "../../engine";
import { TransitionStage } from "./transitions/makeTransition";

export type WareEngine = {
	lives: number;
	score: number;
	timeLeft: number;
	speed: number;
	difficulty: 1 | 2 | 3;
	lastGame: Microgame;
	timePaused: boolean;
	microgameHistory: string[];
	onTimeOutEvents: KEvent;
	winState: boolean | undefined;
	paused: boolean;
	curDuration: number;
	curPrompt: string;
	/** Basically there's this microgame hat, when you pick a microgame, that microgame gets taken out of the hat, when there's no more microgames just add more again to the hat */
	getRandomGame(games?: Microgame[]): Microgame;
	getDifficulty(score?: number): 1 | 2 | 3;
	getTransitionStages(): TransitionStage[];
	increaseSpeed(): number;
	shouldSpeedUp(score?: number, speed?: number, lastGame?: Microgame): boolean;
	shouldBoss(): boolean;
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

	return {
		lives: 3,
		score: 1, // first prep will show 0 turn into 1
		lastGame: null,
		difficulty: 1,
		curDuration: 20,
		curPrompt: "",
		microgameHistory: [],
		onTimeOutEvents: new k.KEvent(),
		paused: false,
		speed: 1,
		timeLeft: 20,
		timePaused: false,
		winState: undefined,
		getRandomGame(games = window.microgames) {
			let randomGame: Microgame = null;

			const regularHat = microgameHat.filter((g) => !g.isBoss);
			const bossHat = microgameHat.filter((g) => g.isBoss);

			// first check if there's items available in the hat, if not, push to the arrays above
			if (this.shouldBoss() && bossHat.length == 0) bossHat.push(...games.filter((g) => g.isBoss));
			else if (!this.shouldBoss() && regularHat.length == 0) regularHat.push(...games.filter((g) => !g.isBoss));
			microgameHat = regularHat.concat(bossHat);

			// now choose a random microgame based on if should boss or not
			randomGame = k.choose(this.shouldBoss() ? bossHat : regularHat);
			microgameHat.splice(microgameHat.indexOf(randomGame), 1); // remove it from hat

			return randomGame;
		},
		getDifficulty(score = this.score) {
			return Math.max(1, (Math.floor(score / 10) + 1) % 4) as 1 | 2 | 3;
		},
		shouldSpeedUp(this: WareEngine, score = this.score, speed = this.speed, lastGame = this.lastGame) {
			const realScore = score + 1;
			const number = k.randi(4, 6);
			const division = () => {
				if (realScore % number == 0) return true;
				else if (k.chance(0.1) && realScore % 5 == 0) return true;
				else return false;
			};
			if (division() && speed <= MAX_SPEED && !this.shouldBoss()) {
				if (lastGame && lastGame.isBoss) return false;
				else return true;
			}
			else return false;
		},
		shouldBoss(games = window.microgames) {
			const scoreEqualsBoss = () => this.score % HOW_FREQUENT_BOSS == 0;
			const onlyBoss = () => games.length == 1 && games[0].isBoss == true;
			return scoreEqualsBoss() || onlyBoss();
		},
		isGameOver(this: WareEngine) {
			return this.winState == false && this.lives == 0;
		},
		getTransitionStages(this: WareEngine) {
			let transitionStages: TransitionStage[] = ["prep"];

			const winThing: TransitionStage = this.lastGame?.isBoss ? (this.winState == true ? "bossWin" : "bossLose") : this.winState == true ? "win" : "lose";
			if (this.winState != undefined) transitionStages.splice(0, 0, winThing);
			if (this.shouldSpeedUp()) transitionStages.splice(1, 0, "speed");
			if (this.isGameOver()) transitionStages = ["lose"];
			if (this.shouldBoss()) transitionStages.splice(1, 0, "bossPrep"); // this would be before the prep, so it does BOSS! then regular prep

			return transitionStages;
		},
		increaseSpeed(this: WareEngine) {
			return k.clamp(this.speed + this.speed * 0.07, 0, MAX_SPEED);
		},
		handleQuickWatch(this: WareEngine) {
			// k.quickWatch("ware.scenePaused", wareEngine.scenePaused);
			// k.quickWatch("ware.objects", wareApp.sceneObj.get("*", { recursive: true }).length);
			k.quickWatch("ware.score", this.score);
			k.quickWatch("ware.time", this.timeLeft?.toFixed(2));
			k.quickWatch("ware.speed", this.speed.toFixed(2));
			k.quickWatch("ware.gamehat", microgameHat.length);
		},
		winGame() { },
		loseGame() { },
		finishGame() { },
	};
}
