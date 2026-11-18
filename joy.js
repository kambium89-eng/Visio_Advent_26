"use strict";

async function createJoyMoment(target, {isCurrent = () => true} = {}) {
    const loading = document.createElement("p");
    loading.className = "form-message";
    loading.setAttribute("role", "status");
    loading.textContent = "Dein Adventsmoment wird geladen …";
    target.replaceChildren(loading);

    try {
        const response = await fetch("content/17-freude.json", {cache: "no-cache"});
        if (!response.ok) throw new Error("joy content");
        const data = await response.json();
        if (!isCurrent()) return;

        const moment = document.createElement("div");
        moment.className = "joy-moment";
        const paragraph = (text, className) => {
            const element = document.createElement("p");
            element.className = className;
            element.textContent = text;
            return element;
        };
        const choices = document.createElement("fieldset");
        choices.className = "joy-choices";
        const legend = document.createElement("legend");
        legend.textContent = "Worauf hast du Lust?";
        const optional = document.createElement("span");
        optional.textContent = " (freiwillig)";
        legend.append(optional);
        const grid = document.createElement("div");
        grid.className = "joy-options";
        for (const [index, text] of data.choices.entries()) {
            const label = document.createElement("label");
            label.className = "joy-choice";
            const input = document.createElement("input");
            input.type = "radio";
            input.name = "joy-choice";
            input.value = String(index);
            input.autocomplete = "off";
            const caption = document.createElement("span");
            caption.textContent = text;
            label.append(input, caption);
            grid.append(label);
        }
        choices.append(legend, grid);

        const reflection = paragraph(data.reflection, "joy-reflection");
        reflection.tabIndex = -1;
        const ending = document.createElement("div");
        ending.className = "joy-ending";
        const confirm = document.createElement("button");
        confirm.type = "button";
        confirm.className = "primary-button joy-confirm";
        confirm.textContent = "Ich habe mir einen Moment genommen";
        confirm.setAttribute("aria-controls", "joy-closing");
        confirm.setAttribute("aria-expanded", "false");
        const closing = paragraph("", "joy-closing");
        closing.id = "joy-closing";
        closing.setAttribute("role", "status");
        closing.setAttribute("aria-live", "polite");
        confirm.addEventListener("click", () => {
            closing.textContent = data.closing;
            confirm.setAttribute("aria-expanded", "true");
        });
        ending.append(confirm, closing);
        const finish = document.createElement("div");
        finish.className = "joy-finish";
        finish.append(reflection, ending);
        const showFocused = (phase, element, focus) => {
            if (!isCurrent()) return;
            document.body.classList.add("joy-focus");
            target.dataset.joyPhase = phase;
            target.replaceChildren(element);
            target.closest(".day-content").scrollTop = 0;
            focus.focus({preventScroll: true});
        };
        const timer = createJoyTimer({
            isCurrent,
            onStart() { showFocused("countdown", timer.display, timer.display); },
            onFinish() { showFocused("reflection", finish, reflection); }
        });
        moment.append(choices, timer.element);
        target.replaceChildren(moment);
        return () => {
            timer.dispose();
            document.body.classList.remove("joy-focus");
            delete target.dataset.joyPhase;
        };
    } catch {
        if (!isCurrent()) return;
        loading.className = "form-message error";
        loading.setAttribute("role", "alert");
        loading.textContent = "Dein Adventsmoment konnte nicht geladen werden. Bitte lade die Seite nochmals.";
    }
}
