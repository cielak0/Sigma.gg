<template>
  <section class="page page--about">
    <header class="page-header">
      <h1>Over dit project</h1>
      <p>Front-end Framework keuzedeel — MBO</p>
    </header>

    <article class="about-content">
      <section aria-labelledby="project-heading">
        <h2 id="project-heading">Project</h2>
        <p>
          Sigma.GG is een statische champion-gids voor League of Legends.
          De site is gebouwd met Vue 3, Vue Router en Vite, en gehost op GitHub Pages.
        </p>
      </section>

      <section aria-labelledby="tech-heading">
        <h2 id="tech-heading">Technieken</h2>
        <ul>
          <li><strong>Framework:</strong> Vue 3 (Composition API)</li>
          <li><strong>Routing:</strong> Vue Router met hash-modus voor GitHub Pages</li>
          <li><strong>Data:</strong> JSON-bestand via fetch API</li>
          <li><strong>Styling:</strong> Custom CSS met CSS-variabelen</li>
          <li><strong>Toegankelijkheid:</strong> Semantische HTML, alt-teksten, ARIA-labels</li>
        </ul>
      </section>

      <section aria-labelledby="pages-heading">
        <h2 id="pages-heading">Pagina's</h2>
        <ol>
          <li>Home — introductie en uitgelichte champions</li>
          <li>Champions — overzicht met zoeken en filteren</li>
          <li>Champion detail — tips en stats per champion</li>
          <li>Favorieten — opgeslagen champions (localStorage)</li>
          <li>Over — projectdocumentatie</li>
        </ol>
      </section>

      <section aria-labelledby="sources-heading">
        <h2 id="sources-heading">Bronvermelding</h2>
        <ul>
          <li>
            <a href="https://vuejs.org/" target="_blank" rel="noopener noreferrer">Vue.js documentatie</a>
          </li>
          <li>
            <a href="https://router.vuejs.org/" target="_blank" rel="noopener noreferrer">Vue Router documentatie</a>
          </li>
          <li>
            <a href="https://vite.dev/" target="_blank" rel="noopener noreferrer">Vite documentatie</a>
          </li>
          <li>
            <a href="https://developer.riotgames.com/docs/lol" target="_blank" rel="noopener noreferrer">Riot Games Data Dragon</a>
          </li>
        </ul>
      </section>
    </article>
  </section>
</template>
