const assert = require("node:assert/strict");
const { test } = require("node:test");
const vm = require("node:vm");

const {
  currentOccasions,
  currentSeason,
  validateSeasons,
} = require("./season-clock.js");
const table = require("../_data/seasons.js");

const SAME_START_ERROR = /spring.*winter|winter.*spring/;
const OUTSIDE_SEASON_ERROR = /christmas.*outside.*winter/;
const UNKNOWN_SEASON_ERROR = /midsummer.*monsoon/;

const season = (month, day) => currentSeason(table.starts, month, day);
const occasions = (name, month, day) =>
  currentOccasions(table.occasions, name, month, day);

test("each season runs from its start date until the next one starts", () => {
  assert.equal(season(11, 14), "autumn");
  assert.equal(season(11, 15), "winter");
  assert.equal(season(12, 31), "winter");
  assert.equal(season(1, 1), "winter");
  assert.equal(season(2, 29), "winter");
  assert.equal(season(3, 1), "spring");
  assert.equal(season(5, 31), "spring");
  assert.equal(season(6, 1), "summer");
  assert.equal(season(8, 31), "summer");
  assert.equal(season(9, 1), "autumn");
});

test("the season does not depend on the order the table lists them in", () => {
  const shuffled = { summer: [6, 1], winter: [11, 15], autumn: [9, 1] };
  assert.equal(currentSeason(shuffled, 1, 10), "winter");
  assert.equal(currentSeason(shuffled, 7, 4), "summer");
  assert.equal(currentSeason(shuffled, 10, 1), "autumn");
});

test("Christmas runs 1 December through 7 January inclusive", () => {
  assert.deepEqual(occasions("winter", 11, 30), []);
  assert.deepEqual(occasions("winter", 12, 1), ["christmas"]);
  assert.deepEqual(occasions("winter", 12, 31), ["christmas"]);
  assert.deepEqual(occasions("winter", 1, 7), ["christmas"]);
  assert.deepEqual(occasions("winter", 1, 8), []);
});

test("an occasion only counts inside the season it belongs to", () => {
  assert.deepEqual(occasions("summer", 12, 25), []);
});

test("overlapping occasions in one season both show", () => {
  const overlapping = [
    { name: "christmas", season: "winter", start: [12, 1], end: [1, 7] },
    { name: "new-year", season: "winter", start: [12, 28], end: [1, 2] },
  ];
  assert.deepEqual(currentOccasions(overlapping, "winter", 12, 30), [
    "christmas",
    "new-year",
  ]);
});

test("the shipped date table is valid", () => {
  assert.doesNotThrow(() => validateSeasons(table));
});

test("two seasons starting on the same date fail validation", () => {
  assert.throws(
    () =>
      validateSeasons({
        starts: { ...table.starts, spring: [11, 15] },
        occasions: [],
      }),
    SAME_START_ERROR,
  );
});

test("an occasion reaching outside its season fails validation", () => {
  assert.throws(
    () =>
      validateSeasons({
        starts: table.starts,
        occasions: [
          { name: "christmas", season: "winter", start: [11, 1], end: [1, 7] },
        ],
      }),
    OUTSIDE_SEASON_ERROR,
  );
});

test("an occasion naming an unknown season fails validation", () => {
  assert.throws(
    () =>
      validateSeasons({
        starts: table.starts,
        occasions: [
          {
            name: "midsummer",
            season: "monsoon",
            start: [6, 20],
            end: [6, 25],
          },
        ],
      }),
    UNKNOWN_SEASON_ERROR,
  );
});

test("the picker functions are self-contained, so their source can be inlined", () => {
  // The layout inlines the functions' source text into the pre-paint script.
  // Running that text in an empty context proves it needs nothing else.
  const rebuilt = vm.runInNewContext(
    `${currentSeason}\n${currentOccasions}\n({ currentSeason, currentOccasions })`,
  );
  assert.equal(rebuilt.currentSeason(table.starts, 12, 25), "winter");
  assert.equal(
    rebuilt.currentOccasions(table.occasions, "winter", 12, 25).join(),
    "christmas",
  );
});
