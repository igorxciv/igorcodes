const { validateSeasons } = require("../_tools/season-clock.js");

// The season date table: the one place outside app/assets/scenes/ that names
// a season. Dates are [month, day], repeat every year, and follow the northern
// hemisphere for every visitor.
//
// A season is defined by its start date only and runs until the next one
// starts. An occasion is a dated stretch inside one season, start and end
// inclusive; it may cross the new year and may overlap another occasion.
//
// The layout inlines this table into the pre-paint script, so the build and
// the browser read the same dates.
const table = {
  starts: {
    winter: [11, 15],
    spring: [3, 1],
    summer: [6, 1],
    autumn: [9, 1],
  },
  occasions: [
    { name: "christmas", season: "winter", start: [12, 1], end: [1, 7] },
    { name: "halloween", season: "autumn", start: [10, 24], end: [10, 31] },
  ],
};

validateSeasons(table);

module.exports = table;
