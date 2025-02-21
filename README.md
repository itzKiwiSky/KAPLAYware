# KAPLAYWARE
yea

## How to add game????
To make a new game do:
```sh
$ npm run create {yourname}:{gamename}
# for example
$ npm run create wario:squeeze
```

When you make it the URLPREFIX for your game will automatically be created from your user folder, so it will look something like this
`games/wario/assets`

Then you can reference this folder in your games like
```ts
{
    load(ctx) {
        ctx.loadSprite("mario", "/sprites/mario.png");
    },
}
```
