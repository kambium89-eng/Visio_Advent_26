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
        this.answers = [];
        this.cursors = new Map();
        this.activeDay = null;
        this.enabled = false;
        this.ready = false;
        this.example = false;
        this.motion = matchMedia("(prefers-reduced-motion: reduce)");
        this.waiting = "Melde dich mit unserem Teamzugang an. Dann können unsere Stolzmomente aus den Kaminen aufsteigen.";
        this.layer = document.createElement("div");
        this.layer.className = "memory-cloud-layer";
        this.layer.innerHTML = '<div class="memory-puffs" aria-hidden="true"></div><section class="memory-cloud" id="memory-cloud" role="region" aria-label="Ein Stolzmoment aus unserem Dorf" hidden><button class="memory-cloud-close" type="button" aria-label="Wolke schliessen">×</button><p class="memory-cloud-label"></p><p class="memory-cloud-text" aria-live="polite" aria-atomic="true"></p><div class="memory-cloud-actions"><button class="memory-next text-button" type="button" hidden>Noch ein Gedanke <span aria-hidden="true">↻</span></button><a class="memory-day-link" hidden></a></div></section>';
        document.body.append(this.layer);
        this.cloud = this.layer.querySelector(".memory-cloud");
        this.text = this.layer.querySelector(".memory-cloud-text");
        this.label = this.layer.querySelector(".memory-cloud-label");
        this.puffs = this.layer.querySelector(".memory-puffs");
        this.next = this.layer.querySelector(".memory-next");
        this.dayLink = this.layer.querySelector(".memory-day-link");
        this.layer.querySelector(".memory-cloud-close").addEventListener("click", () => this.dismiss());
        this.next.addEventListener("click", () => this.open(this.activeDay, true));
        this.cloud.addEventListener("pointerenter", () => this.cancelClose());
        this.cloud.addEventListener("pointerleave", event => this.leave(event));
        this.cloud.addEventListener("focusin", () => this.cancelClose());
        this.cloud.addEventListener("focusout", event => this.leave(event));
        document.addEventListener("keydown", event => {
            if (event.key === "Escape" && this.activeDay !== null) {
                event.preventDefault();
                this.dismiss();
            }
        });
        window.addEventListener("resize", () => this.close(true));
    }

    beginPage(enabled) {
        this.clear();
        this.houses.clear();
        this.enabled = enabled;
        document.body.classList.toggle("memory-day", enabled);
    }

    clear() {
        this.close(true);
        this.answers = [];
        this.cursors.clear();
        this.ready = false;
        this.example = false;
        this.text.textContent = "";
        this.label.textContent = "";
        this.dayLink.removeAttribute("href");
        this.dayLink.hidden = true;
        this.waiting = "Melde dich mit unserem Teamzugang an. Dann können unsere Stolzmomente aus den Kaminen aufsteigen.";
        document.body.classList.remove("memories-ready");
    }

    setWaiting(message) {
        this.waiting = message;
    }

    setCollection(answers, example) {
        this.close(true);
        this.answers = answers.filter(answer => typeof answer === "string" && answer.trim()).map(answer => answer.trim());
        this.example = example;
        this.ready = true;
        this.cursors.clear();
        document.body.classList.add("memories-ready");
    }

    bind(house, marker, day, previousDayUrl) {
        this.houses.set(day, {house, marker, previousDayUrl});
        house.setAttribute("aria-controls", "memory-cloud");
        house.setAttribute("aria-expanded", "false");
        for (const target of [house, marker]) {
            target.addEventListener("pointerenter", () => this.open(day));
            target.addEventListener("pointerleave", event => this.leave(event));
            target.addEventListener("focusin", () => { if (!this.suppressFocus) this.open(day); });
            target.addEventListener("focusout", event => this.leave(event));
            target.addEventListener("click", () => this.open(day, true));
        }
    }

    thoughtsFor(day) {
        if (!this.answers.length) return [];
        const count = this.houses.size;
        if (this.answers.length < count) return [this.answers[(day - 1) % this.answers.length]];
        return this.answers.filter((_, index) => index % count === day - 1);
    }

    belongsToCurrent(target) {
        if (!(target instanceof Element)) return false;
        return this.cloud.contains(target) || Number(target.closest(".memory-house,.village-marker")?.dataset.day) === this.activeDay;
    }

    leave(event) {
        if (this.belongsToCurrent(event.relatedTarget)) return;
        this.cancelClose();
        this.closeTimer = setTimeout(() => {
            if (!this.belongsToCurrent(document.activeElement)) this.close();
        }, 1100);
    }

    cancelClose() {
        clearTimeout(this.closeTimer);
    }

    dismiss() {
        const house = this.houses.get(this.activeDay)?.house;
        const focusedInside = this.cloud.contains(document.activeElement);
        this.close(true);
        if (focusedInside) {
            this.suppressFocus = true;
            house?.focus({preventScroll:true});
            this.suppressFocus = false;
        }
    }

    open(day, cycle = false) {
        if (!this.enabled || !this.houses.has(day) || document.body.classList.contains("is-arriving")) return;
        this.cancelClose();
        if (this.activeDay === day && !this.cloud.hidden && !cycle) return;
        this.revision = (this.revision || 0) + 1;
        this.cloud.getAnimations().forEach(animation => animation.cancel());
        this.houses.forEach(({house, marker}, houseDay) => {
            house.classList.toggle("is-smoking", houseDay === day);
            marker.classList.toggle("is-smoking", houseDay === day);
            house.setAttribute("aria-expanded", String(houseDay === day));
        });
        const thoughts = this.thoughtsFor(day);
        let cursor = this.cursors.get(day) ?? -1;
        cursor = thoughts.length ? (cursor + 1) % thoughts.length : 0;
        this.cursors.set(day, cursor);
        this.activeDay = day;
        this.label.textContent = this.ready ? (this.example ? "Beispielgedanke · frei erfunden" : "Ein Stolzmoment aus unserem Team") : "Unser Weihnachtsdorf";
        this.text.textContent = thoughts[cursor] || (this.ready ? "Unsere Sammlung ist noch leer. Auch ein kleiner Schritt darf ein Grund sein, stolz zu sein." : this.waiting);
        this.next.hidden = thoughts.length < 2;
        const {house, previousDayUrl} = this.houses.get(day);
        this.dayLink.hidden = !previousDayUrl;
        if (previousDayUrl) {
            this.dayLink.href = previousDayUrl;
            this.dayLink.textContent = `Zum ${day}. Türchen →`;
        } else this.dayLink.removeAttribute("href");
        this.cloud.hidden = false;
        const image = house.querySelector("img");
        const rect = image.getBoundingClientRect();
        const [anchorX, anchorY] = CHIMNEY_ANCHORS[day - 1];
        const originX = rect.left + rect.width * anchorX;
        const originY = rect.top + rect.height * anchorY;
        const width = Math.min(350, innerWidth - 32);
        this.cloud.style.width = `${width}px`;
        const height = this.cloud.getBoundingClientRect().height;
        const left = Math.max(16, Math.min(originX - width / 2, innerWidth - width - 16));
        const top = Math.max(16, Math.min(originY - height - 66, innerHeight - height - 18));
        this.cloud.style.left = `${left}px`;
        this.cloud.style.top = `${top}px`;
        this.text.scrollTop = 0;
        if (!this.motion.matches) {
            this.emitSmoke(originX, originY, left + width / 2, top + height);
            this.cloud.animate([
                {transform:"translateY(25px) scale(.92)",opacity:0},
                {transform:"translateY(0) scale(1)",opacity:1}
            ], {duration:720,easing:"cubic-bezier(.2,.7,.25,1)"});
        }
    }

    emitSmoke(x, y, cloudX, cloudBottom) {
        this.puffs.replaceChildren();
        for (let index = 0; index < 4; index++) {
            const puff = document.createElement("i");
            const fraction = (index + 1) / 5;
            const travelX = (cloudX - x) * fraction;
            const travelY = Math.max(22, y - cloudBottom) * fraction + 12;
            puff.className = "memory-puff";
            puff.style.cssText = `left:${x}px;top:${y}px;width:${12 + index * 10}px;height:${10 + index * 8}px`;
            this.puffs.append(puff);
            const animation = puff.animate([
                {transform:"translate(-50%,-50%) scale(.3)",opacity:0},
                {opacity:.85,offset:.2},
                {transform:`translate(calc(-50% + ${travelX}px),calc(-50% - ${travelY}px)) scale(1.2)`,opacity:0}
            ], {duration:1350,delay:index * 100,easing:"ease-out"});
            animation.finished.then(() => puff.remove()).catch(() => {});
        }
    }

    close(immediate = false) {
        this.cancelClose();
        const revision = this.revision = (this.revision || 0) + 1;
        this.houses.forEach(({house, marker}) => {
            house.classList.remove("is-smoking");
            marker.classList.remove("is-smoking");
            house.setAttribute("aria-expanded", "false");
        });
        this.activeDay = null;
        this.puffs.replaceChildren();
        this.cloud.getAnimations().forEach(animation => animation.cancel());
        if (immediate || this.motion.matches || this.cloud.hidden) {
            this.cloud.hidden = true;
            return;
        }
        const animation = this.cloud.animate([{opacity:1,transform:"translateY(0)"},{opacity:0,transform:"translateY(-18px)"}],{duration:260,easing:"ease-in",fill:"forwards"});
        animation.finished.then(() => { if (revision === this.revision) this.cloud.hidden = true; }).catch(() => {});
    }
}
