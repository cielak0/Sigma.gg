<script setup>
import { onMounted, ref } from 'vue';
import { fetchChampions } from '../services/championService';

const champions = ref([]);
const loading = ref(true);
const error = ref('');

onMounted(async () => {
  try {
    champions.value = await fetchChampions();
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <section class="page page--home">
    <div class="hero">
      <p class="eyebrow">League of Legends</p>
      <h1>Welkom bij Sigma.GG</h1>
      <p class="hero__text">
        Ontdek champions, lees tips per rol en bewaar je favorieten.
        Deze site is gebouwd met Vue 3 als onderdeel van het front-end framework keuzedeel.
      </p>
      <div class="hero__actions">
        <RouterLink to="/champions" class="btn btn--primary">Bekijk champions</RouterLink>
        <RouterLink to="/over" class="btn btn--ghost">Over dit project</RouterLink>
      </div>
    </div>

    <section class="panel" aria-labelledby="featured-heading">
      <h2 id="featured-heading">Uitgelichte champions</h2>

      <p v-if="loading" class="status-message" role="status">Champions laden…</p>
      <p v-else-if="error" class="status-message status-message--error" role="alert">{{ error }}</p>

      <ul v-else class="featured-grid">
        <li v-for="champion in champions.slice(0, 3)" :key="champion.id">
          <RouterLink :to="`/champions/${champion.id}`" class="featured-card">
            <img
              :src="champion.splash"
              :alt="`Splash art van ${champion.name}`"
              class="featured-card__image"
              loading="lazy"
            />
            <div class="featured-card__overlay">
              <h3>{{ champion.name }}</h3>
              <p>{{ champion.role }} · {{ champion.lane }}</p>
            </div>
          </RouterLink>
        </li>
      </ul>
    </section>
  </section>
</template>
