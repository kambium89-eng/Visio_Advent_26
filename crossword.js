function createChristmasCrossword(host) {
        'use strict';
        const root = document.createElement('section');
        root.id = 'christmas-crossword';
        root.innerHTML = "<div class=\"cw-shell\">\n      <section class=\"cw-board-card\" aria-label=\"Kreuzworträtsel\">\n        <p id=\"cw-keyboard-help\" class=\"cw-sr-only\">Die Zahlen öffnen die Hinweise. Pfeiltasten bewegen die Auswahl. Enter oder erneutes Antippen eines Kreuzungsfelds wechselt die Richtung. Ä als AE, Ö als OE und Ü als UE eingeben.</p>\n        <div id=\"cw-grid\" class=\"cw-grid\" role=\"group\" aria-label=\"Kreuzworträtsel, 12 Spalten und 10 Zeilen\" aria-describedby=\"cw-keyboard-help\"></div>\n        <div class=\"cw-toolbar\">\n          <button id=\"cw-check\" class=\"cw-button cw-button-primary\" type=\"button\">Prüfen</button>\n          <button id=\"cw-reveal\" class=\"cw-button\" type=\"button\">\n            <svg viewBox=\"0 0 20 20\" fill=\"none\" aria-hidden=\"true\"><path d=\"M7.5 14h5M8 17h4M6.5 11.5a5 5 0 1 1 7 0c-.8.7-1 1.2-1 2.5h-5c0-1.3-.2-1.8-1-2.5Z\" stroke=\"currentColor\" stroke-width=\"1.3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>\n            Buchstabe aufdecken <span id=\"cw-reveal-count\" class=\"cw-reveal-count\" aria-hidden=\"true\"></span>\n          </button>\n          <button id=\"cw-reset\" class=\"cw-button cw-reset\" type=\"button\" aria-label=\"Neu beginnen\" title=\"Neu beginnen\" aria-haspopup=\"dialog\">\n            <svg viewBox=\"0 0 20 20\" fill=\"none\" aria-hidden=\"true\"><path d=\"M4 7a6 6 0 1 1-.1 6M4 3v4h4\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>\n          </button>\n        </div>\n        <p id=\"cw-message\" class=\"cw-message\" role=\"status\" aria-live=\"polite\" aria-atomic=\"true\"></p>\n      </section>\n      <dialog id=\"cw-clue-dialog\" class=\"cw-dialog\" aria-labelledby=\"cw-dialog-title\" aria-describedby=\"cw-dialog-clue\">\n        <button id=\"cw-dialog-close\" class=\"cw-dialog-close\" type=\"button\" aria-label=\"Hinweis schliessen\">×</button>\n        <h2 id=\"cw-dialog-title\"></h2>\n        <div id=\"cw-dialog-directions\" class=\"cw-dialog-directions\" role=\"group\" aria-label=\"Richtung wählen\" hidden></div>\n        <p id=\"cw-dialog-clue\" class=\"cw-dialog-clue\"></p>\n        <p id=\"cw-dialog-length\" class=\"cw-dialog-length\"></p>\n        <div class=\"cw-dialog-actions\"><button id=\"cw-dialog-enter\" class=\"cw-button cw-button-primary\" type=\"button\" autofocus>Eintragen</button></div>\n      </dialog>\n      <dialog id=\"cw-reset-dialog\" class=\"cw-dialog\" aria-labelledby=\"cw-reset-title\">\n        <h2 id=\"cw-reset-title\">Neu beginnen?</h2>\n        <div class=\"cw-dialog-actions\">\n          <button id=\"cw-reset-no\" class=\"cw-button\" type=\"button\" autofocus>Abbrechen</button>\n          <button id=\"cw-reset-yes\" class=\"cw-button cw-button-primary\" type=\"button\">Alle Einträge löschen</button>\n        </div>\n      </dialog>\n    </div>\n    ";
        host.append(root);
        const find = id => root.querySelector('#' + id);
        const words = [{"id": "weihnachten", "answer": "WEIHNACHTEN", "row": 0, "col": 0, "direction": "across", "clue": "Fest, an dem die Geburt Jesu gefeiert wird."}, {"id": "nikolaus", "answer": "NIKOLAUS", "row": 0, "col": 10, "direction": "down", "clue": "Er hat am 6. Dezember seinen Namenstag."}, {"id": "geschenk", "answer": "GESCHENK", "row": 2, "col": 3, "direction": "across", "clue": "Eine verpackte Überraschung, die man jemandem überreicht."}, {"id": "stern", "answer": "STERN", "row": 2, "col": 5, "direction": "down", "clue": "Er zeigte den Weisen den Weg nach Bethlehem."}, {"id": "hirte", "answer": "HIRTE", "row": 3, "col": 2, "direction": "down", "clue": "Er hütet Schafe und gehört zur Weihnachtsgeschichte."}, {"id": "krippe", "answer": "KRIPPE", "row": 4, "col": 0, "direction": "across", "clue": "Darin lag das Jesuskind nach seiner Geburt."}, {"id": "kerze", "answer": "KERZE", "row": 4, "col": 0, "direction": "down", "clue": "Sie spendet Licht und wird beim Brennen immer kleiner."}, {"id": "engel", "answer": "ENGEL", "row": 5, "col": 7, "direction": "down", "clue": "Himmlischer Bote mit Flügeln."}, {"id": "tannenbaum", "answer": "TANNENBAUM", "row": 6, "col": 2, "direction": "across", "clue": "Er wird zu Weihnachten mit Kugeln und Lichtern geschmückt."}, {"id": "advent", "answer": "ADVENT", "row": 8, "col": 4, "direction": "across", "clue": "So heisst die Zeit der vier Sonntage vor Weihnachten."}];
        const storageKey = 'visio-advent-2026-day-06-crossword-v1';
        const cells = new Map();
        const directions = { across: 'waagrecht', down: 'senkrecht' };
        const clueDialog = find('cw-clue-dialog');
        const resetDialog = find('cw-reset-dialog');
        let activeWord = words[0];
        let activeKey = '0,0';
        let isComplete = false;
        let readyToCelebrate = false, hasCelebrated = false, celebrationLayer, celebrationTimer;
        const keyFor = (row, col) => row + ',' + col;
        const normalise = value => value.toUpperCase().replace(/Ä/g, 'AE').replace(/Ö/g, 'OE').replace(/Ü/g, 'UE').replace(/ẞ|ß/g, 'SS').replace(/[^A-Z]/g, '');
        const revealLimit = word => Math.max(1, Math.min(3, Math.round(word.answer.length / 4)));
        const revealCount = word => word.keys.filter(key => cells.get(key).revealed).length;

        let nextNumber = 0;
        const startNumbers = new Map();
        for (const word of words) {
          const start = keyFor(word.row, word.col);
          if (!startNumbers.has(start)) startNumbers.set(start, ++nextNumber);
          word.number = startNumbers.get(start);
          word.keys = [];
          for (let i = 0; i < word.answer.length; i++) {
            const row = word.row + (word.direction === 'down' ? i : 0);
            const col = word.col + (word.direction === 'across' ? i : 0);
            const key = keyFor(row, col);
            word.keys.push(key);
            if (!cells.has(key)) cells.set(key, { row, col, answer: word.answer[i], words: [], value: '', revealed: false, checked: false });
            const cell = cells.get(key);
            if (cell.answer !== word.answer[i]) throw new Error('Conflicting crossword letters at ' + key);
            cell.words.push(word);
          }
        }

        function canReveal(key) {
          const cell = cells.get(key);
          if (cell.revealed || cell.value === cell.answer) return false;
          return cell.words.every(word => {
            if (revealCount(word) >= revealLimit(word)) return false;
            const index = word.keys.indexOf(key);
            return [word.keys[index - 1], word.keys[index + 1]].every(neighbour => !neighbour || !cells.get(neighbour).revealed);
          });
        }

        function message(text = '', tone = '') {
          find('cw-message').textContent = text;
          find('cw-message').dataset.tone = tone;
        }

        function save() {
          try {
            const entries = {};
            for (const [key, cell] of cells) if (cell.value) entries[key] = { value: cell.value, revealed: cell.revealed };
            localStorage.setItem(storageKey, JSON.stringify({ version: 2, entries }));
          } catch (_) { /* The puzzle also works when browser storage is unavailable. */ }
        }

        try {
          const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
          if (saved && [1, 2].includes(saved.version) && saved.entries && typeof saved.entries === 'object') {
            for (const [key, entry] of Object.entries(saved.entries)) {
              const cell = cells.get(key);
              if (!cell || !entry || typeof entry.value !== 'string' || !/^[A-Z]$/.test(entry.value)) continue;
              // Also apply the current per-word limits to progress from the first prototype.
              cell.revealed = entry.revealed === true && entry.value === cell.answer && canReveal(key);
              cell.value = entry.value;
            }
          }
        } catch (_) { /* Ignore invalid or unavailable saved progress. */ }

        function updateRevealButton() {
          const used = revealCount(activeWord);
          const limit = revealLimit(activeWord);
          const button = find('cw-reveal');
          find('cw-reveal-count').textContent = used + '/' + limit;
          button.disabled = isComplete || !activeWord.keys.some(canReveal);
          button.setAttribute('aria-label', 'Buchstabe aufdecken für ' + activeWord.number + ' ' + directions[activeWord.direction] + '. ' + used + ' von ' + limit + ' Hilfsbuchstaben verwendet.');
          button.title = used >= limit ? 'Hilfe für dieses Wort aufgebraucht.' : 'Ein Hilfsbuchstabe für das ausgewählte Wort.';
        }

        function refreshCell(cell) {
          cell.input.value = cell.value;
          cell.wrapper.classList.toggle('is-word', cell.words.includes(activeWord));
          cell.wrapper.classList.toggle('is-active', keyFor(cell.row, cell.col) === activeKey);
          cell.wrapper.classList.toggle('is-revealed', cell.revealed);
          cell.wrapper.classList.toggle('is-correct', cell.checked && !!cell.value && cell.value === cell.answer);
          cell.wrapper.classList.toggle('is-wrong', cell.checked && !!cell.value && cell.value !== cell.answer);
          cell.input.setAttribute('aria-invalid', String(cell.checked && !!cell.value && cell.value !== cell.answer));
          const labelledWord = cell.words.includes(activeWord) ? activeWord : cell.words[0];
          const position = labelledWord.keys.indexOf(keyFor(cell.row, cell.col)) + 1;
          cell.input.setAttribute('aria-label', labelledWord.number + ' ' + directions[labelledWord.direction] + ', Buchstabe ' + position + ' von ' + labelledWord.answer.length + '. ' + labelledWord.clue + (cell.revealed ? ' Aufgedeckter Buchstabe.' : ''));
          cell.input.readOnly = cell.revealed;
          cell.input.tabIndex = keyFor(cell.row, cell.col) === activeKey ? 0 : -1;
        }

        function select(word, key, focus = true) {
          activeWord = word;
          activeKey = key;
          for (const cell of cells.values()) refreshCell(cell);
          updateRevealButton();
          if (focus) cells.get(key).input.focus({ preventScroll: true });
        }

        function updateDialog(word) {
          find('cw-dialog-title').textContent = word.number + ' ' + directions[word.direction];
          find('cw-dialog-clue').textContent = word.clue;
          find('cw-dialog-length').textContent = word.answer.length + ' Buchstaben';
          for (const button of find('cw-dialog-directions').children) button.setAttribute('aria-pressed', String(button.dataset.word === word.id));
        }

        function openClue(key) {
          const startingWords = words.filter(word => word.keys[0] === key);
          const word = startingWords.includes(activeWord) ? activeWord : startingWords[0];
          select(word, key, false);
          const choices = find('cw-dialog-directions');
          choices.replaceChildren();
          choices.hidden = startingWords.length < 2;
          for (const candidate of startingWords) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'cw-button';
            button.dataset.word = candidate.id;
            button.textContent = (candidate.direction === 'across' ? '→ Waagrecht' : '↓ Senkrecht');
            button.addEventListener('click', () => {
              select(candidate, key, false);
              updateDialog(candidate);
            });
            choices.append(button);
          }
          updateDialog(word);
          message();
          clueDialog.showModal();
        }

        function moveInWord(step) {
          const nextKey = activeWord.keys[activeWord.keys.indexOf(activeKey) + step];
          if (nextKey) select(activeWord, nextKey);
        }

        function advanceAfterEntry(fromKey) {
          const index = activeWord.keys.indexOf(fromKey);
          const next = activeWord.keys.slice(index + 1).find(key => !cells.get(key).revealed);
          select(activeWord, next || fromKey);
        }

        function clearCelebration() {
          clearTimeout(celebrationTimer);
          celebrationLayer?.remove();
          celebrationLayer = null;
        }

        function celebrate() {
          if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
          clearCelebration();
          const bounds = find('cw-grid').getBoundingClientRect();
          const layer = document.createElement('div');
          celebrationLayer = layer;
          layer.className = 'cw-celebration';
          layer.setAttribute('aria-hidden', 'true');
          layer.style.setProperty('--cw-magic-x', (bounds.left + bounds.width / 2) + 'px');
          layer.style.setProperty('--cw-magic-y', (bounds.top + bounds.height / 2) + 'px');
          const greeting = document.createElement('div');
          greeting.className = 'cw-magic-greeting';
          greeting.innerHTML = '<span class="cw-magic-star">✧</span><span>Frohe Weihnachten!</span>';
          layer.append(greeting);
          for (let i = 0; i < 32; i++) {
            const sparkle = document.createElement('span');
            sparkle.className = 'cw-magic-sparkle';
            sparkle.textContent = i % 4 === 0 ? '❄' : '✦';
            const angle = i * Math.PI * (3 - Math.sqrt(5));
            const distance = 95 + (i % 7) * 24;
            sparkle.style.setProperty('--cw-dx', Math.cos(angle) * distance + 'px');
            sparkle.style.setProperty('--cw-dy', Math.sin(angle) * distance - 45 + 'px');
            sparkle.style.setProperty('--cw-turn', (i % 2 ? 100 : -100) + 'deg');
            sparkle.style.setProperty('--cw-delay', (i % 8) * 45 + 'ms');
            sparkle.style.setProperty('--cw-size', (i % 4 === 0 ? 15 : 7 + i % 5 * 2) + 'px');
            layer.append(sparkle);
          }
          document.body.append(layer);
          celebrationTimer = setTimeout(clearCelebration, 4300);
        }

        function updateProgress() {
          const filled = [...cells.values()].filter(cell => cell.value).length;
          find('cw-grid').setAttribute('aria-label', 'Kreuzworträtsel, 12 Spalten und 10 Zeilen. ' + filled + ' von ' + cells.size + ' Feldern ausgefüllt.');
          const complete = [...cells.values()].every(cell => cell.value === cell.answer);
          if (complete && !isComplete) {
            message('Geschafft! Frohe Weihnachten! ✧', 'success');
            if (readyToCelebrate && !hasCelebrated) {
              hasCelebrated = true;
              celebrate();
            }
          }
          isComplete = complete;
          updateRevealButton();
          save();
        }

        function changeValue(cell, value) {
          if (cell.revealed) return;
          cell.value = value;
          cell.checked = false;
          refreshCell(cell);
        }

        function enterText(text, startingKey) {
          const letters = normalise(text);
          if (!letters) return;
          const index = activeWord.keys.indexOf(startingKey);
          let offset = 0;
          let lastKey = startingKey;
          for (const key of activeWord.keys.slice(index)) {
            if (offset >= letters.length) break;
            const cell = cells.get(key);
            const letter = letters[offset++];
            if (!cell.revealed) changeValue(cell, letter);
            lastKey = key;
          }
          message(offset < letters.length ? 'Der Text ist länger als das Wort.' : '');
          advanceAfterEntry(lastKey);
          updateProgress();
        }

        const fragment = document.createDocumentFragment();
        for (let row = 0; row < 10; row++) {
          for (let col = 0; col < 12; col++) {
            const key = keyFor(row, col);
            const wrapper = document.createElement('div');
            const cell = cells.get(key);
            if (!cell) {
              wrapper.className = 'cw-block';
              wrapper.setAttribute('aria-hidden', 'true');
              fragment.append(wrapper);
              continue;
            }
            wrapper.className = 'cw-cell';
            if (startNumbers.has(key)) {
              const number = document.createElement('button');
              number.type = 'button';
              number.className = 'cw-cell-number';
              number.id = 'cw-number-' + startNumbers.get(key);
              number.setAttribute('aria-label', 'Hinweis ' + startNumbers.get(key) + ' öffnen');
              number.setAttribute('aria-haspopup', 'dialog');
              number.setAttribute('aria-controls', 'cw-clue-dialog');
              number.textContent = startNumbers.get(key);
              number.addEventListener('click', () => openClue(key));
              wrapper.append(number);
            }
            const input = document.createElement('input');
            input.type = 'text';
            input.id = 'cw-cell-' + row + '-' + col;
            input.autocomplete = 'off';
            input.autocapitalize = 'characters';
            input.setAttribute('autocorrect', 'off');
            input.spellcheck = false;
            input.setAttribute('inputmode', 'text');
            input.setAttribute('enterkeyhint', 'next');
            cell.input = input;
            cell.wrapper = wrapper;
            let toggleOnClick = false;
            input.addEventListener('pointerdown', () => { toggleOnClick = key === activeKey && document.activeElement === input; });
            input.addEventListener('click', () => {
              if (toggleOnClick && cell.words.length > 1) select(cell.words.find(word => word !== activeWord), key);
              else select(cell.words.includes(activeWord) ? activeWord : cell.words[0], key);
              toggleOnClick = false;
              input.select();
            });
            input.addEventListener('focus', () => {
              if (key !== activeKey) select(cell.words.includes(activeWord) ? activeWord : cell.words[0], key, false);
            });
            input.addEventListener('input', event => {
              if (event.isComposing) return;
              const value = event.data !== null && event.data !== undefined ? event.data : input.value;
              if (!value) {
                changeValue(cell, '');
                message();
                updateProgress();
              } else if (!normalise(value)) refreshCell(cell);
              else enterText(value, key);
            });
            input.addEventListener('compositionend', () => enterText(input.value, key));
            input.addEventListener('paste', event => {
              event.preventDefault();
              enterText(event.clipboardData.getData('text'), key);
            });
            input.addEventListener('keydown', event => {
              if (event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                if (cell.words.length > 1) select(cell.words.find(word => word !== activeWord), key);
                return;
              }
              if (event.key.startsWith('Arrow')) {
                event.preventDefault();
                const direction = event.key === 'ArrowLeft' || event.key === 'ArrowRight' ? 'across' : 'down';
                const word = cell.words.find(candidate => candidate.direction === direction);
                if (!word) return;
                select(word, key, false);
                moveInWord(event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1);
                return;
              }
              if (event.key === 'Backspace') {
                event.preventDefault();
                if (cell.value && !cell.revealed) changeValue(cell, '');
                else {
                  const previousKey = activeWord.keys[activeWord.keys.indexOf(key) - 1];
                  if (previousKey) {
                    select(activeWord, previousKey);
                    changeValue(cells.get(previousKey), '');
                  }
                }
                message();
                updateProgress();
                return;
              }
              if (event.key === 'Delete') {
                event.preventDefault();
                changeValue(cell, '');
                message();
                updateProgress();
              }
            });
            wrapper.append(input);
            fragment.append(wrapper);
          }
        }
        find('cw-grid').append(fragment);

        find('cw-check').addEventListener('click', () => {
          let wrong = 0;
          let empty = 0;
          for (const cell of cells.values()) {
            if (!cell.value) empty++;
            else if (cell.value !== cell.answer) wrong++;
            cell.checked = true;
            refreshCell(cell);
          }
          if (wrong) message(wrong === 1 ? 'Ein Buchstabe stimmt noch nicht.' : wrong + ' Buchstaben stimmen noch nicht.', 'error');
          else if (empty === cells.size) message('Das Rätsel ist noch leer.');
          else if (empty) message('Bisher alles richtig. Noch ' + empty + ' ' + (empty === 1 ? 'leeres Feld.' : 'leere Felder.'), 'success');
          else message('Geschafft! Frohe Weihnachten! ✧', 'success');
          updateProgress();
        });

        find('cw-reveal').addEventListener('click', () => {
          const index = activeWord.keys.indexOf(activeKey);
          const ordered = [...activeWord.keys.slice(index), ...activeWord.keys.slice(0, index)];
          const key = ordered.find(canReveal);
          if (!key) return;
          const cell = cells.get(key);
          cell.value = cell.answer;
          cell.revealed = true;
          cell.checked = false;
          select(activeWord, key, false);
          message();
          updateProgress();
        });

        find('cw-dialog-close').addEventListener('click', () => clueDialog.close());
        find('cw-dialog-enter').addEventListener('click', () => {
          const word = activeWord;
          const key = word.keys.find(candidate => !cells.get(candidate).value) || word.keys.find(candidate => !cells.get(candidate).revealed) || word.keys[0];
          clueDialog.close();
          select(word, key);
        });
        find('cw-reset').addEventListener('click', () => resetDialog.showModal());
        find('cw-reset-no').addEventListener('click', () => resetDialog.close());
        find('cw-reset-yes').addEventListener('click', () => {
          clearCelebration();
          hasCelebrated = false;
          for (const cell of cells.values()) {
            cell.value = '';
            cell.revealed = false;
            cell.checked = false;
          }
          resetDialog.close();
          message();
          select(words[0], words[0].keys[0]);
          updateProgress();
        });
        for (const dialog of [clueDialog, resetDialog]) {
          dialog.addEventListener('click', event => {
            if (event.target !== dialog) return;
            const bounds = dialog.getBoundingClientRect();
            if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
          });
        }

        select(activeWord, activeKey, false);
        updateProgress();
        readyToCelebrate = true;
        hasCelebrated = isComplete;
      return () => {
          clearCelebration();
          if (clueDialog.open) clueDialog.close();
          if (resetDialog.open) resetDialog.close();
          root.remove();
        };
      }
