<script setup>
import { computed, onMounted, ref } from 'vue';
import ChampionCard from '../components/ChampionCard.vue';
import { fetchChampions, getFavorites, toggleFavorite } from '../services/championService';

const champions = ref([]);
const favorites = ref(getFavorites());
const loading = ref(true);
const error = ref('');

const favoriteChampions = computed(() =>
  champions.value.filter((champion) => favorites.value.includes(champion.id))
);

onMounted(async () => {
  try {
    champions.value = await fetchChampions();
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
});

function handleToggleFavorite(id) {
  favorites.value = toggleFavorite(id);
}
</script>

<template>
  <section class="page">
    <header class="page-header">
      <h1>Favorieten</h1>
      <p>Je favorieten worden opgeslagen in localStorage van je browser.</p>
    </header>

    <p v-if="loading" class="status-message" role="status">Favorieten laden…</p>
    <p v-else-if="error" class="status-message status-message--error" role="alert">{{ error }}</p>
    <p v-else-if="favoriteChampions.length === 0" class="status-message">
      Nog geen favorieten. Voeg champions toe via het ster-icoon op de champions-pagina.
    </p>

    <ul v-else class="champion-grid">
      <li v-for="champion in favoriteChampions" :key="champion.id">
        <ChampionCard
          :champion="champion"
          :is-favorite="true"
          @toggle-favorite="handleToggleFavorite"
        />
      </li>
    </ul>
  </section>
</template>
