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
        moment.append(
            paragraph(data.invitation, "joy-invitation"),
            paragraph(data.examples, "joy-copy"),
            paragraph(data.plan, "joy-copy")
        );

        const choices = document.createElement("fieldset");
        choices.className = "joy-choices";
        choices.setAttribute("aria-describedby", "joy-privacy");
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

        const choiceFooter = document.createElement("div");
        choiceFooter.className = "joy-choice-footer";
        const privacy = paragraph("Deine Auswahl bleibt nur auf dieser geöffneten Seite.", "joy-privacy");
        privacy.id = "joy-privacy";
        const clear = document.createElement("button");
        clear.type = "button";
        clear.className = "text-button joy-clear";
        clear.textContent = "Auswahl aufheben";
        clear.addEventListener("click", () => {
            grid.querySelectorAll("input").forEach(input => { input.checked = false; });
        });
        choiceFooter.append(privacy, clear);

        const reflection = paragraph(data.reflection, "joy-reflection");
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
        const timer = createJoyTimer({isCurrent});
        moment.append(choices, choiceFooter, timer.element, reflection, ending);
        target.replaceChildren(moment);
        return timer.dispose;
    } catch {
        if (!isCurrent()) return;
        loading.className = "form-message error";
        loading.setAttribute("role", "alert");
        loading.textContent = "Dein Adventsmoment konnte nicht geladen werden. Bitte lade die Seite nochmals.";
    }
}
