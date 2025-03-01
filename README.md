# KAPLAYWARE
yea

## How to add game????
To make a new game do:
```sh
$ npm run create-game {yourname}:{gamename}
# for example
$ npm run create-game wario:squeeze
```

When you make it the urlPrefix for your game will automatically be created from your user folder, so it will look something like this
`games/wario/assets`

Then you can reference this folder in your games like
```ts
{
    load(ctx) {
        ctx.loadSprite("mario", "/sprites/mario.png");
    },
}
```

### Notes:
- Please refrain to use `onMousePress`!! You can use `ctx.onClick()` an `obj.onClick`, but no mouse button (mouse minigames are only allowed to be played with left click)