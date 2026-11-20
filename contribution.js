const materials = "assets/tagesmaterial/";
const motion = matchMedia("(prefers-reduced-motion: reduce)");

const quotes = [
    "Möge dein Herz so hell leuchten wie die Lichter am Weihnachtsbaum.",
    "Die schönsten Geschenke sind nicht die, die man auspackt, sondern die Momente, die man im Herzen behält.",
    "Manchmal ist ein kleines Licht genug, um einen dunklen Tag heller zu machen.",
    "Weihnachten erinnert uns daran, dass Liebe, Hoffnung und Zusammenhalt die wertvollsten Geschenke sind.",
    "Schenke Zeit, teile Freude und sammle Momente, die für immer bleiben.",
    "Es sind nicht die grossen Dinge, die Weihnachten besonders machen, sondern die kleinen Augenblicke, die unser Herz berühren.",
    "Möge die Weihnachtszeit dir Ruhe schenken, dein Herz erwärmen und neue Kraft für alles Kommende geben.",
    "Vergiss nicht, wie viel du dieses Jahr geschafft hast. Sei stolz auf deinen Weg und freue dich auf alles, was noch vor dir liegt.",
    "Auch nach den dunkelsten Tagen kommt wieder Licht. Manchmal braucht es nur etwas Geduld und Vertrauen.",
    "Du musst nicht alles perfekt machen. Manchmal reicht es, dein Bestes zu geben und den Moment zu geniessen.",
    "Jeder neue Morgen ist eine neue Chance, etwas Schönes zu erleben, etwas zu verändern oder einfach glücklich zu sein.",
    "Nimm dir Zeit für die Menschen, die dir guttun, für Dinge, die dich glücklich machen, und für Momente, die dich zur Ruhe bringen.",
    "Das neue Jahr wartet nicht darauf, dass du perfekt bist. Es wartet darauf, dass du deinen Weg gehst.",
    "“Markt und Strassen stehn verlassen, still erleuchtet jedes Haus.” Joseph von Eichendorff, Weihnachten",
    "Das ist die liebe Weihnachtszeit! Theodor Storm, Weihnachtslied",
    "“Wie so weit und still die Welt! Joseph von Eichendorff, Weihnachten"
];

function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
}

function button(label, action, className = "primary-button") {
    const control = element("button", className, label);
    control.type = "button";
    control.addEventListener("click", action);
    return control;
}

function download(file, label) {
    const link = element("a", "primary-button", label);
    link.href = materials + file;
    link.download = file;
    return link;
}

function videoLink(url, label) {
    const link = element("a", "contribution-link", label);
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    return link;
}

function player(url, title) {
    const frame = element("iframe", "contribution-player");
    frame.title = title;
    frame.width = 640;
    frame.height = 360;
    frame.allowFullscreen = true;
    frame.allow = "encrypted-media; picture-in-picture; web-share";
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    frame.loading = "lazy";
    frame.src = "https://www.youtube-nocookie.com/embed/" + new URL(url).searchParams.get("v") + "?hl=de&playsinline=1";
    return frame;
}

function reading(info) {
    const section = element("section", "reading contribution-reading");
    const [heading, ...lines] = info.copy.split("\n");
    section.append(element("h3", "", heading));
    for (const line of lines.filter(Boolean)) {
        if (info.day === 18 && /^\d+\. /.test(line)) {
            section.append(element("h4", "film-heading", line));
            continue;
        }
        const url = line.match(/https:\/\/www\.youtube\.com\/watch\?v=[\w-]+/)?.[0];
        const paragraph = element("p");
        if (url) {
            const [before, after] = line.split(url);
            paragraph.append(before, videoLink(url, url), after);
        } else {
            paragraph.textContent = line;
        }
        section.append(paragraph);
        if (url && url === info.videoUrl) section.append(player(url, heading));
    }
    return section;
}

function showRecipe(parent) {
    const card = element("img", "recipe-card");
    card.src = materials + "spitzbuben.png";
    card.width = 1024;
    card.height = 1536;
    card.alt = "Spitzbuben-Rezeptkarte mit Zutaten, sechs Zubereitungsschritten und Guetzlifoto.";
    const transcript = element("div", "sr-only");
    transcript.textContent = "Zutaten: 250 g Butter, weich. 125 g Puderzucker. 1 Ei. 1 Päckchen Vanillezucker. 1 Prise Salz. 350 g Mehl. Konfitüre nach Wahl (z. B. Himbeer oder Aprikose). Etwas Puderzucker zum Bestäuben. Zubereitung: 1. Butter, Puderzucker, Vanillezucker und Salz cremig rühren. Das Ei dazugeben. 2. Mehl hinzufügen und alles zu einem glatten Teig verkneten. 3. Den Teig zugedeckt etwa eine Stunde im Kühlschrank ruhen lassen. 4. Den Teig ca. 3 mm dick auswallen und Guetzli ausstechen. Bei der Hälfte der Guetzli zusätzlich ein kleines Loch in der Mitte ausstechen. 5. Im vorgeheizten Ofen bei 180 °C Ober-/Unterhitze etwa 8–10 Minuten hell backen. 6. Die abgekühlten Guetzli ohne Loch mit Konfitüre bestreichen und die Guetzli mit Loch daraufsetzen. Zum Schluss mit Puderzucker bestäuben.";
    const actions = element("div", "contribution-actions");
    actions.append(download("spitzbuben.pdf", "PDF speichern"), button("Drucken", () => window.print()));
    parent.append(card, transcript, actions);
}

