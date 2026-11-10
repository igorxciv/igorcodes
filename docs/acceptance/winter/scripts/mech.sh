#!/bin/zsh
# Mechanism acceptance checks: run from the worktree root.
set -u
W=app/assets/scenes/winter
restore() { git checkout -q -- app; git clean -fdq app/assets/scenes; }
build() { mise exec -- pnpm build 2>&1; }

echo "== delete winter folder"
rm -rf $W
mise exec -- pnpm check >/dev/null 2>&1 && echo "check: pass" || echo "check: FAIL"
out=$(build); echo "build exit: $?"; echo "$out" | grep -i 'error' | head -3
echo "season toggle in index.html: $(grep -c 'data-season-toggle' _site/index.html)"
echo "pre-paint fm-scene in index.html: $(grep -c 'fm-scene' _site/index.html)"
restore

try() {
  echo "== $1"
  out=$(build); code=$?
  echo "exit $code: $(echo "$out" | grep -E '\[(scenes|seasons)\]|Error' | head -2)"
  restore
}

mkdir app/assets/scenes/wintr && cp $W/scene.js app/assets/scenes/wintr/
try "unknown scene folder"

sed -i '' 's/spring: \[3, 1\]/spring: [11, 15]/' app/_data/seasons.js
try "colliding season starts"

sed -i '' 's/end: \[1, 7\]/end: [3, 7]/' app/_data/seasons.js
try "occasion outside its season"

sed -i '' 's/occasions: \["christmas"\]/occasions: []/' $W/scene.js
try "occasion its scene does not list"

head -c 20000 /dev/urandom > $W/assets/noise.webp
try "ambient layer over 200 kB"

git status --short app
