const FAVORITES_KEY = 'sigma-gg-favorites';

export async function fetchChampions() {
  const response = await fetch(`${import.meta.env.BASE_URL}data/champions.json`);
  if (!response.ok) {
    throw new Error('Champions konden niet worden geladen.');
  }
  const champions = await response.json();
  return champions.sort((a, b) => a.name.localeCompare(b.name, 'nl', { sensitivity: 'base' }));
}

export async function fetchChampionById(id) {
  const champions = await fetchChampions();
  return champions.find((champion) => champion.id === id) ?? null;
}

export function getFavorites() {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function toggleFavorite(id) {
  const favorites = getFavorites();
  const next = favorites.includes(id)
    ? favorites.filter((item) => item !== id)
    : [...favorites, id];
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  return next;
}

export function isFavorite(id) {
  return getFavorites().includes(id);
}
