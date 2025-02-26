import * as fs from "fs/promises";

const [author, game] = (process.argv[2] ?? "").split(":");

if (!author || !game) {
	console.error("Must specify author and game name");
	console.error("$ npm run create {author}:{game}");
	process.exit(1);
}

const author_dir = `games/${author}`;
const game_dir = `games/${author}/${game}`;
const assets_dir = `${author_dir}/assets`;

const template = `
import { assets } from "@kaplayjs/crew";
import { Minigame } from "../../../src/types.ts";

const newGame: Minigame = {
	prompt: "${game}",
	author: "${author}",
	rgb: [0, 0, 0],
	urlPrefix: "${assets_dir}",
	load(ctx) {
		ctx.loadSprite("bean", assets.bean.sprite);
	},
	start(ctx) {
		const game = ctx.make([ctx.timer()]);

		const bean = game.add([
			ctx.sprite("bean"),
			ctx.pos(),
		]);

		return game;
	},
};

export default newGame;
`.trim();

const isDir = (path) =>
	fs
		.stat(path)
		.then((stat) => stat.isDirectory())
		.catch(() => false);

if (await isDir(game_dir)) {
	console.error(`Game already exists at ${game_dir}!`);
	process.exit(1);
}

await fs.mkdir(game_dir, { recursive: true }); // makes the actual game dir
await fs.mkdir(assets_dir, { recursive: true }); // makes the assets dir
await fs.writeFile(`${game_dir}/game.ts`, template); // writes the template code to game.ts

console.log(`Game created at ${game_dir}!`);
