/** Normalize API category/difficulty for i18n lookup. */
function normalizeLabel(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ');
}

/** Canonical Spanish (and EN aliases) → Transloco key under recipes.public.categories.* */
const CATEGORY_KEYS: Record<string, string> = {
  'entrada / coctel': 'recipes.public.categories.entradaCoctel',
  'starter / cocktail': 'recipes.public.categories.entradaCoctel',
  'starters / cocktail': 'recipes.public.categories.entradaCoctel',
  'plato fuerte': 'recipes.public.categories.platoFuerte',
  mains: 'recipes.public.categories.platoFuerte',
  'main course': 'recipes.public.categories.platoFuerte',
  'plato fuerte / entrada': 'recipes.public.categories.platoFuerteEntrada',
  'plato fuerte / acompanante': 'recipes.public.categories.platoFuerteAcompanante',
  'entrada / transicion': 'recipes.public.categories.entradaTransicion',
  transition: 'recipes.public.categories.entradaTransicion',
};

const DIFFICULTY_KEYS: Record<string, string> = {
  facil: 'recipes.public.difficultyEasy',
  easy: 'recipes.public.difficultyEasy',
  media: 'recipes.public.difficultyMedium',
  medium: 'recipes.public.difficultyMedium',
  dificil: 'recipes.public.difficultyHard',
  hard: 'recipes.public.difficultyHard',
};

/** Transloco key for a recipe category, or null if unknown (show raw). */
export function recipeCategoryI18nKey(
  category: string | null | undefined,
): string | null {
  if (!category?.trim()) return null;
  return CATEGORY_KEYS[normalizeLabel(category)] ?? null;
}

/** Transloco key for difficulty, or null if unknown. */
export function recipeDifficultyI18nKey(
  difficulty: string | null | undefined,
): string | null {
  if (!difficulty?.trim()) return null;
  return DIFFICULTY_KEYS[normalizeLabel(difficulty)] ?? null;
}
