# Licence of the Quaternius pine at its source

Research for [#31](https://github.com/igorxciv/igorcodes/issues/31), a child of
the map [#29](https://github.com/igorxciv/igorcodes/issues/29). Checked on
2026-11-09.

## Answer

**Confirmed CC0.** The Poly Pizza model "Pine"
([poly.pizza/m/79gmlLnweB](https://poly.pizza/m/79gmlLnweB)) is `Pine_4` from
Quaternius's **Stylized Nature MegaKit**. The pack's own licence file, its
itch.io listing and its page on quaternius.com all state CC0 1.0. The mesh,
the foliage mask (`Leaf_Pine_C.png`) and the bark textures
(`Bark_NormalTree.png`, `Bark_NormalTree_Normal.png`) are all files inside
that pack, so they can ship on a public site, modified and resized, with no
attribution. No fallback pine is needed.

## Evidence

### 1. The pack states CC0 in three first-party places

| Where | What it says |
| --- | --- |
| `License_Standard.txt` at the root of the pack zip downloaded from itch.io | "License: CC0 1.0 Universal (CC0 1.0) Public Domain Dedication https://creativecommons.org/publicdomain/zero/1.0/" and "Models by @Quaternius" |
| [quaternius.itch.io/stylized-nature-megakit](https://quaternius.itch.io/stylized-nature-megakit) | Metadata row "Asset license: Creative Commons Zero v1.0 Universal"; the Standard tier image reads "Can be used in personal, educational, and commercial projects. CC0." |
| [quaternius.com/packs/stylizednaturemegakit.html](https://quaternius.com/packs/stylizednaturemegakit.html) | "License CC0" and "Free to use in personal, educational and commercial projects. (CC0 License)". Its "Download on Itch.io" button opens the itch.io page above. |

The site-wide FAQ ([quaternius.com/faq.html](https://quaternius.com/faq.html))
adds: "All models are under the CC0 License." and, on credit, "No, attribution
is not necessary. However, credit is always appreciated."

The licence file calls this the "standard FREE version", holding 68 of the
pack's 116 models. All five pines are in it, so nothing here depends on the
paid Pro or Source tiers.

### 2. The Poly Pizza file is `Pine_4` from that pack

Poly Pizza's page names no pack. The match was made by downloading both files
and comparing them.

- Pack: the free Standard zip from the itch.io page, 104,088,529 bytes,
  SHA-256 `298f6732b872e4cf7b30e6e7abf9641c7f6dc6b326df37ac089533ed7e3d58c9`.
  It contains `glTF/Pine_1.gltf` to `Pine_5.gltf`, dated 2024-07-20.
- Poly Pizza: `https://static.poly.pizza/082c2026-56af-4e3f-bea7-9ae5de71101f.glb`,
  2,221,932 bytes (the size the earlier research recorded), SHA-256
  `240e6f60c5b106a892c80490d7c710f20ef902b328b5e173c0a567334e4df972`. Page
  shows creator Quaternius, "Public Domain (CC0)", uploaded 2 Aug 2024, twelve
  days after the pack files were made.

| Property | Poly Pizza "Pine" | Pack `Pine_4.gltf` |
| --- | --- | --- |
| Node name inside the file | `Pine_4` | file is `Pine_4` (mesh `tree.031`) |
| Materials | `Bark_NormalTree`, `Leaves_Pine` | `Bark_NormalTree`, `Leaves_Pine` |
| Trunk triangles | 2,160 | 2,160 |
| Foliage triangles | 1,210 | 1,210 |
| Trunk bounds (min / max) | -1.9725, -0.2351, -1.9965 / 1.9782, 9.7004, 0.8374 | identical to 4 decimals |
| Foliage bounds (min / max) | -2.8718, 2.4393, -2.9459 / 2.9302, 10.0013, 2.4249 | identical to 4 decimals |
| Texture names | `Bark_NormalTree_Normal.png`, `Bark_NormalTree.png`, `Leaf_Pine_C.png` | the same three, as external files |
| Texture size | 1024 px | 2048 px |

The other four pines differ in every row (for example `Pine_1` has 3,177 and
770 triangles and is 6.8 units tall), so the match is to `Pine_4` alone.

The files are not byte-identical. Poly Pizza's was converted from FBX
(`FBX2glTF v0.9.7`) and the pack's glTF was exported from Blender, so vertex
counts differ (1,523 + 1,437 against 2,978 + 1,910) while the triangles and
bounds agree. Poly Pizza also halves the textures. Downscaling both sets to
64 px and comparing pixels gave a mean difference of 0.12 to 0.34 out of 255
for the three matching pairs, against 19.8 for a control (the pine bark
against the pack's `Bark_TwistedTree.png`). They are the same images.

### 3. What CC0 allows

[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) waives copyright
and related rights worldwide: the work can be copied, modified and
distributed, including commercially, without asking permission or giving
credit. Simplifying the mesh to 2,021 triangles, stripping the normal map and
resizing the textures to 256 px WebP, as the earlier research planned, are all
permitted. A credit line for Quaternius is a courtesy, not a condition.

## Recommendation

Take the pine from the itch.io pack, not from Poly Pizza: `glTF/Pine_4.gltf`
with `Pine_4.bin`, `Leaf_Pine_C.png` and `Bark_NormalTree.png`. That gives a
file whose licence text travels with it and 2048 px texture sources. The
measurements in
[natural-winter-assets.md](https://github.com/igorxciv/igorcodes/blob/research/natural-winter-assets/docs/research/natural-winter-assets.md)
were taken on the Poly Pizza copy; the triangle count is the same, but the
vertex count of the Blender export is higher, so the shipped size should be
re-measured after welding and simplifying.

The pack also offers `Pine_1`, `Pine_2`, `Pine_3` and `Pine_5` under the same
licence and sharing the same two textures, if the scene wants more than one
silhouette.

## Not verified

- **Authorship of the textures.** CC0 only covers what Quaternius had the
  right to dedicate. The licence file says "Models by @Quaternius" and says
  nothing separate about the bark and leaf textures. Nothing found suggests
  they come from a third party, but that cannot be proved from outside.
- **Who uploaded to Poly Pizza.** The page credits Quaternius, but whether
  Quaternius or Poly Pizza staff uploaded it is not shown. It no longer
  matters, since the content matches the first-party pack.
- **Model count.** The licence file says the Standard tier has 68 of 116
  models; the itch.io Standard image says "81 completely free assets". The
  difference was not chased; the pines are in the zip either way.
- **Pro and Source tiers.** Not downloaded. The quaternius.com page describes
  them as "still free to use", and the FAQ says all models are CC0, but their
  licence files were not read.
- **Other mirrors.** A copy on
  [OpenGameArt](https://opengameart.org/content/stylized-nature-megakit) is
  marked CC0 but was posted by a third-party account, so it was not used as
  evidence.
