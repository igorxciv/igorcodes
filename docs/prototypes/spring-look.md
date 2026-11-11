# Spring scene look prototype

Throwaway prototype for issue #46, on branch `prototype/spring-look`. It is
never merged. The look matters here; the code does not need to survive.
The shippable scene is issue #25.

## Running it

```sh
pnpm dev
# then open http://localhost:8080/?season=spring&variant=left
```

`?season=spring` previews the spring scene on the home page and stores
nothing. Switch the theme with the theme button; the scene updates in place.

## Variants

Each variant is one named switch: `?variant=<name>`. The issue's numbers
work too (`?variant=1`, `2` or `3`).

| `?variant=` | Look |
| --- | --- |
| `right` or `1` (default) | Tree at the right edge, with the bird |
| `left` or `2` | Tree at the left edge (mirrored), with the bird |
| `nobird` or `3` | Tree at the left edge, without the bird. Left is the better of the two because the fixed theme and season buttons sit at the bottom right and would cover the right tree's trunk at every width |
| `sparse` | Left, with the bird, and about half the blossom: the bough reads as a branch with tufts instead of a garland |
| `round` | Left, with the bird, and petals with round tips instead of the notched cherry tip |
| `soft` | Left, with the bird, and the petal contour at under half strength (it matters most in the light theme) |

Debug only: `&petals=0` hides the falling petals. With the petals hidden,
nothing else may appear inside the copy box.

## Where the code lives

`app/assets/scenes/spring/` uses the scene contract: `scene.js` (icon
`flower-2`, slot `hero`, no occasions), `ambient.js`, and `accents.js` with
`accents.css`. Nothing outside that folder changed except a `biome.json`
override that turns off the two complexity rules for this folder.

## Screenshots

`docs/screenshots/spring-look/<variant>-<theme>-<width>.png` covers every
variant in both themes at 1440 × 900 and 500 × 900. The 500 px shots are in
the lighter form, because the site picks it below 700 px.
