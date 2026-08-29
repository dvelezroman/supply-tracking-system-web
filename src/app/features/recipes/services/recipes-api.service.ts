import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import type { ApiResponse, PaginatedData } from '../../../core/models/api-response.model';
import type {
  ChatResponse,
  ImportApiResult,
  ImportUrlResult,
  RecipeDetail,
  RecipeListItem,
  RecipeStatus,
  RecipeUpsertPayload,
} from '../models/recipe.model';

@Injectable({ providedIn: 'root' })
export class RecipesAdminApiService {
  private http = inject(HttpClient);
  private base = `${environment.apiBase}/recipes/admin`;

  list(params: {
    page?: number;
    limit?: number;
    q?: string;
    status?: RecipeStatus;
    category?: string;
  }) {
    let httpParams = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('limit', String(params.limit ?? 20));
    if (params.q) httpParams = httpParams.set('q', params.q);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.category) httpParams = httpParams.set('category', params.category);
    return this.http.get<ApiResponse<PaginatedData<RecipeListItem>>>(this.base, {
      params: httpParams,
    });
  }

  getById(id: string) {
    return this.http.get<ApiResponse<RecipeDetail>>(`${this.base}/${id}`);
  }

  create(payload: RecipeUpsertPayload) {
    return this.http.post<ApiResponse<RecipeDetail>>(this.base, payload);
  }

  update(id: string, payload: Partial<RecipeUpsertPayload>) {
    return this.http.put<ApiResponse<RecipeDetail>>(`${this.base}/${id}`, payload);
  }

  setStatus(id: string, status: RecipeStatus) {
    return this.http.patch<ApiResponse<RecipeDetail>>(`${this.base}/${id}/status`, {
      status,
    });
  }

  reindex(id: string) {
    return this.http.post<ApiResponse<{ ok: boolean; id: string }>>(
      `${this.base}/${id}/reindex`,
      {},
    );
  }

  remove(id: string) {
    return this.http.delete<ApiResponse<RecipeDetail>>(`${this.base}/${id}`);
  }

  importApi(query = 'shrimp') {
    return this.http.post<ApiResponse<ImportApiResult>>(`${this.base}/import/api`, {
      query,
    });
  }

  importUrl(url: string) {
    return this.http.post<ApiResponse<ImportUrlResult>>(`${this.base}/import/url`, {
      url,
    });
  }

  linkProducts(id: string, productIds: string[]) {
    return this.http.put<ApiResponse<RecipeDetail>>(`${this.base}/${id}/products`, {
      productIds,
    });
  }
}

@Injectable({ providedIn: 'root' })
export class RecipesPublicApiService {
  private http = inject(HttpClient);
  private base = `${environment.apiBase}/public/recipes`;
  private chatBase = `${environment.apiBase}/public/chat`;

  search(params: {
    page?: number;
    limit?: number;
    q?: string;
    category?: string;
    sort?: 'relevance' | 'popular' | 'recent';
    difficulty?: string;
  }) {
    let httpParams = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('limit', String(params.limit ?? 20));
    if (params.q) httpParams = httpParams.set('q', params.q);
    if (params.category) httpParams = httpParams.set('category', params.category);
    if (params.sort) httpParams = httpParams.set('sort', params.sort);
    if (params.difficulty) httpParams = httpParams.set('difficulty', params.difficulty);
    return this.http.get<ApiResponse<PaginatedData<RecipeListItem>>>(this.base, {
      params: httpParams,
    });
  }

  popular(limit = 6) {
    return this.http.get<ApiResponse<RecipeListItem[]>>(`${this.base}/popular`, {
      params: { limit: String(limit) },
    });
  }

  trending(limit = 6) {
    return this.http.get<ApiResponse<RecipeListItem[]>>(`${this.base}/trending`, {
      params: { limit: String(limit) },
    });
  }

  getBySlug(slug: string) {
    return this.http.get<ApiResponse<RecipeDetail>>(`${this.base}/${slug}`);
  }

  like(slug: string, clientKey: string) {
    return this.http.post<ApiResponse<RecipeListItem>>(`${this.base}/${slug}/like`, {
      clientKey,
    });
  }

  unlike(slug: string, clientKey: string) {
    return this.http.delete<ApiResponse<RecipeListItem>>(`${this.base}/${slug}/like`, {
      body: { clientKey },
    });
  }

  likeStatus(slug: string, clientKey: string) {
    return this.http.get<
      ApiResponse<{ slug: string; likeCount: number; liked: boolean }>
    >(`${this.base}/${slug}/like-status`, {
      params: { clientKey },
      headers: { 'x-client-key': clientKey },
    });
  }

  chat(message: string, options?: { sessionId?: string; lang?: 'es' | 'en' }) {
    return this.http.post<ApiResponse<ChatResponse>>(this.chatBase, {
      message,
      sessionId: options?.sessionId,
      lang: options?.lang ?? 'es',
    });
  }
}

const CLIENT_KEY_STORAGE = 'marea_recipe_client_key';

export function getRecipeClientKey(): string {
  try {
    let key = localStorage.getItem(CLIENT_KEY_STORAGE);
    if (!key) {
      key = crypto.randomUUID();
      localStorage.setItem(CLIENT_KEY_STORAGE, key);
    }
    return key;
  } catch {
    return `anon-${Date.now()}`;
  }
}
