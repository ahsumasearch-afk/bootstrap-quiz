# Bootstrap-5-Quiz

80 Fragen zu Bootstrap 5 – zum Üben, Auffrischen und Prüfen. Läuft im Browser,
ohne Konto, ohne Server, ohne Bauwerkzeuge.

**Live:** https://ahsumasearch-afk.github.io/bootstrap-quiz/

## Was drin ist

Zehn Bereiche mit je acht Fragen, in drei Schwierigkeitsstufen:

| Bereich | Worum es geht |
|---|---|
| Grid & Layout | Container, Spalten, Rinnen, `row-cols`, Offsets, Reihenfolge |
| Abstände & Größen | Die Skala von 0 bis 5, `start`/`end`, `gap`, eigene Werte |
| Typografie & Farben | `fw-*`, `fst-*`, `text-bg-*`, Farbschemata |
| Komponenten | Buttons, Karten, Navbar, Accordion, Offcanvas, `stretched-link` |
| Formulare | `form-control`, `form-select`, `form-label`, Prüfung und Meldungen |
| Flex & Ausrichtung | `d-flex`, `justify-content-*`, `align-items-*`, Stacks |
| JavaScript-Bauteile | Datenattribute, Popper, Instanzen, Ereignisse |
| Breakpoints | Die fünf Grenzen, mobile-first, `img-fluid`, `ratio` |
| Anpassen & Sass | Variablen vor dem Import, `$spacers`, `$theme-colors`, `$enable-*` |
| Umstieg von 4 auf 5 | Was umbenannt und was gestrichen wurde |

Nach jeder Frage kommt sofort die Auflösung mit Erklärung – bei vielen Fragen
zusätzlich mit einem Codebeispiel. Am Ende gibt es eine Auswertung nach
Bereichen und eine Liste der falsch beantworteten Fragen, die sich mit einem
Klick noch einmal durchspielen lässt.

**Alle Angaben sind gegen die offizielle Dokumentation von Bootstrap 5.3
geprüft** – Abstandsskala, Breakpoints, Klassennamen und die Liste dessen, was
beim Umstieg von Bootstrap 4 umbenannt oder gestrichen wurde.

## Bedienung

* Maus oder die Tasten **1** bis **4** für die Antwort
* **Eingabetaste** für die nächste Frage
* Umschalter oben rechts für helles oder dunkles Farbschema

Bestwert, letzter Durchgang und die Wahl des Farbschemas bleiben auf dem Gerät
gespeichert (`localStorage`), sonst wird nichts gespeichert und nichts
übertragen.

## Aufbau

```
index.html        Gerüst, lädt Bootstrap 5.3 vom CDN
css/style.css     das Wenige, wofür es keine Hilfsklasse gibt
js/fragen.js      die 80 Fragen mit Antworten, Erklärungen und Beispielen
js/app.js         Ablauf: Auswahl → Frage → Auflösung → Auswertung
```

Die Oberfläche ist bewusst mit Bootstrap 5 selbst gebaut – Karten, Accordion,
Fortschrittsbalken, Button-Gruppen, `btn-check` statt eigener Ankreuzfelder und
die Farbschemata über `data-bs-theme`. Eigenes CSS gibt es nur dort, wo
Bootstrap nichts Passendes mitbringt.

## Eigene Fragen ergänzen

In `js/fragen.js` einen Eintrag anhängen:

```js
{b:"grid", s:2, f:"Frage mit <code>Auszeichnung</code>?",
 a:["richtig","falsch","falsch","falsch"], r:0,
 e:"Warum das so ist.",
 c:"<div class=\"row\">…</div>"}
```

`b` ist der Bereich, `s` die Stufe 1 bis 3, `r` die Nummer der richtigen
Antwort (ab 0). Das Beispiel `c` erscheint erst in der Auflösung – es würde die
Antwort sonst verraten. Nur wo sich die Frage ausdrücklich auf ihr Beispiel
bezieht, steht zusätzlich `cf:1`.

Bei jeder Änderung die Versionsnummer in `index.html` hochzählen (`?v=…` an
allen eigenen Dateien), damit niemand eine Mischung aus alten und neuen Dateien
lädt.
