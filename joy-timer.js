"use strict";

function createJoyCountdown({onTick, onFinish, now = Date.now, schedule = setInterval, unschedule = clearInterval}) {
    let minutes = 5, remaining = minutes * 60000, deadline = 0;
    let status = "idle", interval = null, disposed = false;
    const stop = () => { if (interval !== null) unschedule(interval); interval = null; };
    const notify = () => onTick({minutes, remainingSeconds: Math.ceil(remaining / 1000), status});
    const sync = () => {
        if (disposed || status !== "running") return;
        remaining = Math.max(0, deadline - now());
        if (remaining === 0) {
            status = "finished";
            stop();
            notify();
            onFinish();
        } else notify();
    };
    notify();
    return {
        setMinutes(value) {
            if (disposed || !["idle", "finished"].includes(status) || !Number.isInteger(value) || value < 5 || value > 10) return false;
            minutes = value; remaining = value * 60000; status = "idle"; notify();
            return true;
        },
        start() {
            if (disposed || status === "running") return;
            if (status === "finished") remaining = minutes * 60000;
            status = "running"; deadline = now() + remaining;
            interval = schedule(sync, 250);
            sync();
        },
        pause() {
            sync();
            if (disposed || status !== "running") return;
            stop(); status = "paused"; notify();
        },
        reset() {
            if (disposed) return;
            stop(); remaining = minutes * 60000; status = "idle"; notify();
        },
        sync,
        dispose() { disposed = true; stop(); }
    };
}

function showJoyStars() {
    const layer = document.createElement("div");
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    layer.className = "joy-star-celebration" + (still ? " is-still" : "");
    layer.setAttribute("aria-hidden", "true");
    const count = still ? 16 : 94;
    const colors = ["#aa7d2b", "#d2ad58", "#c7a491", "#698369"];
    for (let i = 0; i < count; i++) {
        const star = document.createElement("span");
        const glitter = !still && i % 3 === 0;
        star.className = glitter ? "joy-glitter" : "joy-star";
        star.textContent = glitter ? "" : (i % 2 ? "✦" : "✧");
        star.style.cssText = `left:${(i * 37.7 + 7) % 100}%;top:${(i * 23.3 + 11) % 100}%;--star-size:${glitter ? 3 : 13 + i % 5 * 6}px;--star-color:${colors[i % colors.length]};--star-delay:${i % 11 * .12}s;--star-duration:${3.8 + i % 5 * .35}s;--star-drift:${(i % 7 - 3) * 19}px;--star-turn:${i % 2 ? 90 : -90}deg;`;
        layer.append(star);
    }
    document.body.append(layer);
    const timeout = setTimeout(() => layer.remove(), 7500);
    return () => { clearTimeout(timeout); layer.remove(); };
}

