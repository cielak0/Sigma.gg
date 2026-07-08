<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const links = [
  { to: '/', label: 'Home' },
  { to: '/champions', label: 'Champions' },
  { to: '/favorieten', label: 'Favorieten' },
  { to: '/over', label: 'Over' },
];

const activePath = computed(() => route.path);
</script>

<template>
  <header class="site-header">
    <div class="header-inner">
      <RouterLink to="/" class="logo" aria-label="Sigma.GG — naar home">
        <span class="logo-mark" aria-hidden="true">Σ</span>
        <span class="logo-text">Sigma<span class="logo-dot">.GG</span></span>
      </RouterLink>

      <nav class="main-nav" aria-label="Hoofdnavigatie">
        <RouterLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="nav-link"
          :class="{ 'nav-link--active': activePath === link.to || (link.to !== '/' && activePath.startsWith(link.to)) }"
        >
          {{ link.label }}
        </RouterLink>
      </nav>
    </div>
  </header>
</template>
