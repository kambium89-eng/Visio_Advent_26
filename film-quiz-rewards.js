"use strict";
// Local help bands, not percentiles measured against other players.
(() => {
  function band(state) {
    if (!state.filmWon || state.wonAt === null) return null;
    if (state.wonAt === 0) return "stars";
    const quizMistakes = state.attempts.reduce((sum, answers) => sum + answers.length, 0);
    const help = Math.min(10, (state.wonAt - 1) / 4 + quizMistakes + state.rejectedFilms.length * 2);
    return help <= 3 ? "sleigh" : help <= 7 ? "house" : "stars";
  }
  window.PuzzleRewards = {
    band,
    eligible(state) {
      if (["stars", "house", "sleigh"].some(key => state.rewards[key])) return [];
      const selected = band(state);
      return selected ? [selected] : [];
    }
  };
})();
