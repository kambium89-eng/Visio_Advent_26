"use strict";
(() => {
  const messages = {
    stars: { title: "Weihnachtszauber entdeckt!", text: "Der Film ist gefunden. Jetzt darf es ein bisschen funkeln.", duration: 3800 },
    sleigh: { title: "Filmkenner an Bord!", text: "Mit wenigen Anläufen gelöst – Santa dreht für dich eine Ehrenrunde.", duration: 5100 },
    house: { title: "Ein kleiner Freudentanz!", text: "Gut kombiniert! Unser Häuschen feiert deinen Filmtreffer.", duration: 6200 }
  };
  window.PuzzleCelebrations = {
    create(root, home, options = {}) {
      const preference = matchMedia("(prefers-reduced-motion: reduce)");
      const reduced = () => preference.matches || Boolean(options.reduced?.());
      let queue = [], running = false, generation = 0, finishActive = null, holdActive = null;
      root.hidden = true;

      function motion(element, frames, settings, animations) {
        const animation = element.animate(frames, { fill: "both", ...settings });
        animations.push(animation);
        return animation;
      }
      function stars(animations, duration, count = 54) {
        const halo = document.createElement("div"); halo.className = "star-halo"; root.append(halo);
        motion(halo, [{ opacity: 0, transform: "scale(.6)" }, { opacity: .8, offset: .3 }, { opacity: 0, transform: "scale(1.4)" }], { duration }, animations);
        for (let i = 0; i < count; i++) {
          const star = document.createElement("span"); star.className = "glitter-star"; star.textContent = i % 4 === 0 ? "✧" : "✦";
          star.setAttribute("aria-hidden", "true");
          const x = 5 + Math.random() * 90, y = 12 + Math.random() * 72;
          star.style.left = `${x}%`; star.style.top = `${y}%`;
          star.style.fontSize = `${12 + Math.random() * 27}px`;
          star.style.color = ["#d9b957", "#b9933f", "#fff2b8", "#e8d49c"][i % 4];
          root.append(star);
          motion(star, [
            { opacity: 0, transform: "translateY(12px) scale(.1) rotate(-30deg)" },
            { opacity: .95, transform: "translateY(-3px) scale(1.15) rotate(0deg)", offset: .28 },
            { opacity: .7, transform: "translateY(-12px) scale(.85) rotate(12deg)", offset: .65 },
            { opacity: 0, transform: "translateY(-35px) scale(.1) rotate(35deg)" }
          ], { duration: duration - 1000, delay: Math.random() * 850, easing: "ease-in-out" }, animations);
        }
      }
      function sleigh(animations, duration) {
        const wash = document.createElement("div"); wash.className = "sleigh-wash"; root.append(wash);
        motion(wash, [{ opacity: 0 }, { opacity: .7, offset: .2 }, { opacity: .7, offset: .75 }, { opacity: 0 }], { duration }, animations);
        const flight = document.createElement("img"); flight.className = "santa-flight"; flight.src = "assets/quiz/santas-sleigh.png"; flight.alt = "";
        const size = Math.min(650, Math.max(300, innerWidth * .67), innerHeight * .45 * (1033 / 500));
        flight.style.width = `${size}px`; root.append(flight);
        motion(flight, [
          { transform: `translate3d(${-size - 20}px,${innerHeight * .61}px,0) rotate(-8deg)` },
          { transform: `translate3d(${innerWidth * .08}px,${innerHeight * .45}px,0) rotate(-5deg)`, offset: .35 },
          { transform: `translate3d(${innerWidth * .5}px,${innerHeight * .40}px,0) rotate(4deg)`, offset: .65 },
          { transform: `translate3d(${innerWidth + 30}px,${innerHeight * .32}px,0) rotate(-5deg)` }
        ], { duration: duration - 200, easing: "cubic-bezier(.25,.35,.6,.7)" }, animations);
        for (let i = 0; i < 24; i++) {
          const star = document.createElement("span"); star.className = "sleigh-trail"; star.textContent = "✧";
          star.style.left = `${4 + i * 4}%`; star.style.top = `${58 - i * 1.2}%`; root.append(star);
          motion(star, [{ opacity: 0, transform: "scale(.3)" }, { opacity: .9, transform: "scale(1)", offset: .25 }, { opacity: 0, transform: "translateY(35px) scale(.3)" }], { duration: 1500, delay: 900 + i * 95 }, animations);
        }
      }
      function house(animations, duration) {
        stars(animations, duration, 30);
        const rect = home.getBoundingClientRect();
        const flying = document.createElement("img"); flying.src = home.src; flying.className = "flying-house"; flying.alt = "";
        flying.style.width = `${rect.width}px`; flying.style.height = `${rect.height}px`;
        root.append(flying); home.classList.add("film-quiz-house-away");
        const frame = (x, y, turn = 0, sx = 1, sy = sx) => ({ transform: `translate3d(${x}px,${y}px,0) rotate(${turn}deg) scale(${sx},${sy})` });
        const position = (fx, fy, turn, scale) => frame(Math.max(12, Math.min(innerWidth - rect.width * scale - 12, innerWidth * fx)), Math.max(12, Math.min(innerHeight - rect.height * scale - 12, innerHeight * fy)), turn, scale);
        motion(flying, [
          { ...frame(rect.x, rect.y), offset: 0 },
          { ...frame(rect.x, rect.y + 8, 0, 1.15, .82), offset: .08 },
          { ...position(.13, .40, -17, 1.6), offset: .25 },
          { ...position(.68, .15, 18, 1.95), offset: .44 },
          { ...position(.72, .55, -12, 1.5), offset: .60 },
          { ...position(.19, .30, 12, 1.7), offset: .74 },
          { ...frame(rect.x, rect.y - 45, -3), offset: .88 },
          { ...frame(rect.x, rect.y + 5, 0, 1.12, .86), offset: .93 },
          { ...frame(rect.x, rect.y - 14, 0, .97, 1.04), offset: .97 },
          { ...frame(rect.x, rect.y), offset: 1 }
        ], { duration: duration - 200, easing: "ease-in-out" }, animations);
      }
      function play(key) {
        return new Promise(resolve => {
          const message = messages[key], animations = [], isReduced = reduced();
          const duration = isReduced ? 2600 : message.duration;
          root.replaceChildren(); root.hidden = false; root.dataset.effect = key; root.dataset.reduced = String(isReduced);
          const banner = document.createElement("div"); banner.className = "celebration-banner"; banner.setAttribute("role", "status"); banner.setAttribute("aria-live", "polite");
          const title = document.createElement("h2"); title.textContent = message.title;
          const text = document.createElement("p"); text.textContent = message.text;
          const dismiss = document.createElement("button"); dismiss.type = "button"; dismiss.className = "celebration-dismiss"; dismiss.textContent = "Weiter"; dismiss.setAttribute("aria-label", "Animation beenden und weiterspielen");
          banner.append(title, text, dismiss); root.append(banner);
          let ended = false, timer;
          const finish = () => {
            if (ended) return; ended = true; clearTimeout(timer);
            animations.forEach(animation => animation.cancel());
            home.classList.remove("film-quiz-house-away"); root.replaceChildren(); root.hidden = true;
            delete root.dataset.effect; delete root.dataset.reduced;
            finishActive = null; holdActive = null; resolve();
          };
          finishActive = finish; dismiss.addEventListener("click", finish);
          if (!isReduced) {
            motion(banner, [{ opacity: 0, transform: "translateY(-18px) scale(.97)" }, { opacity: 1, transform: "translateY(0) scale(1)", offset: .13 }, { opacity: 1, offset: .90 }, { opacity: 0 }], { duration, easing: "ease-out" }, animations);
            if (key === "stars") stars(animations, duration);
            if (key === "sleigh") sleigh(animations, duration);
            if (key === "house") house(animations, duration);
          }
          timer = setTimeout(finish, duration);
          holdActive = fraction => {
            clearTimeout(timer);
            animations.forEach(animation => { animation.pause(); animation.currentTime = duration * Math.min(.95, Math.max(.05, fraction)); });
          };
        });
      }
      async function drain() {
        if (running || !queue.length) return;
        running = true; const epoch = generation;
        await play(queue.shift());
        if (epoch !== generation) return;
        running = false; drain();
      }
      const cancel = () => { generation++; queue = []; finishActive?.(); running = false; };
      const onKey = event => { if (event.key === "Escape") finishActive?.(); };
      const onPreference = () => { if (preference.matches) finishActive?.(); };
      document.addEventListener("keydown", onKey);
      preference.addEventListener("change", onPreference);
      return {
        enqueue(keys) { queue.push(...keys.filter(key => Object.hasOwn(messages, key))); drain(); },
        holdAt(fraction) { holdActive?.(fraction); },
        cancel,
        destroy() { cancel(); document.removeEventListener("keydown", onKey); preference.removeEventListener("change", onPreference); }
      };
    }
  };
})();
