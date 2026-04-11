import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../../core/models/api-response.model';
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  User,
} from '../../../core/models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private base = `${environment.apiBase}/auth`;

  currentUser = signal<User | null>(this.loadUserFromStorage());
  isAuthenticated = computed(() => !!this.currentUser());
  isAdmin = computed(() => this.currentUser()?.role === 'ADMIN');

  login(payload: LoginPayload) {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.base}/login`, payload)
      .pipe(tap((res) => this.persist(res.data)));
  }

  register(payload: RegisterPayload) {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.base}/register`, payload)
      .pipe(tap((res) => this.persist(res.data)));
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('current_user');
    this.currentUser.set(null);
    this.router.navigate(['/']);
  }

  private persist(data: AuthResponse): void {
    localStorage.setItem('access_token', data.accessToken);
    localStorage.setItem('current_user', JSON.stringify(data.user));
    this.currentUser.set(data.user);
  }

  private loadUserFromStorage(): User | null {
    try {
      const raw = localStorage.getItem('current_user');
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }
}
