"use strict";
async function createChristmasFilmQuiz(target, {isCurrent = () => true, day = 15} = {}) {
  let cancelled = false, dispose = () => {};
  async function load() {
    const loading = document.createElement("p"); loading.className = "form-message";
    loading.setAttribute("role", "status"); loading.textContent = "Das Filmpuzzle wird geladen …";
    target.replaceChildren(loading);
    try {
      const response = await fetch("content/15-film-quiz.json?v=20261118");
      if (!response.ok) throw new Error("quiz");
      const data = await response.json();
      if (!Array.isArray(data.questions) || data.questions.length !== 9 || !Array.isArray(data.films) || data.films.length !== 10 || !data.questions.every(q => q.choices.length === 3 && Number.isInteger(q.correct) && q.correct >= 0 && q.correct < 3)) throw new Error("quiz-data");
      if (cancelled || !isCurrent()) return;
      dispose(); dispose = mount(data);
    } catch {
      if (cancelled || !isCurrent()) return;
      const message = document.createElement("p"); message.className = "form-message error";
      message.setAttribute("role", "alert"); message.textContent = "Das Filmpuzzle konnte nicht geladen werden. Bitte versuche es noch einmal.";
      const retry = document.createElement("button"); retry.type = "button"; retry.className = "text-button";
      retry.textContent = "Filmpuzzle erneut laden"; retry.addEventListener("click", load);
      target.replaceChildren(message, retry);
    }
  }
  function mount(data) {
    const root = document.createElement("div"); root.id = "christmas-film-quiz";
    root.innerHTML = `
    <section class="puzzle-section" id="puzzle" aria-labelledby="puzzle-title">
      <div class="section-heading">
        <div><p class="step-label">Das Bild entdecken</p><h2 id="puzzle-title">Ein richtiges Kreuzchen. Ein neues Stück.</h2></div>
        <div class="progress-count"><strong id="piece-count">0 / 9</strong><span>Teile aufgedeckt</span></div>
      </div>
      <div class="progress-track" role="progressbar" aria-label="Aufgedeckte Puzzleteile" aria-valuemin="0" aria-valuemax="9" aria-valuenow="0"><span id="progress-fill"></span></div>
      <div class="game-layout">
        <div class="board-column">
          <div class="board-frame">
            <svg id="puzzle-board" viewBox="0 0 900 540" role="group" aria-label="Filmpuzzle mit neun auswählbaren Teilen"></svg>
          </div>
          <p class="board-hint" id="board-hint">Wähle ein Teil. Eine Frage, drei Antworten – eine ist richtig.</p>
          <p class="image-credit">Filmszene © DEFA / Barrandov · Bild aus unserer Projektplanung</p>
        </div>
        <aside class="question-card" id="question-panel" aria-labelledby="question-heading"></aside>
      </div>
    </section>
    <section class="film-section" id="film-section" aria-labelledby="film-heading">
      <p class="step-label">Den Film erraten</p>
      <h2 id="film-heading">Kommt dir die Szene bekannt vor?</h2>
      <p class="film-intro" id="film-instruction">Du kannst jederzeit raten. Wähle einen der zehn Titel und prüfe deinen Tipp.</p>
      <form id="film-form">
        <fieldset id="film-choices"><legend class="sr-only">Welcher Film ist gesucht?</legend></fieldset>
        <div class="guess-actions"><button class="primary-button" id="check-film" type="submit" disabled>Filmtipp prüfen <span aria-hidden="true">→</span></button><span class="gentle-note">Kein Zeitdruck. Du darfst es mehrmals versuchen.</span></div>
      </form>
      <div id="film-feedback" role="status" aria-live="polite"></div>
    </section>
    <footer class="game-footer"><span id="save-note">Dein Fortschritt bleibt in diesem Browser erhalten.</span><button type="button" class="text-button" id="reset-button"><span aria-hidden="true">↻</span> Neu beginnen</button></footer>

<div class="sr-only" id="announcer" role="status" aria-live="polite" aria-atomic="true"></div>
  <dialog id="reset-dialog" aria-labelledby="reset-heading"><h2 id="reset-heading">Noch einmal von vorne?</h2><p>Alle Puzzleteile werden wieder verdeckt und deine Antworten zurückgesetzt.</p><form method="dialog"><button class="secondary-button" value="cancel">Weiterspielen</button><button class="primary-button" id="confirm-reset" value="reset">Neu beginnen</button></form></dialog>
    `;
    target.replaceChildren(root);
    const home = document.querySelector(`.village-house[data-day="${day}"] img`);
    const celebrationLayer = document.createElement("div");
    celebrationLayer.className = "film-quiz-celebration"; celebrationLayer.hidden = true;
    document.body.append(celebrationLayer);
  const $ = id => root.querySelector(`#${id}`);
  const NS = "http://www.w3.org/2000/svg";
  const storageKey = "visio-advent-day15-film-puzzle-v2";
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let storageAvailable = true;
  const freshState = () => ({ version: data.version, solved: Array(9).fill(false), attempts: Array.from({ length: 9 }, () => []), active: 0, filmWon: false, wonAt: null, selectedFilm: "", rejectedFilms: [], rewards: { stars: false, sleigh: false, house: false } });
  let state = loadState();
  let lastFeedback = "";
  const celebrations = PuzzleCelebrations.create(celebrationLayer, home);

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      const valid = saved && saved.version === data.version && Array.isArray(saved.solved) && saved.solved.length === 9 && saved.solved.every(v => typeof v === "boolean") && Array.isArray(saved.attempts) && saved.attempts.length === 9 && saved.attempts.every(a => Array.isArray(a) && a.every(n => Number.isInteger(n) && n >= 0 && n < 3)) && Number.isInteger(saved.active) && saved.active >= 0 && saved.active < 9 && typeof saved.filmWon === "boolean" && (saved.wonAt === null || Number.isInteger(saved.wonAt) && saved.wonAt >= 0 && saved.wonAt <= 9) && typeof saved.selectedFilm === "string" && Array.isArray(saved.rejectedFilms) && saved.rejectedFilms.every(id => data.films.some(f => f.id === id));
      if (!valid) return freshState();
      if (!saved.rewards || !["stars", "sleigh", "house"].every(key => typeof saved.rewards[key] === "boolean")) return freshState();
      if (!data.films.some(f => f.id === saved.selectedFilm) || saved.rejectedFilms.includes(saved.selectedFilm)) saved.selectedFilm = "";
      saved.rejectedFilms = saved.rejectedFilms.filter(id => id !== data.answer);
      return saved;
    } catch {
      // Private browsing and file previews may disable local storage.
      return freshState();
    }
  }
  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify(state)); }
    catch { storageAvailable = false; }
    $("save-note").textContent = storageAvailable ? "Dein Fortschritt bleibt in diesem Browser erhalten." : "Dein Fortschritt bleibt erhalten, solange diese Seite geöffnet ist.";
  }
  function countSolved() { return state.solved.filter(Boolean).length; }
  function announce(message) { $("announcer").textContent = message; }
  function svgElement(tag, attrs, content) {
    const element = document.createElementNS(NS, tag);
    Object.entries(attrs || {}).forEach(([key, value]) => element.setAttribute(key, value));
    if (content !== undefined) element.textContent = content;
    return element;
  }

  // Generate each shared edge once. Reversing that same edge for the neighbour
  // makes complementary tabs and sockets, with no gaps between image pieces.
  function edge(x, y, dx, dy, tab) {
    if (!tab) return { points: [[x, y], [x + dx, y + dy]] };
    const length = Math.hypot(dx, dy), nx = -dy / length, ny = dx / length;
    const point = (t, depth = 0) => [x + dx * t + nx * depth * tab, y + dy * t + ny * depth * tab];
    return { points: [point(0), point(.39), point(.42), point(.43, -4), point(.40, -13), point(.39, -24), point(.45, -28), point(.50, -28), point(.55, -28), point(.61, -24), point(.60, -13), point(.57, -4), point(.58), point(.61), point(1)] };
  }
  const horizontal = Array.from({ length: 4 }, (_, row) => Array.from({ length: 3 }, (_, col) => edge(col * 300, row * 180, 300, 0, row === 0 || row === 3 ? 0 : (row + col) % 2 ? 1 : -1)));
  const vertical = Array.from({ length: 3 }, (_, row) => Array.from({ length: 4 }, (_, col) => edge(col * 300, row * 180, 0, 180, col === 0 || col === 3 ? 0 : (row + col) % 2 ? -1 : 1)));
  function edgeCommands(edgeData, reverse = false) {
    const points = reverse ? [...edgeData.points].reverse() : edgeData.points;
    const pointString = p => p.map(n => Math.round(n * 100) / 100).join(" ");
    if (points.length === 2) return `L ${pointString(points[1])}`;
    return `L ${pointString(points[1])} C ${pointString(points[2])} ${pointString(points[3])} ${pointString(points[4])} C ${pointString(points[5])} ${pointString(points[6])} ${pointString(points[7])} C ${pointString(points[8])} ${pointString(points[9])} ${pointString(points[10])} C ${pointString(points[11])} ${pointString(points[12])} ${pointString(points[13])} L ${pointString(points[14])}`;
  }
  function piecePath(row, col) {
    return `M ${col * 300} ${row * 180} ${edgeCommands(horizontal[row][col])} ${edgeCommands(vertical[row][col + 1])} ${edgeCommands(horizontal[row + 1][col], true)} ${edgeCommands(vertical[row][col], true)} Z`;
  }
  function buildBoard() {
    const board = $("puzzle-board");
    const defs = svgElement("defs");
    const gradient = svgElement("linearGradient", { id: "piece-paper", x1: "0", y1: "0", x2: "1", y2: "1" });
    gradient.append(svgElement("stop", { offset: "0%", "stop-color": "#e3e8d7" }), svgElement("stop", { offset: "100%", "stop-color": "#ccd6be" }));
    const scenePattern = svgElement("pattern", { id: "movie-scene", patternUnits: "userSpaceOnUse", width: 900, height: 540 });
    scenePattern.append(svgElement("image", { href: "assets/quiz/scene-hunt.jpg", width: 900, height: 540, preserveAspectRatio: "xMidYMid slice" }));
    defs.append(gradient, scenePattern);
    data.questions.forEach((question, i) => {
      const row = Math.floor(i / 3), col = i % 3;
      const clip = svgElement("clipPath", { id: `piece-clip-${i}` });
      clip.append(svgElement("path", { d: piecePath(row, col) }));
      defs.append(clip);
    });
    board.append(defs);
    data.questions.forEach((question, i) => {
      const row = Math.floor(i / 3), col = i % 3, d = piecePath(row, col);
      const group = svgElement("g", { class: "puzzle-piece", role: "button", tabindex: "0", "data-piece": i, "aria-controls": "question-panel" });
      group.append(svgElement("path", { d, fill: "url(#movie-scene)", class: "piece-image", "aria-hidden": "true" }), svgElement("path", { d, class: "piece-cover" }), svgElement("path", { d, class: "piece-outline" }), svgElement("text", { x: col * 300 + 150, y: row * 180 + 97, "text-anchor": "middle", class: "piece-number", "aria-hidden": "true" }, String(i + 1)));
      const dots = svgElement("g", { class: "piece-dots", "aria-hidden": "true" });
      [0, 1, 2].forEach(n => dots.append(svgElement("circle", { cx: col * 300 + 135 + n * 15, cy: row * 180 + 118, r: 2.3 })));
      group.append(dots);
      group.addEventListener("click", () => selectPiece(i));
      group.addEventListener("keydown", event => {
        if (["Enter", " "].includes(event.key)) { event.preventDefault(); selectPiece(i, true); }
        const offsets = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 3, ArrowUp: -3 };
        if (event.key in offsets) {
          event.preventDefault();
          const next = Math.max(0, Math.min(8, i + offsets[event.key]));
          board.querySelector(`[data-piece="${next}"]`).focus();
        }
      });
      board.append(group);
    });
  }
  function updateBoard() {
    const count = countSolved();
    $("piece-count").textContent = `${count} / 9`;
    $("progress-fill").style.width = `${count / 9 * 100}%`;
    root.querySelector(".progress-track").setAttribute("aria-valuenow", count);
    root.querySelectorAll(".puzzle-piece").forEach(piece => {
      const i = Number(piece.dataset.piece);
      piece.classList.toggle("is-active", state.active === i);
      piece.classList.toggle("is-solved", state.solved[i]);
      piece.setAttribute("aria-pressed", String(state.active === i));
      piece.setAttribute("aria-label", `Puzzleteil ${i + 1}, ${state.solved[i] ? "aufgedeckt, Antwort ansehen" : "verdeckt, Frage beantworten"}`);
    });
    const activePiece = $("puzzle-board").querySelector(`[data-piece="${state.active}"]`);
    if (activePiece) $("puzzle-board").append(activePiece);
    $("board-hint").textContent = count === 9 ? "Das Bild ist vollständig! Welcher Film ist es?" : "Wähle ein Teil. Eine Frage, drei Antworten – eine ist richtig.";
  }
  function selectPiece(index, focusQuestion = false) {
    state.active = index;
    lastFeedback = "";
    updateBoard(); renderQuestion(); save();
    if (focusQuestion) $("question-heading").focus({ preventScroll: true });
  }
  function renderQuestion(focusAfterAnswer = false) {
    const index = state.active, question = data.questions[index], solved = state.solved[index];
    const panel = $("question-panel");
    panel.replaceChildren();
    const top = document.createElement("div"); top.className = "question-top";
    const label = document.createElement("p"); label.textContent = `Puzzleteil ${index + 1} von 9`;
    const category = document.createElement("span"); category.className = "category"; category.textContent = question.category;
    top.append(label, category);
    const heading = document.createElement("h3"); heading.id = "question-heading"; heading.tabIndex = -1; heading.textContent = question.question;
    const list = document.createElement("div"); list.className = "answer-list"; list.setAttribute("role", "group"); list.setAttribute("aria-labelledby", heading.id);
    question.choices.forEach((choice, choiceIndex) => {
      const button = document.createElement("button"); button.type = "button"; button.className = "answer-option";
      const wrong = state.attempts[index].includes(choiceIndex);
      button.disabled = solved || wrong;
      button.classList.toggle("is-wrong", wrong);
      button.classList.toggle("is-correct", solved && choiceIndex === question.correct);
      const letter = document.createElement("span"); letter.className = "answer-letter"; letter.setAttribute("aria-hidden", "true"); letter.textContent = solved && choiceIndex === question.correct ? "✓" : wrong ? "×" : "ABC"[choiceIndex];
      const text = document.createElement("span"); text.textContent = choice;
      button.append(letter, text);
      button.setAttribute("aria-label", `${choice}${solved && choiceIndex === question.correct ? ", richtig" : wrong ? ", bereits versucht" : ""}`);
      button.addEventListener("click", () => answerQuestion(choiceIndex));
      list.append(button);
    });
    const feedback = document.createElement("div"); feedback.id = "question-feedback"; feedback.className = "question-feedback";
    if (solved) {
      const strong = document.createElement("strong"); strong.textContent = "Richtig! Dein Puzzleteil ist aufgedeckt.";
      const explanation = document.createElement("span"); explanation.textContent = question.explanation;
      feedback.append(strong, explanation);
    } else if (lastFeedback || state.attempts[index].length) {
      feedback.classList.add("is-wrong"); feedback.textContent = "Noch nicht ganz. Versuche eine andere Antwort – dein Puzzleteil wartet auf dich.";
    }
    panel.append(top, heading, list, feedback);
    if (solved) {
      const next = document.createElement("button"); next.type = "button"; next.className = "primary-button"; next.id = "next-piece";
      next.textContent = countSolved() === 9 ? state.filmWon ? "Zur Filmauflösung ↓" : "Jetzt den Film erraten ↓" : "Nächstes Puzzleteil →";
      next.addEventListener("click", () => {
        if (countSolved() === 9) {
          $("film-section").scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "start" });
          const choice = root.querySelector('#film-choices input:not(:disabled)');
          if (choice) choice.focus({ preventScroll: true });
          else { $("film-heading").tabIndex = -1; $("film-heading").focus({ preventScroll: true }); }
          return;
        }
        let nextIndex = (index + 1) % 9;
        while (state.solved[nextIndex]) nextIndex = (nextIndex + 1) % 9;
        selectPiece(nextIndex, true);
      });
      panel.append(next);
      if (focusAfterAnswer) next.focus({ preventScroll: true });
    } else {
      const note = document.createElement("p"); note.className = "question-note"; note.textContent = "Klicke auf die richtige Antwort, um das Teil aufzudecken."; panel.append(note);
      if (focusAfterAnswer) list.querySelector("button:not(:disabled)")?.focus({ preventScroll: true });
    }
  }
  function answerQuestion(choice) {
    const index = state.active, question = data.questions[index];
    if (state.solved[index] || state.attempts[index].includes(choice)) return;
    if (choice === question.correct) {
      state.solved[index] = true;
      lastFeedback = "";
      updateBoard();
      if (state.filmWon) showWin();
      announce(`Richtig! Puzzleteil ${index + 1} ist aufgedeckt. ${countSolved()} von 9 Teilen sichtbar. ${question.explanation}`);
    } else {
      state.attempts[index].push(choice);
      lastFeedback = "wrong";
      announce("Noch nicht ganz. Versuche eine andere Antwort.");
    }
    save(); renderQuestion(true);
    if (state.solved[index]) grantRewards();
  }

  function renderFilmChoices() {
    const fieldset = $("film-choices");
    const legend = fieldset.querySelector("legend");
    fieldset.replaceChildren(legend);
    data.films.forEach(film => {
      const label = document.createElement("label"); label.className = "film-choice";
      const rejected = state.rejectedFilms.includes(film.id);
      label.classList.toggle("is-rejected", rejected);
      label.classList.toggle("is-answer", state.filmWon && film.id === data.answer);
      const input = document.createElement("input"); input.type = "radio"; input.name = "film"; input.value = film.id;
      input.checked = state.selectedFilm === film.id; input.disabled = rejected || state.filmWon;
      input.setAttribute("aria-describedby", "film-instruction");
      input.addEventListener("change", () => {
        state.selectedFilm = film.id; $("check-film").disabled = false;
        if (!state.filmWon) $("film-feedback").replaceChildren();
        save();
      });
      const title = document.createElement("span"); title.textContent = film.title;
      label.append(input, title); fieldset.append(label);
    });
    $("check-film").disabled = !state.selectedFilm || state.filmWon;
    $("check-film").textContent = state.filmWon ? "Film erkannt ✓" : "Filmtipp prüfen →";
  }
  function showWin() {
    const feedback = $("film-feedback"); feedback.className = "is-success"; feedback.replaceChildren();
    const title = document.createElement("h3"); title.textContent = "Du hast den Film erkannt!";
    const film = document.createElement("p"); const strong = document.createElement("strong"); strong.textContent = "Drei Haselnüsse für Aschenbrödel (1973)"; film.append(strong);
    const details = document.createElement("p"); details.textContent = `Du hast die Szene mit ${state.wonAt} von 9 aufgedeckten Puzzleteilen erkannt.${countSolved() < 9 ? " Wenn du magst, puzzle weiter und entdecke das ganze Bild." : " Das ganze Bild ist aufgedeckt. Schön, dass du mitgerätselt hast!"}`;
    feedback.append(title, film, details);
    $("film-instruction").textContent = "Genau dieser Film war gesucht. Ein kleines Weihnachtsmärchen in neun Teilen.";
  }
  $("film-form").addEventListener("submit", event => {
    event.preventDefault();
    if (!state.selectedFilm || state.filmWon) return;
    if (state.selectedFilm === data.answer) {
      state.filmWon = true; state.wonAt = countSolved();
      save(); renderFilmChoices(); showWin(); grantRewards();
      announce(`Du hast den Film erkannt: Drei Haselnüsse für Aschenbrödel. ${state.wonAt} von 9 Puzzleteilen aufgedeckt.`);
      $("film-feedback").tabIndex = -1; $("film-feedback").focus({ preventScroll: true });
    } else {
      state.rejectedFilms.push(state.selectedFilm); state.selectedFilm = "";
      save(); renderFilmChoices();
      $("film-feedback").className = "";
      $("film-feedback").textContent = "Dieser Film ist es noch nicht. Decke ein weiteres Puzzleteil auf oder versuche einen anderen Titel.";
      announce($("film-feedback").textContent);
      root.querySelector('#film-choices input:not(:disabled)')?.focus({ preventScroll: true });
    }
  });
  function grantRewards() {
    const earned = PuzzleRewards.eligible(state);
    earned.forEach(key => { state.rewards[key] = true; });
    if (earned.length) { save(); celebrations.enqueue(earned); }
  }
  $("reset-button").addEventListener("click", () => $("reset-dialog").showModal());
  $("confirm-reset").addEventListener("click", () => {
    celebrations.cancel();
    state = freshState(); lastFeedback = "";
    $("film-feedback").replaceChildren(); $("film-feedback").className = "";
    $("film-instruction").textContent = "Du kannst jederzeit raten. Wähle einen der zehn Titel und prüfe deinen Tipp.";
    updateBoard(); renderQuestion(); renderFilmChoices(); save(); announce("Das Rätsel beginnt von vorne. Alle neun Teile sind wieder verdeckt.");
  });
  buildBoard(); updateBoard(); renderQuestion(); renderFilmChoices(); save();
  if (state.filmWon) showWin();
  const onPagehide = () => celebrations.cancel();
  window.addEventListener("pagehide", onPagehide);
  return () => {
    window.removeEventListener("pagehide", onPagehide);
    const dialog = $("reset-dialog");
    if (dialog?.open) dialog.close();
    celebrations.destroy(); celebrationLayer.remove(); root.remove();
  };
  }
  await load();
  return () => { cancelled = true; dispose(); };
}
