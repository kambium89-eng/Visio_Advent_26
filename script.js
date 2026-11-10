
const kalender = document.getElementById("kalender");

// Aktuelles Datum ermitteln

/* TESTMODUS
 * true  = simuliertes Datum verwenden
 * false = tatsächliches Datum verwenden
 */
const testmodus = true;

const heute = testmodus
    ? new Date(2026, 11, 10)
    : new Date();

const jahr = heute.getFullYear();
const monat = heute.getMonth() + 1;
const aktuellerTag = heute.getDate();


// Adventskalender für Dezember 2026
const adventsJahr = 2026;

for (let tag = 1; tag <= 24; tag++) {
    const tuerchen = document.createElement("button");

    tuerchen.classList.add("tuerchen");
    tuerchen.textContent = tag;

    // Prüfen, ob das Türchen freigeschaltet ist
    const freigeschaltet =
        jahr > adventsJahr ||
        (jahr === adventsJahr && monat === 12 && aktuellerTag >= tag);

    if (freigeschaltet) {
        tuerchen.classList.add("offen");
    } else {
        tuerchen.classList.add("gesperrt");
    }

    tuerchen.addEventListener("click", () => {
        if (freigeschaltet) {
            alert(`🎁 Türchen ${tag}

Hier wartet bald eine Überraschung auf dich!`);
        } else {
            alert(`🔒 Türchen ${tag} ist noch verschlossen!

Komm am ${tag}. Dezember wieder vorbei.`);
        }
    });

    kalender.appendChild(tuerchen);
}
