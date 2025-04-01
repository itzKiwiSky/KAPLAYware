import { assets } from "@kaplayjs/crew";
import { SpriteAtlasData } from "kaplay";
import k from "./engine";
import { loadAPIs } from "./game/api";
import games from "./game/games";
import { LoadCtx } from "./game/types";
import { getGameID } from "./game/utils";

k.loadSprite("logo", "sprites/logo.png");
k.loadSprite("menu-buttons", "sprites/menu/buttons.png", { sliceX: 2, sliceY: 3 });
k.loadSprite("menu-cartridge", "sprites/menu/cartridge.png");
k.loadSprite("menu-check", "sprites/menu/check.png");

k.loadBitmapFont("happy", "fonts/happy.png", 31, 39);
k.loadBitmapFont("happy-o", "fonts/happy-o.png", 31, 39);

// transition
// TODO: rename these a sensible thing
k.loadSprite("bg", "sprites/transition/pack1/bg.png");
k.loadSprite("computer", "sprites/transition/pack1/computer.png");
k.loadSprite("screen", "sprites/transition/pack1/screen.png", { sliceX: 3, sliceY: 1 });
k.loadSprite("calendar", "sprites/transition/pack1/calendar.png");
k.loadSprite("page", "sprites/transition/pack1/page.png");
k.loadSprite("chillguy", "sprites/transition/pack1/chillguy.png", { sliceX: 3, sliceY: 1 });
k.loadSprite("chillcat", "sprites/transition/pack1/chillcat.png", { sliceX: 3, sliceY: 1 });
k.loadSprite("chillbutterfly", "sprites/transition/pack1/chillbutterfly.png", { sliceX: 3, sliceY: 1 });
k.loadSprite("table", "sprites/transition/pack1/table.png");
k.loadSprite("grass", "sprites/transition/pack1/grass.png");
k.loadSprite("coffee", "sprites/transition/pack1/coffee.png", { sliceX: 7, sliceY: 1, anims: { "hot": { from: 0, to: 6 } } });
k.loadSprite("flowerpot", "sprites/transition/pack1/flowerpot.png");
k.loadSprite("flower", "sprites/transition/pack1/flowers.png", { sliceX: 3, sliceY: 1 });
k.loadSprite("heart", "sprites/transition/pack1/heart.png");

// input
k.loadSprite("input-circle", "sprites/transition/input/circle.png");
k.loadSprite("input-keys", "sprites/transition/input/keys.png");
k.loadSprite("input-mouse", "sprites/transition/input/mouse.png");
k.loadSprite("input-keysandmouse", "sprites/transition/input/keysandmouse.png");

k.loadSound("prepJingle", "sounds/prepJingle.ogg");
k.loadSound("winJingle", "sounds/winJingle.ogg");
k.loadSound("loseJingle", "sounds/loseJingle.ogg");
k.loadSound("speedJingle", "sounds/speedJingle.ogg");
k.loadSound("gameOverJingle", "sounds/gameOverJingle.ogg");
k.loadSound("tick", "sounds/bombtick.mp3");
k.loadSound("explosion", "sounds/explosion.mp3");

// bomb
k.loadSprite("bomb", "sprites/game/bomb.png");
k.loadSprite("bomb-cord-start", "sprites/game/cord-start.png");
k.loadSprite("bomb-cord", "sprites/game/cord.png");
k.loadSprite("bomb-cord-tip", "sprites/game/cord-tip.png");
k.loadSprite("bomb-fuse", "sprites/game/fuse.png");

k.loadSpriteAtlas("sprites/cursor.png", {
	"cursor": {
		width: 28,
		height: 32,
		x: 0,
		y: 0,
	},
	"cursor-point": {
		width: 28,
		height: 32,
		x: 28,
		y: 0,
	},
	"cursor-like": {
		width: 28,
		height: 32,
		x: 28 * 2,
		y: 0,
	},
	"cursor-knock": {
		width: 28,
		height: 32,
		x: 28 * 3,
		y: 0,
	},
});

// load game assets
const loadCtx = {};

for (const api of loadAPIs) {
	loadCtx[api] = k[api];
}

games.forEach((game) => {
	if (!game.load) return;

	// patch loadXXX() functions to scoped asset names
	const loaders = [
		"loadSprite",
		"loadSpriteAtlas",
		"loadAseprite",
		"loadPedit",
		"loadJSON",
		"loadSound",
		"loadFont",
		"loadBitmapFont",
		"loadShader",
		"loadShaderURL",
	];

	for (const loader of loaders) {
		loadCtx[loader] = (name: string, ...args: any) => {
			if (typeof name === "string") {
				name = `${getGameID(game)}-${name}`;
			}
			return k[loader](name, ...args);
		};

		if (loader == "loadSpriteAtlas") {
			loadCtx[loader] = (path: string, data: SpriteAtlasData) => {
				Object.keys(data).forEach((key) => {
					delete Object.assign(data, { [`${getGameID(game)}-${key}`]: data[key] })[key]; // renames the keys
				});
				return k.loadSpriteAtlas(path, data);
			};
		}
	}

	// patch loadRoot() to consider g.urlPrefix
	if (game.urlPrefix != undefined) {
		loadCtx["loadRoot"] = (p: string) => {
			if (p) k.loadRoot(game.urlPrefix + p);
			return k.loadRoot().slice(game.urlPrefix.length);
		};
		k.loadRoot(game.urlPrefix);
	}
	else {
		k.loadRoot("");
	}

	// DON'T change the order of this
	game.load(loadCtx as LoadCtx);
	loadCtx["loadRoot"] = k.loadRoot;
});

// const load crew
Object.keys(assets).forEach((key) => {
	const asset = assets[key];
	k.loadSprite(`@${key}`, asset.sprite);
	k.loadSprite(`@${key}-o`, asset.outlined);
});
