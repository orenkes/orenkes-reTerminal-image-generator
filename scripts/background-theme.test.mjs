import assert from "node:assert/strict";
import { buildOpenAiBackgroundPrompt, pickStyleForDate } from "./background-theme.mjs";

const styleA = pickStyleForDate("2026-05-31");
const styleB = pickStyleForDate("2026-05-31");
const styleC = pickStyleForDate("2026-06-01");

assert.equal(styleA, styleB, "same date should always resolve to the same style");
assert.notEqual(styleA, undefined);
assert.notEqual(styleC, undefined);

const prompt = buildOpenAiBackgroundPrompt({
  weather: {
    locationLine: "חולון, ישראל",
    today: {
      summary: "מעונן חלקית",
      tempRange: "19-26",
      humidity: 60
    },
    ahead: [
      { dayLabel: "יום שני", high: 25, low: 19 },
      { dayLabel: "יום שלישי", high: 26, low: 19 }
    ]
  },
  styleKey: "anime",
  locationName: "חולון",
  slot: "morning",
  dateKey: "2026-05-31"
});

assert.match(prompt, /Style:/);
assert.match(prompt, /Time of day:/);
assert.match(prompt, /Weather:/);
assert.match(prompt, /Composition:/);
assert.match(prompt, /Color palette:/);
assert.match(prompt, /No collage\./);
assert.match(prompt, /upper-right area visually calm/i);
