export type RecipeStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'PUBLISHED'
  | 'ARCHIVED';

export type RecipeSourceType = 'MANUAL' | 'API_IMPORT' | 'SCRAPE' | 'SEED';

export type RecipeIngredient = {
  name: string;
  qty?: string;
  unit?: string;
  notes?: string;
};

export type RecipeStep = {
  order: number;
  text: string;
};

export type RecipeProductLink = {
  id: string;
  productId: string;
  product?: {
    id: string;
    sku: string;
    name: string;
  };
};

export type RecipeListItem = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  category?: string | null;
  difficulty?: string | null;
  imageUrl?: string | null;
  likeCount: number;
  status: RecipeStatus;
  publishedAt?: string | null;
  language: string;
  sourceType: RecipeSourceType;
  suitablePresentations?: string[];
  techniques?: string[];
  tags?: string[];
  cuisine?: string | null;
  region?: string | null;
  prepMinutes?: number | null;
  cookMinutes?: number | null;
  servings?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

export type RecipeDetail = RecipeListItem & {
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  tips?: string | null;
  allergens?: string[];
  dietaryTags?: string[];
  sourceUrl?: string | null;
  sourceName?: string | null;
  attribution?: string | null;
  license?: string | null;
  contentHash?: string | null;
  searchText?: string | null;
  products?: RecipeProductLink[];
  _count?: { likes: number; chunks: number };
};

export type RecipeUpsertPayload = {
  slug?: string;
  name: string;
  description?: string;
  category?: string;
  cuisine?: string;
  region?: string;
  language?: string;
  difficulty?: string;
  prepMinutes?: number | null;
  cookMinutes?: number | null;
  servings?: number | null;
  ingredients?: RecipeIngredient[];
  steps?: RecipeStep[];
  tips?: string;
  techniques?: string[];
  tags?: string[];
  allergens?: string[];
  dietaryTags?: string[];
  suitablePresentations?: string[];
  imageUrl?: string;
  sourceType?: RecipeSourceType;
  sourceUrl?: string;
  sourceName?: string;
  attribution?: string;
  license?: string;
  status?: RecipeStatus;
  productIds?: string[];
};

export type ChatResponse = {
  reply: string;
  recipeRefs: { slug: string; name: string; category: string | null }[];
  ragEnabled: boolean;
};

export type ImportApiResult = {
  jobId: string;
  createdCount: number;
  recipeIds: string[];
};

export type ImportUrlResult = {
  jobId: string;
  recipe: RecipeDetail;
  deduped: boolean;
};
