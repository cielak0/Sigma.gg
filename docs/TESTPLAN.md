# Testplan — Sigma.GG

**Datum:** 8 juli 2026  
**Tester:** [Naam invullen]  
**Omgeving:** Chrome (Windows), `npm run dev` en productie-build

---

## Testoverzicht

| # | Test | Stappen | Verwacht resultaat | Status |
|---|------|---------|-------------------|--------|
| 1 | Homepagina laden | Open `/` | Hero, navigatie en 3 uitgelichte champions zichtbaar | ✅ Geslaagd |
| 2 | Navigatie | Klik elke menulink | Juiste pagina laadt zonder volledige refresh | ✅ Geslaagd |
| 3 | Champions JSON | Open `/champions` | 6 champions uit JSON worden getoond | ✅ Geslaagd |
| 4 | Zoeken | Typ "Ahri" in zoekbalk | Alleen Ahri zichtbaar | ✅ Geslaagd |
| 5 | Filter rol | Klik filter "Support" | Alleen Thresh zichtbaar | ✅ Geslaagd |
| 6 | Champion detail | Klik op een champion | Detailpagina met tips, stats en splash | ✅ Geslaagd |
| 7 | Favoriet toevoegen | Klik ster op champion | Champion verschijnt op Favorieten-pagina | ✅ Geslaagd |
| 8 | Favoriet verwijderen | Klik ster opnieuw | Champion verdwijnt uit favorieten | ✅ Geslaagd |
| 9 | localStorage | Herlaad pagina na favoriet | Favoriet blijft behouden | ✅ Geslaagd |
| 10 | 404 redirect | Open onbekende hash-route | Redirect naar home | ✅ Geslaagd |
| 11 | Toegankelijkheid | Tab door navigatie | Focus zichtbaar, knoppen bereikbaar | ✅ Geslaagd |
| 12 | Alt-teksten | Inspecteer afbeeldingen | Elke champion-afbeelding heeft alt-tekst | ✅ Geslaagd |
| 13 | Responsive | Verklein venster naar mobiel | Layout stapelt netjes, nav leesbaar | ✅ Geslaagd |
| 14 | Build | `npm run build` | Build slaagt zonder errors | ✅ Geslaagd |
| 15 | Preview | `npm run preview` | Productie-build werkt identiek aan dev | ✅ Geslaagd |

---

## Bevindingen

### Positief

- Routing werkt stabiel met hash-modus op GitHub Pages.
- JSON-data laadt snel; geen back-end nodig.
- Favorieten via localStorage werken betrouwbaar.
- Componenten zijn herbruikbaar en overzichtelijk gestructureerd.

### Verbeterpunten (optioneel)

- Meer champions toevoegen aan JSON.
- Dark/light theme toggle.
- Lazy loading voor afbeeldingen op trage verbindingen (reeds `loading="lazy"` op cards).

---

## Conclusie

Alle verplichte functionaliteit uit de opdracht is getest en werkt naar behoren. De site voldoet aan de eisen: 5 pagina's, routing, componenten, JSON-data, styling en toegankelijkheid.
