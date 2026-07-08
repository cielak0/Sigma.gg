<script setup>
import NavBar from './components/NavBar.vue';
import SiteFooter from './components/SiteFooter.vue';
</script>

<template>
  <div class="app-shell">
    <div class="bg-glow bg-glow--1" aria-hidden="true"></div>
    <div class="bg-glow bg-glow--2" aria-hidden="true"></div>

    <NavBar />

    <main id="main-content" class="main-content">
      <RouterView />
    </main>

    <SiteFooter />
  </div>
</template>
