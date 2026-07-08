<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import StatBars from '../components/StatBars.vue';
import { fetchChampionById, getFavorites, toggleFavorite } from '../services/championService';

const route = useRoute();
const champion = ref(null);
const favorites = ref(getFavorites());
const loading = ref(true);
const error = ref('');

const isFavorite = computed(() => champion.value && favorites.value.includes(champion.value.id));

async function loadChampion(id) {
  loading.value = true;
  error.value = '';
  champion.value = null;

  try {
    champion.value = await fetchChampionById(id);
    if (!champion.value) {
      error.value = 'Champion niet gevonden.';
    }
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

onMounted(() => loadChampion(route.params.id));

watch(
  () => route.params.id,
  (id) => {
    if (id) loadChampion(id);
  }
);

function handleToggleFavorite() {
  if (!champion.value) return;
  favorites.value = toggleFavorite(champion.value.id);
}
</script>

<template>
  <section class="page">
    <p v-if="loading" class="status-message" role="status">Champion laden…</p>
    <p v-else-if="error" class="status-message status-message--error" role="alert">{{ error }}</p>

    <article v-else-if="champion" class="detail">
      <div class="detail__hero">
        <img
          :src="champion.splash"
          :alt="`Splash art van ${champion.name}`"
          class="detail__splash"
        />
        <div class="detail__intro">
          <p class="eyebrow">{{ champion.role }} · {{ champion.lane }}</p>
          <h1>{{ champion.name }}</h1>
          <p class="detail__title">{{ champion.title }}</p>
          <p>{{ champion.description }}</p>
          <div class="detail__meta">
            <span class="tag">Moeilijkheid: {{ champion.difficulty }}</span>
            <button
              type="button"
              class="btn btn--ghost favorite-toggle"
              :aria-pressed="isFavorite"
              @click="handleToggleFavorite"
            >
              {{ isFavorite ? '★ In favorieten' : '☆ Toevoegen aan favorieten' }}
            </button>
          </div>
        </div>
      </div>

      <div class="detail__grid">
        <section aria-labelledby="tips-heading">
          <h2 id="tips-heading">Tips</h2>
          <ul class="tips-list">
            <li v-for="(tip, index) in champion.tips" :key="index">{{ tip }}</li>
          </ul>
        </section>

        <section aria-labelledby="stats-heading">
          <h2 id="stats-heading">Stats</h2>
          <StatBars :stats="champion.stats" />
        </section>
      </div>

      <RouterLink to="/champions" class="back-link">← Terug naar overzicht</RouterLink>
    </article>
  </section>
</template>
