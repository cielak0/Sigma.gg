<script setup>
defineProps({
  champion: {
    type: Object,
    required: true,
  },
  isFavorite: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['toggle-favorite']);
</script>

<template>
  <article class="champion-card">
    <RouterLink :to="`/champions/${champion.id}`" class="champion-card__link">
      <img
        :src="champion.image"
        :alt="`Champion icon van ${champion.name}`"
        class="champion-card__image"
        loading="lazy"
        width="64"
        height="64"
      />
      <div class="champion-card__body">
        <h2 class="champion-card__name">{{ champion.name }}</h2>
        <p class="champion-card__title">{{ champion.title }}</p>
        <div class="champion-card__tags">
          <span class="tag">{{ champion.role }}</span>
          <span class="tag tag--lane">{{ champion.lane }}</span>
          <span class="tag tag--difficulty">{{ champion.difficulty }}</span>
        </div>
      </div>
    </RouterLink>

    <button
      type="button"
      class="favorite-btn"
      :class="{ 'favorite-btn--active': isFavorite }"
      :aria-label="isFavorite ? `${champion.name} verwijderen uit favorieten` : `${champion.name} toevoegen aan favorieten`"
      :aria-pressed="isFavorite"
      @click="$emit('toggle-favorite', champion.id)"
    >
      <span aria-hidden="true">{{ isFavorite ? '★' : '☆' }}</span>
    </button>
  </article>
</template>
