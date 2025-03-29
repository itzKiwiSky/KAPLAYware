<!-- TODO: create a good folder to store assets for this -->


# Guide on "how to contribute your own game to KAPLAYware"

Welcome to the KAPLAYware contributing guide! We'll go over these points

### 1. [How do i add a game?](#how-do-i-add-a-game)
### 2. [What is a minigame context?](#what-is-a-minigame-context)
### [3. How do i develop said game? (aka start(ctx))](#how-do-i-develop-said-game)
### 3. What should i do when developing said game?

# How do i add a game??
First, you must clone the repository and do all the git usual things

Then, you must run in your CMD (command prompt) the following command
```sh
$ npm run create-game {yourname}:{gamename}
```
Where you'll replace {yourname} with your name, and {gamename} with the prompt your game will use! (can be changed later)
- for example
```
$ npm run create-game wario:squeeze
```

Now that your game is created, you'll see a Javascript object with a few properties, there are not all the available properties, but we'll go through the ones that are here, if you want to learn about the other ones, can check the [Minigame](/src/game/types.ts) type to see all of them.


- ``author:`` It's a simple string where your name will be stored!
- ``prompt:`` The prompt/action the player has to do to win the game, this can be a short verb or a hint based on the [minigame's context](#what-is-a-minigame-context)

To set your prompt there's 2 (two) methods, you can either use a simple string
```ts
prompt: "eat!"
```
Or you can set a different prompt using the [minigame's context](#what-is-a-minigame-context)
```ts
prompt: (ctx) => `EAT ${ctx.difficulty} APPLES`
```
And if you're feeling fancy, you can *also* edit the prompt object!
```ts
prompt: (ctx, promptObj) => {
    promptObj.textStyles = {
        "red": {
            color: ctx.RED
        }
    }
    promptObj.text = `GET [red]${ctx.difficulty}[/red] APPLES!`
} 
```

- ``input:`` What type of input does your minigame use? You can either choose `keys`, `mouse` and `mouse (hidden)`.

You'll want to use a hidden mouse when your minigame makes use of a custom cursor, like here:
[insert gif of amyspark-ng:hit]
Notice how there's no cursor? The cursor is actually the hand! Makes some pretty creative minigames

- `duration:` How long the minigame will go for

If you don't put a duration, it will default to `4`.

Remember to choose a reasonable time for this! You wouldn't want a minigame where you'll won after 5 seconds and wait for another 15 seconds for no reason right?

To set this number, you can do it in 2 (two) ways, you can either use a regular number:
```ts
duration: 4,
```

Or you can set a different difficulty depending on difficulty, for those games that take a liiiittle more time when getting harder
```ts
duration: (ctx) => ctx.difficulty == 3 ? 6 : 4 
```

If your minigame is ver short and doesn't rely too much on time and relies much on wheter the player does an action right or wrong, you can return an undefined duration similar to the example above:
```ts
duration: (ctx) => undefined 
```
This will disable the duration, making it go forever until you `finish()` it

- ```rgb:``` The color for the background of your minigame

You want your minigame to look pretty right? You'll want to choose a nice color for the background

There's a few options on how you can do this, you can either use a regular array of R, G and B numbers
```ts
rgb: [235, 38, 202]
```

Or you can set it by returning a color using the [minigame's context](#2-what-is-a-minigame-context)
```ts
rgb: (ctx) => ctx.difficulty == 3 ? ctx.Color.fromArray(237, 24, 63) : ctx.Color.fromArray(235, 38, 202)
```
<!-- (TODO: If i decide to add mulfokColors to the minigame context, i have to update this) -->

- ```urlPrefix: ``` This is the prefix of where your assets will be loaded

This will point to the root of where your minigame's assets will be loaded, more on [How do i develop said game](#how-do-i-develop-said-game-aka-startctx) regarding the `load()` function

These are the basic settings of your KAPLAYware minigame, i might have cut a few to keep it short, for that you'll have to check the [Minigame](/src/game/types.ts) type.

## What is a minigame context?
KAPLAYware's minigame run on something called a "context", which is similar to kaplay's context, aka, not running kaplay on global, something like this
```ts
const k = kaplay()
k.loadBean()
k.add([k.sprite("bean")])
```
In the previous example, every kaplay function is stored in its context, the minigame's run in a similar way, where you'll have a slightly limited context that also includes extra properties! like
- ```difficulty: 1 | 2 | 3``` = The current difficulty of the run
- ```speed: number``` = The current speed of the run, use this to speed up your games appropiately!
**PROTIP:** If you want something in your minigame to be shorter, based on the speed, you can do this:
```ts
loop(1 / ctx.speed, () => addZombie())
```
- ```lives: number``` = How many lives the player has before they die :(
- ```timeLeft: number``` = How many time is left until the player runs out of time!

These are more basic properties, of the context, to actually define win/lose states you'll have to check [How do i develop said game?](#3-how-do-i-develop-said-game)

## How do i develop said game? (aka start(ctx))
Now that we have configured our games, we have to ACTUALLY develop them.

First we have to know about the `load()` function, in this function we'll load all the assets necessary for our game to work, the default root for these assets is "{yourname}/assets/", so it would look a bit like this:
```ts
urlPrefix: "{yourname}/assets",
load(ctx) {
    // load all your sprites here
},
```
eg:
```ts
urlPrefix: "wario/assets",
load(ctx) {
    ctx.loadSprite("nose", "sprites/nose.png"),
    ctx.loadSprite("finger", "sprites/finger.png"),
},
```
The ctx used in `load()` is ANOTHER custom context similar to the [minigame's context](#what-is-a-minigame-context) but only including load functions.

Now we'll have to move to ACTUALLY making gameplay :) THIS is where it gets good
```ts
start(ctx) {
    // run your game's code here
}
```

There's a few functions you have to know in order to make your game work properly

<!-- TODO: Now i talk here about win(), lose(), finish(), onTimeout(), onButtonPress, camAPI, confetti, getRGB, setRGB, etc -->

<!-- TODO: Then do a few small tips like "ignorepoint", no doing weird onMousePresses or weird kaplay's button api stuff -->
<!-- - also talk about built-in sprites -->
<!-- - debug hotkeys -->
<!-- - advanced testing by misanthrope -->

<!-- TODO: Find where to put the npm dev name:prompt -->

# FROM HERE THIS IS ALL OLD

## How to add game????
To make a new game do:

When you make it, the urlPrefix for your game will automatically be created from your user folder, so it will look something like this
`games/wario/assets`

Then you can reference this folder in your games like
```ts
{
    urlPrefix: "wario/assets/",
    load(ctx) {
        ctx.loadSprite("hat", "sprites/hat.png");
    },
}
```

## How to dev?!
To focus on the development of a game, you can do
```sh
$ npm run dev {yourname}:{gamename}
# for example
$ npm run dev wario:squeeze
```

Or if you wish to run the entire game, you can do
```sh
$ npm install
$ npm run dev
```
> There is a one more way to limit games, more in [Advanced testing](#advanced-testing)

## Default assets
If you want to use assets created by kaplay, you can use all the assets found in the [crew package](https://github.com/kaplayjs/crew) ! but you have to prefix your sprite with "@"
```ts
ctx.add([
    ctx.sprite("@bean")
])
```

## Mouse games
If you're going to make a game that uses the mouse, you need to specify it on your game data, it would look something like this
```ts
const newGame: Minigame = {
    // ...
    input: "mouse (hidden)",
    start(ctx) {
        // ...
    }
}
```

You can also use `hidden: true` If you're going to make a game that uses a custom cursor, for more info you can check the [SWAT!](/games/amyspark-ng/swat.ts) minigame or the [HIT!](/games/amyspark-ng/hit.ts) minigame, which use a custom cursor (hand sprites)

- Please refrain to use `onMousePress`!! You can use `ctx.onClick()` and `obj.onClick`, but no mouse button (mouse minigames are only allowed to be played with left click)
```ts
game.onMousePress("right", () => bean.jump()) // BAD!! Don't do this :(
obj.onClick(() => bean.jump())
ctx.onButtonPress("click", () => bean.jump()) // GOOD!! Do this :)
```
- If you're making a mouse minigame and you have an object with an area and you'd like for the cursor to not point at this object, you can tag it with with "ignorepoint"
```ts
ctx.add([
    ctx.area(),
    "ignorepoint"
])
```

### Debug keybinds:
* `Q` - Restart minigame
* `Shift + Q` - Skip minigame
* `Shift + W` - Restart with speed up
* `1, 2, 3` - Restart with new difficulty (wanted to make it with shift but it's not working)
* If you press F2 you'll get a panel that shows some kaplayware info (inputEnabled, score, lives, speed, difficulty, etc)

![alt text](debug.png)

## Advanced testing
You can limit the minigames played by their `gameID` with `.env.development` file in the root folder. Copy `.env.development.example` file and save it without `.example` suffix. Then list games in `VITE_ONLY_MINIGAMES` like `{yourname}:{gamename}`, one per line.

For example:

```sh
# Include only these minigames
VITE_ONLY_MINIGAMES="
  amyspark-ng:spam
  amyspark-ng:connect
"
```

Remember to re-run the dev server when you modify it.
