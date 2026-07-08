# Verslag — Front-end Framework Keuzedeel

**Student:** Bartek Ciesielski  
**Project:** Sigma.GG  
**Framework:** Vue 3  
**Datum:** 8 juli 2026

---

## 1. Inleiding

Voor het keuzedeel *Front-end Framework* moest ik een front-end framework onderzoeken, een beredeneerde keuze maken en een werkende website bouwen en publiceren op GitHub Pages. Ik heb gekozen voor een League of Legends champion-gids: **Sigma.GG**. De site laat spelers champions bekijken, filteren, tips lezen en favorieten opslaan.

Het doel van dit project is drieledig:

1. Frameworks vergelijken en een onderbouwde keuze maken.
2. Een functionele multi-page website bouwen met routing, componenten en data uit JSON.
3. Professioneel documenteren en publiceren via GitHub Pages.

De website bevat vijf pagina's (Home, Champions, Champion detail, Favorieten, Over), minimaal vier herbruikbare componenten, en voldoet aan de eisen voor toegankelijkheid en statische hosting zonder back-end.

---

## 2.1 Keuzeproces

### Onderzoeksvragen

- Welk framework past het best bij een statische site met meerdere pagina's en componenten?
- Hoe groot is de leercurve en documentatie voor een MBO-student?
- Hoe goed werkt het framework met GitHub Pages (build + deploy)?

### Vergelijkingscriteria

| Criterium | Gewicht | Toelichting |
|-----------|---------|-------------|
| Leercurve | Hoog | Moet binnen de projecttijd beheersbaar zijn |
| Documentatie | Hoog | Duidelijke docs en voorbeelden |
| Componenten & routing | Hoog | SPA met meerdere views |
| GitHub Pages compatibiliteit | Hoog | Statische build, geen server-side code |
| Populariteit / arbeidsmarkt | Middel | Relevant voor stage en werk |
| Bundle-grootte / performance | Middel | Snelle laadtijd op Pages |

### Frameworks vergeleken

#### Vue 3

- **Voordelen:** Progressieve opbouw, duidelijke documentatie, Single File Components (.vue), officiële router (Vue Router), Vite als snelle build tool.
- **Nadelen:** Minder corporate adoptie dan React in sommige bedrijven.
- **GitHub Pages:** Uitstekend — `npm run build` levert statische `dist/` map.

#### React

- **Voordelen:** Grootste ecosystem, veel tutorials en vacatures, JSX is flexibel.
- **Nadelen:** Meer boilerplate (React Router apart installeren), hooks/state management voelt abstracter voor beginners.
- **GitHub Pages:** Goed — Create React App of Vite + React werkt statisch.

#### Svelte

- **Voordelen:** Weinig boilerplate, compiler-gebaseerd, kleine bundle.
- **Nadelen:** Kleinere community dan Vue/React, minder leermateriaal in het Nederlands.
- **GitHub Pages:** Goed — SvelteKit of Vite + Svelte.

### Conclusie keuzeproces

Na vergelijking scoren Vue 3 en React het hoogst. Vue wint op leercurve en integratie (router + officiële tooling) voor een compact schoolproject zonder back-end.

---

## 2.2 Keuze

**Gekozen framework: Vue 3** met Vue Router en Vite.

---

## 2.3 Onderbouwing

1. **Leercurve:** Vue's template-syntax lijkt op HTML en is voor mij als beginnende front-end developer het meest toegankelijk. De Composition API (`script setup`) houdt logica overzichtelijk per component.

2. **Documentatie:** De [officiële Vue-docs](https://vuejs.org/) zijn helder, met interactieve voorbeelden en een duidelijke guide voor routing en componenten.

3. **Projecteisen:** Vue Router dekt routing (5 pagina's). Componenten zoals `NavBar`, `ChampionCard` en `SearchBar` zijn herbruikbaar. JSON-data laadt via `fetch()` uit `public/data/champions.json`.

4. **GitHub Pages:** Vite bouwt een statische site. Hash-routing (`createWebHashHistory`) voorkomt 404-problemen op GitHub Pages zonder server-configuratie.

5. **Toegankelijkheid:** Semantische tags (`header`, `main`, `nav`, `article`), alt-teksten op afbeeldingen, ARIA-labels op knoppen en zoekvelden.

6. **Arbeidsmarkt:** Vue wordt veel gebruikt in webshops, dashboards en interne tools. React is groter, maar Vue biedt een betere balans tussen leerbaarheid en professionele output voor dit project.

**Alternatief afgewezen:** React — krachtiger ecosystem, maar meer setup en abstractie voor hetzelfde eindresultaat binnen de beschikbare tijd.

---

## Reflectie

Het bouwen met Vue 3 verliep vlot dankzij Vite (snelle hot reload) en duidelijke componentstructuur. De grootste uitdaging was GitHub Pages configureren (juiste `base` path en hash-router). Voor een vervolgproject zou ik GitHub Actions toevoegen voor automatische deploy na elke push.

---

## Bronvermelding

- Vue.js. (2026). *Documentation*. https://vuejs.org/
- Vue Router. (2026). *Documentation*. https://router.vuejs.org/
- Vite. (2026). *Documentation*. https://vite.dev/
- Riot Games. (2026). *Data Dragon*. https://developer.riotgames.com/docs/lol
- React. (2026). *Documentation*. https://react.dev/
- Svelte. (2026). *Documentation*. https://svelte.dev/
