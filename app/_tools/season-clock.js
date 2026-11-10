// Which season and occasions are current on a given date.
//
// currentSeason and currentOccasions run in two places: here at build time
// (to validate the date table) and in the browser, where the layout inlines
// their source into the pre-paint script. Keep both free of outside
// references so that their source text works on its own.

function currentSeason(starts, month, day) {
  const today = month * 100 + day;
  let current = null;
  let currentKey = -1;
  let latest = null;
  let latestKey = -1;

  for (const name of Object.keys(starts)) {
    const key = starts[name][0] * 100 + starts[name][1];
    if (key <= today && key > currentKey) {
      current = name;
      currentKey = key;
    }
    if (key > latestKey) {
      latest = name;
      latestKey = key;
    }
  }

  // Before the first start date of the year, the season that started last in
  // the previous year is still running.
  return current ?? latest;
}

function currentOccasions(occasions, season, month, day) {
  const today = month * 100 + day;

  return occasions
    .filter((occasion) => {
      if (occasion.season !== season) {
        return false;
      }
      const start = occasion.start[0] * 100 + occasion.start[1];
      const end = occasion.end[0] * 100 + occasion.end[1];
      // start > end means the occasion crosses the new year.
      return start <= end
        ? today >= start && today <= end
        : today >= start || today <= end;
    })
    .map((occasion) => occasion.name);
}

const formatDate = ([month, day]) =>
  `${day} ${new Date(Date.UTC(2024, month - 1, day)).toLocaleString("en", { month: "long", timeZone: "UTC" })}`;

// Every calendar day from start through end, as [month, day] pairs. 2024 is a
// leap year, so 29 February is covered.
function daysBetween(start, end) {
  const days = [];
  const cursor = new Date(Date.UTC(2024, start[0] - 1, start[1]));
  for (let step = 0; step < 366; step++) {
    const pair = [cursor.getUTCMonth() + 1, cursor.getUTCDate()];
    days.push(pair);
    if (pair[0] === end[0] && pair[1] === end[1]) {
      return days;
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

function validateSeasons({ starts, occasions }) {
  const seen = new Map();
  for (const [name, start] of Object.entries(starts)) {
    const key = start[0] * 100 + start[1];
    if (seen.has(key)) {
      throw new Error(
        `[seasons] ${seen.get(key)} and ${name} both start on ${formatDate(start)}. Each season needs its own start date.`,
      );
    }
    seen.set(key, name);
  }

  for (const occasion of occasions) {
    if (!(occasion.season in starts)) {
      throw new Error(
        `[seasons] Occasion "${occasion.name}" belongs to "${occasion.season}", which is not a season in the date table.`,
      );
    }
    const stray = daysBetween(occasion.start, occasion.end).find(
      ([month, day]) => currentSeason(starts, month, day) !== occasion.season,
    );
    if (stray) {
      throw new Error(
        `[seasons] Occasion "${occasion.name}" falls outside ${occasion.season}: ${formatDate(stray)} is in ${currentSeason(starts, stray[0], stray[1])}.`,
      );
    }
  }
}

module.exports = { currentOccasions, currentSeason, validateSeasons };
