import type { RecipeIngredient, RecipeStep } from '../../models/recipe.model';

export type RecipeContentEn = {
  name: string;
  description: string;
  ingredients?: RecipeIngredient[];
  steps?: RecipeStep[];
};

/**
 * English overlays for seeded public recipes (slug → EN).
 * Base CMS fields stay Spanish; UI swaps when active lang is `en`.
 */
export const RECIPE_CONTENT_EN: Record<string, RecipeContentEn> = {
  'ceviche-de-camaron': {
    name: 'Shrimp Ceviche',
    description:
      'Cooked shrimp marinated in citrus lemon juice with fresh vegetables.',
    ingredients: [
      { name: 'Shrimp' },
      { name: 'Lemon' },
      { name: 'Red onion' },
      { name: 'Cilantro' },
      { name: 'Tomato' },
    ],
  },
  'coctel-de-camarones-clasico': {
    name: 'Classic Shrimp Cocktail',
    description:
      'Chilled shrimp served in a seasoned pink sauce with avocado pieces.',
    ingredients: [
      { name: 'Shrimp' },
      { name: 'Ketchup' },
      { name: 'Mayonnaise' },
      { name: 'Worcestershire sauce' },
      { name: 'Avocado' },
    ],
  },
  'aguachile-de-camaron': {
    name: 'Shrimp Aguachile',
    description:
      'Shrimp briefly cured in an intense mix of lemon and hot chiles.',
    ingredients: [
      { name: 'Cleaned shrimp' },
      { name: 'Lemon juice' },
      { name: 'Serrano chile' },
      { name: 'Cucumber' },
      { name: 'Red onion' },
    ],
  },
  'camarones-al-ajillo': {
    name: 'Garlic Shrimp (Ajillo)',
    description:
      'Hot dish where shrimp are quickly sautéed in abundant garlic and fragrant oil.',
    ingredients: [
      { name: 'Shrimp' },
      { name: 'Garlic' },
      { name: 'Olive oil' },
      { name: 'Dried chile / guindilla' },
      { name: 'White wine' },
    ],
  },
  'camarones-a-la-diabla': {
    name: 'Devil-Style Shrimp',
    description:
      'Shrimp coated in a smooth, highly spicy red sauce made from dried chiles.',
    ingredients: [
      { name: 'Shrimp' },
      { name: 'Guajillo chile' },
      { name: 'Chipotle chile' },
      { name: 'Garlic' },
      { name: 'Tomato purée' },
    ],
  },
  'arroz-con-camarones': {
    name: 'Shrimp Rice',
    description:
      'Seasoned rice cooked with a vegetable sofrito and juicy shrimp.',
    ingredients: [
      { name: 'Shrimp' },
      { name: 'Rice' },
      { name: 'Bell pepper' },
      { name: 'Onion' },
      { name: 'Annatto / turmeric' },
    ],
  },
  'tacos-de-camaron-ensenada': {
    name: 'Ensenada-Style Shrimp Tacos',
    description:
      'Beer-battered crispy shrimp, fried and served in corn tortillas.',
    ingredients: [
      { name: 'Shrimp' },
      { name: 'Flour' },
      { name: 'Beer' },
      { name: 'Corn tortillas' },
      { name: 'Shredded cabbage' },
    ],
  },
  'camarones-en-salsa-de-coco': {
    name: 'Shrimp in Coconut Sauce',
    description:
      'Caribbean-inspired recipe with a creamy, subtly sweet and aromatic sauce.',
    ingredients: [
      { name: 'Shrimp' },
      { name: 'Coconut milk' },
      { name: 'Bell pepper' },
      { name: 'Ginger' },
      { name: 'Cilantro' },
    ],
  },
  'pasta-alfredo-con-camarones': {
    name: 'Shrimp Alfredo Pasta',
    description:
      'Italian pasta in a rich white cream sauce, topped with sautéed shrimp.',
    ingredients: [
      { name: 'Shrimp' },
      { name: 'Fettuccine' },
      { name: 'Heavy cream' },
      { name: 'Parmesan cheese' },
      { name: 'Butter' },
    ],
  },
  'camarones-imperial-empanizados': {
    name: 'Imperial Breaded Shrimp',
    description:
      'Crispy outside, tender inside—ideal for dipping sauces.',
    ingredients: [
      { name: 'Shrimp' },
      { name: 'Breadcrumbs / panko' },
      { name: 'Egg' },
      { name: 'Flour' },
      { name: 'Frying oil' },
    ],
  },
  'brochetas-de-camaron-a-la-parilla': {
    name: 'Grilled Shrimp Skewers',
    description:
      'Skewers alternating seafood, vegetables and fruit, grilled over charcoal or a plancha.',
    ingredients: [
      { name: 'Shrimp' },
      { name: 'Green bell pepper' },
      { name: 'White onion' },
      { name: 'Pineapple' },
      { name: 'BBQ or teriyaki sauce' },
    ],
  },
  'encocado-de-camaron': {
    name: 'Pacific Coast Encocado (Coconut Stew)',
    description:
      'Traditional Pacific coast stew—creamy with deep coconut and herb flavor.',
    ingredients: [
      { name: 'Shrimp' },
      { name: 'Fresh grated coconut' },
      { name: 'Coconut milk' },
      { name: 'Culantro / chillangua' },
      { name: 'Green sofrito' },
    ],
  },
  'camarones-kung-pao': {
    name: 'Kung Pao Shrimp',
    description:
      'Chinese classic balancing salty, sweet, sour and spicy flavors.',
    ingredients: [
      { name: 'Shrimp' },
      { name: 'Peanuts' },
      { name: 'Dried chiles' },
      { name: 'Soy sauce' },
      { name: 'Zucchini' },
    ],
  },
  'chupin-o-cazuela-de-camaron': {
    name: 'Shrimp Chupín / Clay-Pot Stew',
    description:
      'Thick stew traditionally cooked in clay with green plantain and peanut.',
    ingredients: [
      { name: 'Shrimp' },
      { name: 'Green plantain' },
      { name: 'Peanut paste' },
      { name: 'Fish stock' },
      { name: 'Onion' },
    ],
  },
  'risotto-de-camarones-y-esparragos': {
    name: 'Shrimp and Asparagus Risotto',
    description:
      'Creamy Italian rice from starch release and butter, with shrimp and asparagus.',
    ingredients: [
      { name: 'Shrimp' },
      { name: 'Arborio rice' },
      { name: 'Seafood stock' },
      { name: 'Asparagus' },
      { name: 'White wine' },
    ],
  },
  'camarones-en-salsa-de-tamarindo': {
    name: 'Shrimp in Tamarind Sauce',
    description:
      'Sweet-and-sour exotic profile popular in Asian cooking.',
    ingredients: [
      { name: 'Shrimp' },
      { name: 'Tamarind pulp' },
      { name: 'Brown sugar' },
      { name: 'Garlic' },
      { name: 'Fish sauce' },
    ],
  },
  'chop-suey-de-camarones': {
    name: 'Shrimp Chop Suey',
    description:
      'Quick high-heat wok stir-fry of crisp vegetables and shrimp.',
    ingredients: [
      { name: 'Shrimp' },
      { name: 'Bean sprouts' },
      { name: 'Carrot' },
      { name: 'Broccoli' },
      { name: 'Oyster sauce' },
    ],
  },
  'gumbo-de-camaron': {
    name: 'Shrimp Gumbo',
    description:
      'Dense, intensely seasoned stew-soup, emblem of Louisiana Creole cooking.',
    ingredients: [
      { name: 'Shrimp' },
      { name: 'Andouille sausage' },
      { name: 'Okra' },
      { name: 'Dark roux' },
      { name: 'Celery' },
    ],
  },
  'ceviche-dulce-de-camaron-con-mango': {
    name: 'Sweet Shrimp Ceviche with Mango',
    description:
      'Fresh take that plays on the edge of savory and sweet with tropical fruit.',
    ingredients: [
      { name: 'Shrimp' },
      { name: 'Ripe mango' },
      { name: 'Passion fruit juice' },
      { name: 'Chopped mint' },
      { name: 'Red onion' },
    ],
  },
};

export function localizeRecipeFields<
  T extends {
    slug: string;
    name: string;
    description?: string | null;
    ingredients?: RecipeIngredient[] | unknown;
    steps?: RecipeStep[] | unknown;
  },
>(item: T, lang: string): T {
  if (lang !== 'en') return item;
  const en = RECIPE_CONTENT_EN[item.slug];
  if (!en) return item;

  const next: T = {
    ...item,
    name: en.name,
    description: en.description,
  };
  if (en.ingredients) {
    next.ingredients = en.ingredients;
  }
  if (en.steps) {
    next.steps = en.steps;
  } else if (en.description && Array.isArray(item.steps)) {
    // Seed stores description as the single step — mirror EN description.
    const steps = item.steps as RecipeStep[];
    if (steps.length === 1 && steps[0]?.text === item.description) {
      next.steps = [{ order: 1, text: en.description }];
    }
  }
  return next;
}
