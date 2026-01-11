import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    // Get JWT token from localStorage
    const token = this.authService.getToken();

    // Clone the request and add Authorization header if token exists
    // Only add token for requests to our API
    if (token && this.isApiRequest(request.url)) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    // Handle the request and catch errors
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Unauthorized - token expired or invalid
          // Logout and redirect to login page
          console.error('Authentication error: Session expired or invalid token');
          this.authService.logout();
        } else if (error.status === 403) {
          // Forbidden - user doesn't have permission
          console.error('Authorization error: Insufficient permissions');
          alert(
            'You do not have permission to perform this action. Please contact your administrator.'
          );
        }

        return throwError(() => error);
      })
    );
  }

  /**
   * Check if the request is to our API
   * This prevents adding auth header to external API calls
   */
  private isApiRequest(url: string): boolean {
    return url.startsWith(environment.API_URL) || url.startsWith('/api');
  }
}