function createJoyTimer({isCurrent = () => true} = {}) {
    const element = document.createElement("section");
    element.className = "joy-timer";
    element.setAttribute("aria-labelledby", "joy-timer-title");
    const title = document.createElement("h3");
    title.id = "joy-timer-title";
    title.textContent = "Zeit für dich";
    const optional = document.createElement("p");
    optional.className = "joy-timer-optional";
    optional.textContent = "Wenn du magst, begleitet dich ein Timer.";

    const layout = document.createElement("div");
    layout.className = "joy-timer-layout";
    const duration = document.createElement("div");
    duration.className = "joy-duration";
    const picker = document.createElement("div");
    picker.className = "joy-duration-picker";
    picker.tabIndex = 0;
    picker.setAttribute("role", "listbox");
    picker.setAttribute("aria-label", "Timerdauer in Minuten");
    picker.setAttribute("aria-describedby", "joy-duration-help");
    const options = [];
    for (let minutes = 5; minutes <= 10; minutes++) {
        const option = document.createElement("div");
        option.id = `joy-duration-${minutes}`;
        option.className = "joy-duration-option";
        option.setAttribute("role", "option");
        option.setAttribute("aria-selected", String(minutes === 5));
        option.textContent = `${minutes} Min.`;
        picker.append(option);
        options.push(option);
    }
    const help = document.createElement("p");
    help.id = "joy-duration-help";
    help.className = "joy-duration-help";
    help.textContent = "5–10 Min. · Scrollen oder Pfeiltasten";
    duration.append(picker, help);

    const clock = document.createElement("div");
    clock.className = "joy-clock";
    const display = document.createElement("output");
    display.className = "joy-countdown";
    display.setAttribute("role", "timer");
    display.setAttribute("aria-live", "off");
    const actions = document.createElement("div");
    actions.className = "joy-timer-actions";
    const start = document.createElement("button");
    start.type = "button";
    start.className = "primary-button joy-timer-start";
    const reset = document.createElement("button");
    reset.type = "button";
    reset.className = "text-button";
    reset.textContent = "Zurücksetzen";
    actions.append(start, reset);
    clock.append(display, actions);
    layout.append(duration, clock);
    const message = document.createElement("p");
    message.className = "joy-timer-message";
    message.setAttribute("role", "status");
    element.append(title, optional, layout, message);

    let state, clearStars = () => {};
    const countdown = createJoyCountdown({
        onTick(next) {
            state = next;
            const minutes = Math.floor(next.remainingSeconds / 60);
            const seconds = next.remainingSeconds % 60;
            display.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
            display.setAttribute("aria-label", `Verbleibende Zeit: ${minutes} Minuten und ${seconds} Sekunden`);
            const locked = ["running", "paused"].includes(next.status);
            picker.setAttribute("aria-disabled", String(locked));
            picker.tabIndex = locked ? -1 : 0;
            duration.classList.toggle("is-locked", locked);
            for (let i = 0; i < options.length; i++) options[i].setAttribute("aria-selected", String(i + 5 === next.minutes));
            picker.setAttribute("aria-activedescendant", `joy-duration-${next.minutes}`);
            start.textContent = {idle:"Timer starten", running:"Pause", paused:"Fortsetzen", finished:"Noch einmal starten"}[next.status];
            reset.disabled = next.status === "idle";
            const text = {idle:"Starte, wenn es für dich passt.", running:"Dein Moment läuft. Lass dir Zeit.", paused:"Pausiert – du kannst gleich weitermachen.", finished:"Deine Zeit für Freude ist um."}[next.status];
            if (message.textContent !== text) message.textContent = text;
            element.classList.toggle("is-finished", next.status === "finished");
        },
        onFinish() {
            if (!isCurrent()) return;
            clearStars();
            clearStars = showJoyStars();
        }
    });
    const choose = (minutes, align = true) => {
        if (!countdown.setMinutes(minutes)) return;
        clearStars();
        if (align) picker.scrollTop = (minutes - 5) * 44;
    };
    picker.addEventListener("scroll", () => {
        const minutes = 5 + Math.min(5, Math.max(0, Math.round(picker.scrollTop / 44)));
        if (minutes !== state.minutes) choose(minutes, false);
    });
    options.forEach((option, index) => option.addEventListener("click", () => choose(index + 5)));
    picker.addEventListener("keydown", event => {
        const changes = {ArrowUp: -1, ArrowDown: 1, ArrowLeft: -1, ArrowRight: 1};
        if (!(event.key in changes) && !["Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const minutes = event.key === "Home" ? 5 : event.key === "End" ? 10 : Math.min(10, Math.max(5, state.minutes + changes[event.key]));
        choose(minutes);
    });
    start.addEventListener("click", () => {
        if (state.status === "running") countdown.pause();
        else { clearStars(); countdown.start(); }
    });
    reset.addEventListener("click", () => { clearStars(); countdown.reset(); });
    const onVisible = () => { if (!document.hidden) countdown.sync(); };
    document.addEventListener("visibilitychange", onVisible);
    return {
        element,
        dispose() {
            countdown.dispose();
            clearStars();
            document.removeEventListener("visibilitychange", onVisible);
        }
    };
}
