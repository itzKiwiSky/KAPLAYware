import { assets } from "@kaplayjs/crew";
import k from "./engine";
import { friends } from "./kaplayware";

k.loadBitmapFont("happy-o", "fonts/happy-o.png", 31, 39);

k.loadSound("@prepJingle", "sounds/prepJingle.ogg");
k.loadSound("@winJingle", "sounds/winJingle.ogg");
k.loadSound("@loseJingle", "sounds/loseJingle.ogg");
k.loadSound("@speedJingle", "sounds/speedJingle.ogg");
k.loadSound("@tick", "sounds/bombtick.mp3");
k.loadSound("@explosion", "sounds/explosion.mp3");

k.loadSprite("@bomb", "sprites/bomb.png");
k.loadSprite("@bomb_cord", "sprites/bomb_cord.png");
k.loadSprite("@bomb_cord1", "sprites/bomb_cord1.png");
k.loadSprite("@bomb_fuse", "sprites/bomb_fuse.png");

k.loadSprite("@bean", assets.bean.sprite);
k.loadSprite("@beant", assets.beant.sprite);
k.loadSprite("@mark", assets.mark.sprite);
k.loadSprite("@cloud", assets.cloud.sprite);
k.loadSprite("@heart", assets.heart.sprite);
k.loadSprite("@sun", assets.sun.sprite);
k.loadSprite("@cloud", assets.cloud.sprite);
k.loadSprite("@grass_tile", "sprites/grass.png");
k.loadSprite("@trophy", "sprites/trophy.png");
k.loadSpriteAtlas("sprites/cursor.png", {
	"@cursor": {
		width: 28,
		height: 32,
		x: 0,
		y: 0,
	},
	"@cursor_point": {
		width: 28,
		height: 32,
		x: 28,
		y: 0,
	},
	"@cursor_like": {
		width: 28,
		height: 32,
		x: 28 * 2,
		y: 0,
	},
	"@cursor_knock": {
		width: 28,
		height: 32,
		x: 28 * 3,
		y: 0,
	},
});

// friends for speed up
friends.forEach((friend) => {
	k.loadSprite(`@${friend}`, assets[friend].sprite);
});