function flipVideo(parent, info) {
    const face = element("div", "video-card-face");
    face.id = "bastelkarte";
    face.append(reading(info));
    let back = false;
    let turning = false;
    const tilt = (from, to) => face.animate([
        { transform: "perspective(900px) rotateY(" + from + "deg)" },
        { transform: "perspective(900px) rotateY(" + to + "deg)" }
    ], { duration: 190, easing: "ease-in-out" }).finished.catch(() => {});
    const toggle = button("Videoanleitung", async () => {
        if (turning) return;
        turning = true;
        if (!motion.matches) await tilt(0, -88);
        if (!face.isConnected) return;
        back = !back;
        if (back) {
            face.replaceChildren(player(info.videoUrl, info.title), videoLink(info.videoUrl, "Video auf YouTube öffnen"));
        } else {
            face.replaceChildren(reading(info));
        }
        toggle.textContent = back ? "Zurück zum Text" : "Videoanleitung";
        toggle.setAttribute("aria-expanded", String(back));
        if (!motion.matches) await tilt(88, 0);
        turning = false;
    });
    toggle.setAttribute("aria-controls", face.id);
    toggle.setAttribute("aria-expanded", "false");
    const actions = element("div", "contribution-actions");
    actions.append(toggle);
    parent.append(face, actions);
}

// Both timed sequences keep the last frame available and stop when the day is left.
function sequence(parent, { frames, delay, name, signal }) {
    const stage = element("div", "sequence-stage");
    const actions = element("div", "sequence-controls");
    const position = element("span", "sequence-position");
    const previous = button("Zurück", () => step(index - 1), "text-button");
    const next = button("Weiter", () => step(index + 1), "text-button");
    const playback = button("Pause", () => {
        if (!playing && index === frames.length - 1) show(0);
        playing = !playing;
        schedule();
    }, "text-button");
    let index = 0;
    let playing = !motion.matches;
    let inView = false;
    let timeout;
    function show(i) {
        index = i;
        const current = frames[i]();
        const outgoing = stage.lastElementChild;
        stage.replaceChildren(current);
        if (!motion.matches && outgoing) {
            outgoing.setAttribute("aria-hidden", "true");
            stage.prepend(outgoing);
            outgoing.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 560 })
                .finished.then(() => outgoing.remove(), () => outgoing.remove());
            current.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 560 });
        }
        position.textContent = name + " " + (i + 1) + " von " + frames.length;
        previous.disabled = i === 0;
        next.disabled = i === frames.length - 1;
    }
    function schedule() {
        clearTimeout(timeout);
        playback.textContent = playing ? "Pause" : index === frames.length - 1 ? "Erneut starten" : "Abspielen";
        if (!playing || !inView || document.hidden || signal.aborted) return;
        timeout = setTimeout(() => {
            if (index + 1 < frames.length) show(index + 1);
            else playing = false;
            schedule();
        }, delay);
    }
    function step(i) {
        playing = false;
        show(i);
        schedule();
    }
    function pause() {
        playing = false;
        schedule();
    }
    actions.append(previous, position, next, playback);
    parent.append(stage, actions);
    show(0);
    schedule();
    const observer = new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting;
        schedule();
    }, { threshold: 0.15 });
    document.addEventListener("visibilitychange", schedule, { signal });
    motion.addEventListener("change", pause, { signal });
    signal.addEventListener("abort", () => { clearTimeout(timeout); observer.disconnect(); }, { once: true });
    return { start: () => observer.observe(stage), pause };
}

function showQuotes(parent, signal) {
    const gallery = element("section", "quote-gallery");
    gallery.setAttribute("aria-label", "Weihnachtskarten");
    const frames = quotes.map((quote, i) => () => {
        const card = element("img", "quote-card");
        card.src = materials + "zitate/" + String(i + 1).padStart(2, "0") + ".webp";
        card.width = 256;
        card.height = 384;
        card.alt = quote;
        return card;
    });
    const slides = sequence(gallery, { frames, delay: 10000, name: "Karte", signal });
    const actions = element("div", "contribution-actions");
    actions.append(download("weihnachtsgedanken.pdf", "PDF herunterladen"));
    parent.append(gallery, actions);
    return slides.start;
}

function finale(parent, info, signal) {
    const full = element("details", "complete-poem");
    const summary = element("summary", "", "Ganzes Gedicht lesen");
    const poem = element("div", "poem-lines", info.copy);
    full.append(summary, poem);
    const cinema = element("section", "poem-cinema");
    cinema.setAttribute("aria-label", "Weihnachtsgedicht");
    const sentences = info.copy.match(/[^.!?]+[.!?]+/g).map(s => s.trim());
    const frames = sentences.map(sentence => () => element("p", "poem-frame", sentence));
    const slides = sequence(cinema, { frames, delay: 5000, name: "Teil", signal });
    function adapt() {
        if (motion.matches) {
            full.open = true;
            slides.pause();
        }
        cinema.hidden = motion.matches;
        summary.hidden = motion.matches;
    }
    full.addEventListener("toggle", () => { if (full.open) slides.pause(); });
    motion.addEventListener("change", adapt, { signal });
    adapt();
    parent.append(cinema, full);
    return slides.start;
}

export function renderContribution(parent, info, signal) {
    if (info.day === 24) return finale(parent, info, signal);
    if (info.day === 16) {
        flipVideo(parent, info);
        return;
    }
    parent.append(reading(info));
    if (info.day === 8) showRecipe(parent);
    if (info.day === 22) return showQuotes(parent, signal);
    if (info.day === 21) {
        const actions = element("div", "contribution-actions");
        actions.append(download("drei-wuensche.docx", "Wunschkarte herunterladen (Word)"));
        parent.append(actions);
    }
}
