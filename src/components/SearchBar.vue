<script setup>
defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: 'Zoek champions',
  },
});

defineEmits(['update:modelValue']);
</script>

<template>
  <div class="search-bar" role="search">
    <label :for="label.replace(/\s+/g, '-').toLowerCase()" class="visually-hidden">{{ label }}</label>
    <svg class="search-bar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3-3" />
    </svg>
    <input
      :id="label.replace(/\s+/g, '-').toLowerCase()"
      type="search"
      class="search-bar__input"
      :value="modelValue"
      :placeholder="label"
      autocomplete="off"
      @input="$emit('update:modelValue', $event.target.value)"
    />
  </div>
</template>

<style scoped>
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
