<script setup>
import { computed, onMounted, ref } from 'vue';
import ChampionCard from '../components/ChampionCard.vue';
import SearchBar from '../components/SearchBar.vue';
import { fetchChampions, getFavorites, toggleFavorite } from '../services/championService';

const champions = ref([]);
const favorites = ref(getFavorites());
const searchQuery = ref('');
const roleFilter = ref('Alle');
const loading = ref(true);
const error = ref('');

const roles = computed(() => {
  const unique = [...new Set(champions.value.map((champion) => champion.role))].sort((a, b) =>
    a.localeCompare(b, 'nl', { sensitivity: 'base' })
  );
  return ['Alle', ...unique];
});

const filteredChampions = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  return champions.value.filter((champion) => {
    const matchesRole = roleFilter.value === 'Alle' || champion.role === roleFilter.value;
    const matchesQuery =
      !query ||
      champion.name.toLowerCase().includes(query) ||
      champion.lane.toLowerCase().includes(query) ||
      champion.role.toLowerCase().includes(query);
    return matchesRole && matchesQuery;
  });
});

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
      <h1>Champions</h1>
      <p>Browse alle champions. Data wordt geladen uit een lokaal JSON-bestand.</p>
    </header>

    <div class="filters">
      <SearchBar v-model="searchQuery" label="Zoek op naam, rol of lane" />

      <div class="filter-group" role="group" aria-label="Filter op rol">
        <button
          v-for="role in roles"
          :key="role"
          type="button"
          class="filter-chip"
          :class="{ 'filter-chip--active': roleFilter === role }"
          :aria-pressed="roleFilter === role"
          @click="roleFilter = role"
        >
          {{ role }}
        </button>
      </div>
    </div>

    <p v-if="loading" class="status-message" role="status">Champions laden…</p>
    <p v-else-if="error" class="status-message status-message--error" role="alert">{{ error }}</p>
    <p v-else-if="filteredChampions.length === 0" class="status-message">Geen champions gevonden.</p>

    <ul v-else class="champion-grid">
      <li v-for="champion in filteredChampions" :key="champion.id">
        <ChampionCard
          :champion="champion"
          :is-favorite="favorites.includes(champion.id)"
          @toggle-favorite="handleToggleFavorite"
        />
      </li>
    </ul>
  </section>
</template>
