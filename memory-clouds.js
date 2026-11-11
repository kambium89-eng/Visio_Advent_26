"use strict";

// Positions refer to the square WebP copies, including their transparent margins.
const CHIMNEY_ANCHORS = [
    [.66,.07],[.63,.06],[.74,.07],[.79,.08],[.77,.19],[.65,.11],
    [.74,.15],[.63,.11],[.38,.10],[.43,.22],[.79,.21],[.41,.07],
    [.67,.18],[.67,.10],[.28,.08],[.77,.16],[.35,.10],[.86,.06],
    [.35,.18],[.35,.14],[.70,.17],[.74,.07],[.68,.20],[.25,.15]
];

class MemoryClouds {
    constructor() {
        this.houses = new Map();
        this.flights = new Set();
        this.answers = [];
        this.cursor = 0;
        this.activeDay = null;
        this.enabled = false;
        this.ready = false;
        this.motion = matchMedia("(prefers-reduced-motion: reduce)");
        this.layer = document.createElement("div");
        this.layer.className = "memory-cloud-layer";
        this.layer.hidden = true;
        this.layer.id = "memory-clouds";
        this.layer.setAttribute("role", "region");
        this.layer.setAttribute("aria-label", "Aufsteigende Stolzmomente");
        this.announcer = document.createElement("p");
        this.announcer.className = "sr-only";
        this.announcer.setAttribute("role", "status");
        document.body.append(this.layer, this.announcer);
        document.addEventListener("keydown", event => {
            if (event.key === "Escape" && this.flights.size) {
                event.preventDefault();
                this.close();
            }
        });
        window.addEventListener("resize", () => this.close());
        document.addEventListener("visibilitychange", () => {
            if (document.hidden) this.close();
        });
        this.motion.addEventListener("change", () => this.close());
    }

    beginPage(enabled) {
        this.clear();
        this.houses.clear();
        this.enabled = enabled;
        document.body.classList.toggle("memory-day", enabled);
    }

    clear() {
        this.close();
        this.answers = [];
        this.cursor = 0;
        this.ready = false;
        this.example = false;
        this.announcer.textContent = "";
        this.layer.hidden = true;
        document.body.classList.remove("memories-ready", "memories-started");
    }

    setCollection(answers, example) {
        this.clear();
        this.answers = answers.filter(answer => typeof answer === "string" && answer.trim()).map(answer => answer.trim());
        this.example = example;
        this.ready = true;
        this.layer.hidden = false;
        document.body.classList.add("memories-ready");
    }

    bind(house, marker, day) {
        this.houses.set(day, {house, marker});
        house.setAttribute("aria-controls", this.layer.id);
        for (const target of [house, marker]) {
            target.addEventListener("pointerenter", () => {
                clearTimeout(this.hoverTimer);
                this.hoverTimer = setTimeout(() => this.open(day), 280);
            });
            target.addEventListener("pointerleave", event => { clearTimeout(this.hoverTimer);this.leave(event); });
            target.addEventListener("focusin", () => { clearTimeout(this.hoverTimer);if (!this.suppressFocus) this.open(day); });
            target.addEventListener("focusout", event => this.leave(event));
            target.addEventListener("click", () => this.open(day, true));
        }
    }

    houseFor(target) {
        if (!(target instanceof Element)) return null;
        const day = Number(target.closest(".memory-house,.village-marker")?.dataset.day);
        return this.houses.has(day) ? day : null;
    }

    leave(event) {
        if (this.houseFor(event.relatedTarget) === this.activeDay) return;
        const current = this.houses.get(this.activeDay);
        if (current?.house.matches(":hover,:focus-within") || current?.marker.matches(":hover,:focus-within")) return;
        this.stopEmitter();
    }

    stopEmitter() {
        clearTimeout(this.emitTimer);
        this.activeDay = null;
        this.houses.forEach(({house, marker}) => {
            house.classList.remove("is-smoking");
            marker.classList.remove("is-smoking");
        });
    }

    open(day, advance = false) {
        if (!this.enabled || !this.ready || !this.answers.length || !this.houses.has(day) || document.body.classList.contains("is-arriving")) return;
        if (this.activeDay === day && !advance) return;
        // A click also focuses its house; that single gesture should release one cloud.
        if (this.activeDay === day && advance && performance.now() - this.lastEmission < 350) return;
        this.stopEmitter();
        this.activeDay = day;
        const {house, marker} = this.houses.get(day);
        house.classList.add("is-smoking");
        marker.classList.add("is-smoking");
        document.body.classList.add("memories-started");
        this.emit(day);
        this.schedule(day);
    }

    schedule(day) {
        // Reduced-motion users advance with a click or Enter instead of a timer.
        if (this.motion.matches || this.answers.length < 2) return;
        clearTimeout(this.emitTimer);
        this.emitTimer = setTimeout(() => {
            if (this.activeDay !== day) return;
            this.emit(day);
            this.schedule(day);
        }, 7200);
    }

