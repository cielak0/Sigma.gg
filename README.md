# Sigma.GG

League of Legends champion-gids gebouwd met **Vue 3** als onderdeel van het MBO keuzedeel *Front-end Framework*.

De site bevat vijf pagina's, herbruikbare componenten, routing, JSON-data en is geoptimaliseerd voor statische hosting op GitHub Pages.

## Installatie

- **Vereisten:** Node.js LTS (v18+)
- **Installeren:**

```bash
npm install
```

## Ontwikkelen

```bash
npm run dev
```

Open de URL die Vite toont (meestal `http://localhost:5173`).

## Build

```bash
npm run build
```

Controleer de outputmap `dist/`.

Lokaal previewen na build:

```bash
npm run preview
```

## Deploy naar GitHub Pages

1. Push de code naar de `main` branch op GitHub.
2. Ga naar **Settings → Pages** in de repository.
3. Kies **GitHub Actions** als source, of deploy handmatig de `dist/` map.
4. Zorg dat `base` in `vite.config.js` overeenkomt met je repo-naam (`/Sigma.gg/`).

**Live URL:** https://cielak0.github.io/Sigma.gg/

## Projectstructuur

```
src/
  components/   # NavBar, ChampionCard, SearchBar, StatBars, SiteFooter
  views/        # Home, Champions, Detail, Favorieten, Over
  router/       # Vue Router configuratie
  services/     # JSON fetch + localStorage favorieten
public/
  data/         # champions.json
```

## Functionaliteit

- 5 pagina's met Vue Router (hash-modus voor GitHub Pages)
- 4+ componenten (NavBar, ChampionCard, SearchBar, StatBars, SiteFooter)
- Data laden uit `public/data/champions.json`
- Zoeken en filteren op champions
- Favorieten via localStorage
- Toegankelijke markup (semantische HTML, alt-teksten, ARIA)

## Bronvermelding

- [Vue.js](https://vuejs.org/)
- [Vue Router](https://router.vuejs.org/)
- [Vite](https://vite.dev/)
- [Riot Games Data Dragon](https://developer.riotgames.com/docs/lol)

## Documentatie keuzedeel

- `docs/VERSLAG.md` — verslag (Inleiding, Keuzeproces, Keuze, Onderbouwing)
- `docs/TESTPLAN.md` — testplan met bevindingen
