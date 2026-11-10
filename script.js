const door = document.getElementById("door-container");
const pastDays = document.getElementById("past-days");
const pastDayButtons = document.getElementById("past-day-buttons");
const dayButtons = [];
const dayTitle = document.getElementById("day-title");
const storyContainer = document.getElementById("story-container");
const storyCard = document.getElementById("story-card");
const storyContent = document.getElementById("story-content");
const explanationToggle = document.getElementById("explanation-toggle");
const explanationContent = document.getElementById("explanation-content");
const videoContainer = document.getElementById("video-container");
const video = document.getElementById("christmas-video");
const imageContainer = document.getElementById("image-container");
const pendingContainer = document.getElementById("pending-container");
const lockedContainer = document.getElementById("locked-container");
const lockedMessage = document.getElementById("locked-message");
const dayContentIds = { 5: "story-container", 6: "video-container", 7: "image-container" };

// Für diesen Test gilt der 7. Dezember. Später auf null setzen, um das echte Datum zu verwenden.
const TEST_DATE = "2026-12-07";
function dateInZurich() {
    const parts = new Intl.DateTimeFormat("en", {
        timeZone: "Europe/Zurich", year: "numeric", month: "2-digit", day: "2-digit"
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
}
const calendarDate = TEST_DATE || dateInZurich();
const currentDay = calendarDate < "2026-12-01" ? "1" : calendarDate > "2026-12-24" ? "24" : String(Number(calendarDate.slice(8)));

let selectedDay = currentDay;
let storyLoaded = false;
let showingExplanation = false;
let storyTurning = false;

function dayFromUrl() {
    const day = Number(new URLSearchParams(window.location.search).get("tag"));
    return Number.isInteger(day) && day >= 1 && day <= 24 ? String(day) : currentDay;
}

function releaseDate(day) {
    return `2026-12-${String(day).padStart(2, "0")}`;
}

function selectDay(day, updateUrl = true) {
    selectedDay = day;
    door.classList.remove("opening");
    const isFutureDay = releaseDate(day) > calendarDate;
    door.hidden = isFutureDay;
    storyContainer.hidden = true;
    videoContainer.hidden = true;
    imageContainer.hidden = true;
    pendingContainer.hidden = true;
    lockedContainer.hidden = !isFutureDay;
    lockedMessage.textContent = `Dieses Türchen öffnet sich am ${day}. Dezember.`;
    video.removeAttribute("src");

    dayTitle.textContent = day === "6" ? "6. Dezember – Samichlaus" : `${day}. Dezember`;
    door.setAttribute("aria-label", `Tür für den ${day}. Dezember öffnen`);
    door.setAttribute("aria-expanded", "false");
    door.setAttribute("aria-controls", dayContentIds[day] || "pending-container");

    storyCard.classList.remove("turning-out", "turning-in");
    storyCard.removeAttribute("aria-busy");
    storyTurning = false;
    showingExplanation = false;
    storyContent.hidden = false;
    explanationContent.hidden = true;
    explanationToggle.disabled = false;
    explanationToggle.setAttribute("aria-controls", "explanation-content");
    explanationToggle.textContent = "Erklärung anzeigen";

    dayButtons.forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.day === day));
    });

    if (updateUrl) {
        const url = new URL(window.location.href);
        url.searchParams.set("tag", day);
        window.history.pushState(null, "", url);
    }
    window.scrollTo(0, 0);
}

function createPastDayButtons() {
    Object.keys(dayContentIds).map(Number).sort((a, b) => a - b).forEach((day) => {
        if (releaseDate(day) >= calendarDate) {
            return;
        }
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.day = String(day);
        button.textContent = `${day}.`;
        button.setAttribute("aria-label", `${day}. Dezember öffnen`);
        button.addEventListener("click", () => {
            if (button.dataset.day !== selectedDay) {
                selectDay(button.dataset.day);
            }
        });
        dayButtons.push(button);
        pastDayButtons.append(button);
    });
    pastDays.hidden = dayButtons.length === 0;
}

function openDoor() {
    if (!door.hidden && !door.classList.contains("opening")) {
        door.classList.add("opening");
    }
}

door.addEventListener("click", openDoor);
door.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openDoor();
    }
});

async function loadStory() {
    if (storyLoaded) {
        return;
    }

    try {
        const responses = await Promise.all([
            fetch("content/05-dezember.md"),
            fetch("content/05-dezember-erklaerung.md")
        ]);

        if (responses.some((response) => !response.ok)) {
            throw new Error("Markdown konnte nicht geladen werden.");
        }

        const [story, explanation] = await Promise.all(responses.map((response) => response.text()));
        // Die Markdown-Dateien sind Inhalte aus dem eigenen Projekt.
        storyContent.innerHTML = marked.parse(story);
        explanationContent.innerHTML = marked.parse(explanation);
        explanationToggle.hidden = false;
        storyLoaded = true;
    } catch (error) {
        storyContent.textContent = "Die Geschichte konnte nicht geladen werden. Bitte lade die Seite erneut.";
    }
}

// Erst nach dem vollständigen Zoom den Inhalt des ausgewählten Tages zeigen.
door.addEventListener("animationend", (event) => {
    if (event.target !== door || event.animationName !== "zoomThrough") {
        return;
    }

    door.hidden = true;
    door.setAttribute("aria-expanded", "true");

    if (selectedDay === "5") {
        storyContainer.hidden = false;
        loadStory();
    } else if (selectedDay === "6") {
        videoContainer.hidden = false;
        video.src = video.dataset.src;
    } else if (selectedDay === "7") {
        imageContainer.hidden = false;
    } else {
        pendingContainer.hidden = false;
    }
});

explanationToggle.addEventListener("click", () => {
    if (storyTurning) {
        return;
    }

    storyTurning = true;
    explanationToggle.disabled = true;
    storyCard.setAttribute("aria-busy", "true");
    storyCard.classList.add("turning-out");
});

// Am unsichtbaren Wendepunkt den Text austauschen und zurückdrehen.
storyCard.addEventListener("animationend", (event) => {
    if (event.target !== storyCard || !storyTurning) {
        return;
    }

    if (event.animationName === "storyTurnOut") {
        showingExplanation = !showingExplanation;
        storyContent.hidden = showingExplanation;
        explanationContent.hidden = !showingExplanation;
        explanationToggle.textContent = showingExplanation ? "Geschichte anzeigen" : "Erklärung anzeigen";
        explanationToggle.setAttribute("aria-controls", showingExplanation ? "story-content" : "explanation-content");
        storyCard.classList.remove("turning-out");
        storyCard.classList.add("turning-in");
        storyContainer.scrollIntoView({ block: "start" });
    } else if (event.animationName === "storyTurnIn") {
        storyCard.classList.remove("turning-in");
        storyCard.removeAttribute("aria-busy");
        storyTurning = false;
        explanationToggle.disabled = false;
    }
});

window.addEventListener("popstate", () => selectDay(dayFromUrl(), false));
createPastDayButtons();
selectDay(dayFromUrl(), false);
