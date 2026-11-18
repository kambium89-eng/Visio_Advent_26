"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(`${__dirname}/../film-quiz-rewards.js`, "utf8"), sandbox);

const eligible = state => Array.from(sandbox.window.PuzzleRewards.eligible(state));
const fresh = () => ({ solved: Array(9).fill(false), attempts: Array.from({ length: 9 }, () => []), filmWon: false, wonAt: null, rejectedFilms: [], rewards: { stars: false, sleigh: false, house: false } });
function finished(pieces = 1, quizWrong = 0, movieWrong = 0) {
  const state = fresh(); state.filmWon = true; state.wonAt = pieces;
  state.solved = state.solved.map((_, i) => i < pieces);
  for (let i = 0; i < quizWrong; i++) state.attempts[Math.floor(i / 2)].push(i % 2);
  state.rejectedFilms = Array.from({ length: movieWrong }, (_, i) => `wrong-${i}`);
  return state;
}
assert.deepEqual(eligible(fresh()), [], "A fresh round has no reward");
const quizOnly = fresh(); quizOnly.solved.fill(true);
assert.deepEqual(eligible(quizOnly), [], "No reward before the film is correctly guessed");
assert.deepEqual(eligible(finished()), ["sleigh"], "Early recognition earns Santa");
assert.deepEqual(eligible(finished(9)), ["sleigh"], "A perfect nine-question run also earns Santa");
assert.deepEqual(eligible(finished(9, 1)), ["sleigh"], "The top band permits a mistake; exact 30% boundary");
assert.deepEqual(eligible(finished(6, 2)), ["house"], "Just above the top boundary earns the house");
assert.deepEqual(eligible(finished(9, 5)), ["house"], "Exact 70% boundary still earns the house");
assert.deepEqual(eligible(finished(6, 6)), ["stars"], "Just above 70% earns stars");
assert.deepEqual(eligible(finished(9, 12, 4)), ["stars"], "More help still gets a celebration");
assert.deepEqual(eligible(finished(1, 3)), ["sleigh"], "Early recognition tolerates a few quiz mistakes");
assert.deepEqual(eligible(finished(1, 0, 2)), ["house"], "Repeated movie guesses need more help");
assert.deepEqual(eligible(finished(1, 0, 4)), ["stars"], "Eliminating many movie options earns stars");
assert.deepEqual(eligible(finished(0)), ["stars"], "A blind guess receives the general celebration");
for (const key of ["stars", "house", "sleigh"]) {
  const state = finished(); state.rewards[key] = true;
  assert.deepEqual(eligible(state), [], "Exactly one celebration, also after reload or continued play");
}
const rank = { sleigh: 0, house: 1, stars: 2 };
for (let pieces = 1; pieces <= 9; pieces++) {
  for (let movies = 0; movies <= 9; movies++) {
    let last = 0;
    for (let wrong = 0; wrong <= 18; wrong++) {
      const result = eligible(finished(pieces, wrong, movies));
      assert.equal(result.length, 1);
      assert(rank[result[0]] >= last, "Extra mistakes cannot improve a reward");
      last = rank[result[0]];
    }
  }
}
const data = JSON.parse(fs.readFileSync(`${__dirname}/../content/15-film-quiz.json`, "utf8"));
assert.equal(data.questions.length, 9);
assert.equal(data.films.length, 10);
data.questions.forEach(q => { assert.equal(q.choices.length, 3); assert(q.correct >= 0 && q.correct < 3); assert(!/Aschenbrödel/i.test(q.question)); });
assert.deepEqual(Array.from(data.questions, q => q.correct).sort(), [0, 0, 0, 1, 1, 1, 2, 2, 2]);
assert.equal(data.answer, "aschenbroedel");
assert.deepEqual(data.films.filter(f => ["third-prince", "golden-star", "aschenbroedel", "evening-star"].includes(f.id)).map(f => data.films.indexOf(f) + 1), [1, 4, 7, 10]);
const calendar = JSON.parse(fs.readFileSync(`${__dirname}/../content/calendar.json`, "utf8"));
assert.equal(calendar.find(d => d.day === 15).type, "filmquiz");
assert.equal(calendar.find(d => d.day === 15).house, "house-15");
console.log("Passed band boundaries and 1,710 exclusive-reward scenarios; nine Christmas-film questions and balanced answers remain valid.");
