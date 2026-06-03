import assert from "node:assert/strict";
import {
  buildOpenAiBackgroundPrompt,
  getSceneForDate,
  pickStyleForDate
} from "./background-theme.mjs";

const styleA = pickStyleForDate("2026-05-31");
const styleB = pickStyleForDate("2026-05-31");
const styleC = pickStyleForDate("2026-06-01");

assert.equal(styleA, styleB, "same date should always resolve to the same style");
assert.notEqual(styleA, undefined);
assert.notEqual(styleC, undefined);

const sceneA = getSceneForDate({
  date: new Date("2026-06-02T08:00:00Z"),
  conditionKey: "partlyCloudy"
});
const sceneB = getSceneForDate({
  date: new Date("2026-06-02T20:00:00Z"),
  conditionKey: "partlyCloudy"
});

assert.equal(sceneA.key, sceneB.key, "same day should always resolve to the same scene");
assert.ok(sceneA.prompt.length > 20);

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
assert.match(prompt, /Overall look:/);
assert.match(prompt, /Scene:/);
assert.match(prompt, /Time of day:/);
assert.match(prompt, /Lighting:/);
assert.match(prompt, /Weather:/);
assert.match(prompt, /Temperature feel:/);
assert.match(prompt, /Composition:/);
assert.match(prompt, /Color palette:/);
assert.match(prompt, /right side is reserved for Hebrew text overlay/i);
assert.match(prompt, /upper-right area visually calm and relatively low-detail/i);
assert.match(prompt, /bottom 25% to 35% of the image/i);
assert.match(prompt, /few small birds in the sky or tiny distant human silhouettes/i);
assert.match(prompt, /do not draw any text, letters, numbers, icons, logos/i);
