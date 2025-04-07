import games from "./games";
import { Minigame } from "./types";

// TODO: Get rid of coolPrompt and make all the prompts "explicit"
export const coolPrompt = (prompt: string) => prompt.toUpperCase() + (prompt[prompt.length - 1] == "!" ? "" : "!");
export const getGameID = (g: Minigame) => {
	const modules = import.meta.glob("../../games/*/*.ts", { eager: true });
	const gamePath = Object.keys(modules).find((pathKey: string) => (modules[pathKey] as any).default == g);
	const filename = gamePath.split("/")[gamePath.split("/").length - 1].replace(".ts", "");
	return `${g.author}:${filename}`;
};
export const getGameByID = (id: string) => games.find((minigame) => `${minigame.author}:${minigame.prompt}` == id);

export const getGameInput = (g: Minigame) => {
	if (gameUsesMouse(g)) return "mouse";
	else return "keys";
};
export const gameUsesMouse = (g: Minigame) => g.input == "mouse" || g.input == "mouse (hidden)";
export const gameHidesMouse = (g: Minigame) => gameUsesMouse(g) && g.input != "mouse (hidden)";
export const isDefaultAsset = (assetName: any) => typeof assetName == "string" && assetName.includes("@");
