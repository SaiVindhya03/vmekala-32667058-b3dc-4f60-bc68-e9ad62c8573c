import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { LoginResponse, UserDto } from '@vmekala/data';
import { environment } from '../../environments/environment';

interface JwtPayload {
  sub: string;
  email: string;
  exp: number;
  iat: number;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly TOKEN_KEY = 'access_token';
  private readonly USER_KEY = 'user';
  private readonly API_URL = environment.API_URL;

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  /**
   * Login user with email and password
   * POST http://localhost:3000/api/auth/login
   */
  login(email: string, password: string): Observable<LoginResponse> {
    this.loadingSubject.next(true);

    return this.http
      .post<LoginResponse>(`${this.API_URL}/auth/login`, {
        email,
        password,
      })
      .pipe(
        tap((response) => {
          // Store access_token in localStorage
          localStorage.setItem(this.TOKEN_KEY, response.access_token);

          // Store user in localStorage
          localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));

          this.loadingSubject.next(false);
        })
      );
  }

  /**
   * Logout user
   * Remove access_token and user from localStorage
   * Redirect to /login
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.router.navigate(['/login']);
  }

  /**
   * Get current user from localStorage
   * Return user or null
   */
  getCurrentUser(): UserDto | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) {
      return null;
    }

    try {
      return JSON.parse(userStr) as UserDto;
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   * Return true if access_token exists, false otherwise
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired();
  }

  /**
   * Get access_token from localStorage
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Check if JWT token is expired
   * Use jwt_decode library to decode token
   * Check if exp < current timestamp
   */
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) {
      return true;
    }

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      console.error('Error decoding JWT token:', error);
      return true;
    }
  }
}
