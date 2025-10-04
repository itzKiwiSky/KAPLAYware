import { Microgame } from "../types/Microgame";
const getGameID = (g) => `${g.author}:${g.name}`; // TODO: fix this
window.microgames = [];

export const modules = import.meta.glob("../../games/**/*/main.ts", { eager: true });

const exclude = new Set(["amyspark-ng:test"]);

/** The imported games */
const games = Object.values(modules)
	.map((module: any) => module.default)
	.filter((game) => !exclude.has(getGameID(game))) as Microgame[];

// TODO: Find a better place for this
for (const g of games) {
	if (!g.isBoss) g.isBoss = false;
}

const onlyInclude = new Set([
	window.DEV_MICROGAME, // Passed arg from npm run dev {yourname}:{gamename}
].filter((id) => games.some((game) => getGameID(game) === id)));

if (onlyInclude.size == 0 && window.DEV_MICROGAME) {
	throw new Error(`Tried to run dev ${window.DEV_MICROGAME}, but that microgame doesn't exist!`);
}

const filteredGames = games.filter((game) => onlyInclude.has(getGameID(game)));
const pushGames = filteredGames.length ? filteredGames : games;

window.microgames.push(...pushGames);

export default window.microgames;