    emit(day) {
        if (!this.ready || !this.answers.length) return null;
        if (this.motion.matches) {
            for (const flight of [...this.flights]) this.remove(flight);
        } else if (this.flights.size >= 6) {
            // Rapidly crossing the village must not leave an unbounded animation queue.
            const oldest = [...this.flights].find(flight => !flight.paused);
            if (!oldest) return null;
            this.remove(oldest);
        }
        const answer = this.answers[this.cursor];
        this.lastEmission = performance.now();
        // One shared queue: every chimney can reveal the entire collection, of any size.
        this.cursor = (this.cursor + 1) % this.answers.length;
        const {house} = this.houses.get(day);
        const cloud = document.createElement("section");
        cloud.className = "memory-cloud";
        cloud.setAttribute("aria-label", "Ein Stolzmoment aus unserem Dorf");
        cloud.innerHTML = '<svg class="memory-cloud-shape" viewBox="0 0 360 230" preserveAspectRatio="none" aria-hidden="true"><path d="M55 185C24 187 4 165 13 139C-7 119 0 86 29 76C23 46 49 24 78 32C91 1 131 0 153 21C181-5 222 3 237 31C270 15 305 33 307 63C341 59 364 86 352 114C376 143 357 180 326 183C320 216 280 229 253 210C230 235 192 234 171 214C143 237 105 229 94 207C76 213 56 203 55 185Z"/></svg><button class="memory-cloud-close" type="button" aria-label="Wolke schliessen">×</button><p class="memory-cloud-label"></p><p class="memory-cloud-text"></p>';
        cloud.querySelector(".memory-cloud-label").textContent = this.example ? "Beispiel · frei erfunden" : "Ein Stolzmoment aus unserem Team";
        // Answers are always plain text, never HTML.
        cloud.querySelector(".memory-cloud-text").textContent = answer;
        const flight = {cloud, house, animation:null, paused:false};
        this.flights.add(flight);
        this.layer.append(cloud);
        cloud.querySelector(".memory-cloud-close").addEventListener("click", () => this.remove(flight, true));
        const pause = () => {
            clearTimeout(this.hoverTimer);
            this.stopEmitter();
            flight.paused = true;
            // Keyboard focus can reach a new cloud while it is still a tiny puff.
            if (flight.animation && Number(flight.animation.currentTime) < flight.readAt) flight.animation.currentTime = flight.readAt;
            flight.animation?.pause();
        };
        const resume = () => {
            if (cloud.matches(":hover,:focus-within")) return;
            flight.paused = false;
            flight.animation?.play();
        };
        cloud.addEventListener("pointerenter", pause);
        cloud.addEventListener("pointerleave", resume);
        cloud.addEventListener("focusin", pause);
        cloud.addEventListener("focusout", () => queueMicrotask(resume));
        const rect = house.querySelector("img").getBoundingClientRect();
        const [anchorX, anchorY] = CHIMNEY_ANCHORS[day - 1];
        const x = rect.left + rect.width * anchorX;
        const y = rect.top + rect.height * anchorY;
        const width = Math.min(370, innerWidth - 48);
        const left = Math.max(24, Math.min(x - width / 2, innerWidth - width - 24));
        cloud.style.width = `${width}px`;
        cloud.style.left = `${left}px`;
        const height = cloud.getBoundingClientRect().height;
        cloud.style.top = `${Math.max(20, y - height)}px`;
        cloud.style.transformOrigin = `${x - left}px 100%`;
        if (!this.motion.matches) {
            this.emitSmoke(x, y);
            const drift = Math.max(24 - left, Math.min(day % 2 ? 32 : -32, innerWidth - width - 24 - left));
            const duration = Math.min(34000, Math.max(22000, answer.length * 75));
            flight.readAt = duration * .13;
            flight.animation = cloud.animate([
                {transform:"translate(0,0) scale(.06)",opacity:0,offset:0},
                {transform:`translate(${drift * .1}px,-46px) scale(1)`,opacity:1,offset:.13},
                {transform:`translate(${drift * .6}px,${-(y + 40) * .65}px) scale(1)`,opacity:1,offset:.65},
                {transform:`translate(${drift}px,${-(y + 40)}px) scale(1)`,opacity:1,offset:1}
            ], {duration,easing:"linear",fill:"forwards"});
            flight.animation.finished.then(() => this.remove(flight)).catch(() => {});
        }
        this.announcer.textContent = `${this.example ? "Erfundenes Beispiel. " : ""}${answer}`;
        return flight;
    }

    emitSmoke(x, y) {
        for (let index = 0; index < 4; index++) {
            const puff = document.createElement("i");
            puff.className = "memory-puff";
            puff.style.cssText = `left:${x}px;top:${y}px;width:${10 + index * 8}px;height:${9 + index * 7}px`;
            this.layer.append(puff);
            const animation = puff.animate([
                {transform:"translate(-50%,-50%) scale(.3)",opacity:0},
                {opacity:.8,offset:.2},
                {transform:`translate(-50%,${-45 - index * 18}px) scale(1.2)`,opacity:0}
            ], {duration:1700,delay:index * 170,easing:"ease-out"});
            animation.finished.then(() => puff.remove()).catch(() => {});
        }
    }

    remove(flight, returnFocus = false) {
        const focusedInside = flight.cloud.contains(document.activeElement);
        flight.animation?.cancel();
        flight.cloud.remove();
        this.flights.delete(flight);
        if (returnFocus && focusedInside) {
            this.suppressFocus = true;
            flight.house.focus({preventScroll:true});
            this.suppressFocus = false;
        }
    }

    close() {
        clearTimeout(this.hoverTimer);
        this.stopEmitter();
        for (const flight of [...this.flights]) this.remove(flight, true);
        this.layer.getAnimations({subtree:true}).forEach(animation => animation.cancel());
        this.layer.replaceChildren();
        this.announcer.textContent = "";
    }
}
