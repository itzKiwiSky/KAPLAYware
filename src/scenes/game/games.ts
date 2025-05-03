import Minigame from "./minigameType";
import { getGameID } from "./utils";

export const modules = import.meta.glob("../../../games/*/*.ts", { eager: true });

// TODO: make this work
const INCLUDE_BOSSES = true;
const exclude = new Set([]);

/** The imported games */
const games = Object.values(modules)
	.map((module: any) => module.default)
	.filter((game) => !exclude.has(getGameID(game))) as Minigame[];

const onlyInclude = new Set([
	DEV_MINIGAME, // Passed arg from npm run dev {yourname}:{gamename}
	...(import.meta.env?.VITE_ONLY_MINIGAMES ?? "").trim().split("\n").map((s: string) => s.trim()),
].filter((id) =>
	games.some((game) => {
		//  && (INCLUDE_BOSSES ? game.isBoss == true : false)
		return getGameID(game) === id;
	})
));

export default onlyInclude.size
	? games.filter((game) => onlyInclude.has(getGameID(game)))
	: games;
