"use strict";

async function createChristmasFacts(target, {isCurrent, reducedMotion}) {
    const el = (tag, className, text) => {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    };
    const loading = el("p", "form-message", "Die Weihnachtsgeschichten werden geladen …");
    loading.setAttribute("role", "status");
    target.replaceChildren(loading);
    let payload;
    try {
        const response = await fetch("content/04-fakten.json?v=20261117");
        if (!response.ok) throw new Error("facts");
        payload = await response.json();
        if (!Array.isArray(payload.facts) || payload.facts.length !== 5) throw new Error("facts");
    } catch {
        if (!isCurrent()) return;
        const message = el("p", "form-message error", "Die Karten konnten nicht geladen werden. Bitte versuche es noch einmal.");
        message.setAttribute("role", "alert");
        const retry = el("button", "text-button", "Karten erneut laden");
        retry.type = "button";
        retry.onclick = () => { if (isCurrent()) createChristmasFacts(target, {isCurrent, reducedMotion}); };
        target.replaceChildren(message, retry);
        return;
    }
    if (!isCurrent()) return;
    const facts = payload.facts;
    const section = el("section", "facts");
    section.setAttribute("aria-label", "Fünf Weihnachtsgeschichten zum Entdecken");
    const card = el("div", "fact-card");
    card.id = "fact-card";
    const label = el("p", "fact-kicker");
    const scene = el("div", "fact-scene");
    const face = el("div", "fact-face");
    face.id = "fact-face";
    const icon = el("div", "fact-icon");
    icon.setAttribute("aria-hidden", "true");
    const title = el("h3", "fact-question");
    title.id = "fact-question";
    const answer = el("div", "reading fact-answer");
    answer.id = "fact-answer";
    const invitation = el("p", "fact-invitation", "Eine kleine Frage. Eine Geschichte zum Weitererzählen.");
    face.append(icon, title, answer, invitation);
    scene.append(face);
    const toggle = el("button", "primary-button fact-toggle");
    toggle.type = "button";
    toggle.setAttribute("aria-controls", "fact-face");
    toggle.append(el("span", "turn-symbol", "↻"), el("span", "fact-toggle-label"));
    toggle.firstElementChild.setAttribute("aria-hidden", "true");
    const actions = el("div", "fact-actions");
    actions.append(toggle);
    card.append(label, scene, actions);
    const sources = el("details", "fact-sources");
    const summary = el("summary", "", "Quellen zu dieser Geschichte");
    const sourceList = el("ol", "");
    const sourceDate = el("p", "fact-source-date", `Recherche: ${payload.researchDate}`);
    sources.append(summary, sourceList, sourceDate);
    const topics = el("div", "fact-topics");
    topics.setAttribute("role", "group");
    topics.setAttribute("aria-label", "Thema auswählen");
    const topicButtons = facts.map((fact, index) => {
        const button = el("button", "fact-topic");
        button.type = "button";
        button.setAttribute("aria-controls", "fact-card");
        button.append(el("span", "fact-topic-number", String(index + 1).padStart(2, "0")), el("span", "", fact.label));
        button.onclick = () => show(index);
        topics.append(button);
        return button;
    });
    const navigation = el("nav", "fact-navigation");
    navigation.setAttribute("aria-label", "Zwischen den Weihnachtsgeschichten wechseln");
    const previous = el("button", "text-button", "← Vorheriges Thema");
    const next = el("button", "text-button", "Nächstes Thema →");
    previous.type = next.type = "button";
    const progress = el("span", "fact-progress");
    navigation.append(previous, progress, next);
    const status = el("p", "sr-only");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    section.append(card, sources, topics, navigation, status);
    target.replaceChildren(section);

    let current = 0, showingAnswer = false, turn = 0, disposed = false;
    const drawings = {
        leaf: '<path d="M16 49C8 27 25 10 49 13c4 23-9 39-33 36Z"/><path d="m13 53 27-28M24 43l-1-12m1 12 12 1m-3-10 1-11m-1 11 10 1"/>',
        star: '<path d="m32 8 7 16 18 2-14 12 4 18-15-9-15 9 4-18L7 26l18-2Z"/><path d="M32 20v15m-7-7h14"/>',
        sun: '<path d="M9 43h46M14 51h36M20 43a12 12 0 0 1 24 0M32 11v9M10 22l7 7m30-7-7 7M5 34l8 2m46-2-8 2"/>',
        mountain: '<path d="m6 49 21-31 13 20 6-9 13 20H6Zm13-19 8 4 6-7M46 9v9m-4-5h8M10 13v7m-3-4h6"/>',
        wreath: '<path d="M18 23a21 21 0 1 0 28 0M18 23l-8 1m8-1 2 8M10 38l-6 3m9 5-5 6m15 3-1 7m15-7 3 6m8-14 7 4m-2-15 7 1M46 23l8 1m-8-1-2 8"/><path d="M25 14h14v22H25zM32 14c-7-5-1-10 0-12 2 3 7 7 0 12Z"/>'
    };
    function updateFace() {
        const fact = facts[current];
        card.classList.toggle("is-answer", showingAnswer);
        icon.innerHTML = `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${drawings[fact.symbol] || drawings.star}</svg>`;
        title.textContent = showingAnswer ? fact.title : fact.question;
        answer.replaceChildren(...fact.paragraphs.map(paragraph => el("p", "", paragraph)));
        answer.hidden = !showingAnswer;
        invitation.hidden = showingAnswer;
        sources.hidden = !showingAnswer;
        toggle.lastElementChild.textContent = showingAnswer ? "Frage anzeigen" : "Antwort entdecken";
        toggle.setAttribute("aria-label", `${showingAnswer ? "Frage anzeigen" : "Antwort entdecken"}: ${fact.label}`);
        label.textContent = `Entdeckung ${String(current + 1).padStart(2, "0")} / 05 · ${fact.label}`;
    }
    function show(index) {
        turn++;
        face.getAnimations().forEach(animation => animation.cancel());
        current = index;
        showingAnswer = false;
        toggle.disabled = false;
        face.removeAttribute("aria-busy");
        sources.open = false;
        sourceList.replaceChildren(...facts[current].sources.map(source => {
            const item = el("li", "");
            const link = el("a", "", source.title);
            link.href = source.url;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            item.append(link, el("span", "fact-source-note", source.note));
            return item;
        }));
        topicButtons.forEach((button, buttonIndex) => button.setAttribute("aria-pressed", String(buttonIndex === current)));
        progress.textContent = `${current + 1} von ${facts.length}`;
        updateFace();
        status.textContent = `Thema ${current + 1} von ${facts.length}: ${facts[current].question}`;
        target.closest(".day-content")?.scrollTo({top: 0, behavior: "instant"});
    }
    toggle.onclick = async () => {
        const thisTurn = ++turn;
        toggle.disabled = true;
        face.setAttribute("aria-busy", "true");
        if (!reducedMotion) {
            await face.animate([{transform: "rotateY(0deg)", opacity: 1}, {transform: "rotateY(-85deg)", opacity: 0}],
                {duration: 180, easing: "ease-in", fill: "forwards"}).finished.catch(() => {});
        }
        if (disposed || !isCurrent() || thisTurn !== turn) return;
        face.getAnimations().forEach(animation => animation.cancel());
        showingAnswer = !showingAnswer;
        sources.open = false;
        updateFace();
        target.closest(".day-content")?.scrollTo({top: 0, behavior: "instant"});
        if (!reducedMotion) {
            await face.animate([{transform: "rotateY(85deg)", opacity: 0}, {transform: "rotateY(0deg)", opacity: 1}],
                {duration: 220, easing: "ease-out"}).finished.catch(() => {});
        }
        if (disposed || !isCurrent() || thisTurn !== turn) return;
        face.removeAttribute("aria-busy");
        toggle.disabled = false;
        toggle.focus({preventScroll: true});
        status.textContent = showingAnswer ? `${facts[current].title}. Die Antwort ist aufgedeckt.` : facts[current].question;
    };
    previous.onclick = () => show((current - 1 + facts.length) % facts.length);
    next.onclick = () => show((current + 1) % facts.length);
    show(0);
    return () => { disposed = true; turn++; face.getAnimations().forEach(animation => animation.cancel()); };
}
