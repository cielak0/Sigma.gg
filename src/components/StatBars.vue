<script setup>
defineProps({
  stats: {
    type: Object,
    required: true,
  },
});

const labels = {
  damage: 'Damage',
  toughness: 'Toughness',
  control: 'Control',
  mobility: 'Mobility',
  utility: 'Utility',
};
</script>

<template>
  <section class="stat-bars" aria-label="Champion statistieken">
    <div v-for="(value, key) in stats" :key="key" class="stat-bar">
      <div class="stat-bar__header">
        <span class="stat-bar__label">{{ labels[key] }}</span>
        <span class="stat-bar__value">{{ value }}/3</span>
      </div>
      <div class="stat-bar__track" role="meter" :aria-valuenow="value" aria-valuemin="0" aria-valuemax="3" :aria-label="`${labels[key]}: ${value} van 3`">
        <div class="stat-bar__fill" :style="{ width: `${(value / 3) * 100}%` }"></div>
      </div>
    </div>
  </section>
</template>
