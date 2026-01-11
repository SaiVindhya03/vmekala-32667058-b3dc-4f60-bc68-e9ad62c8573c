import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuditLogDto } from '@vmekala/data';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuditService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.API_URL || 'http://localhost:3000/api'}/audit-logs`;

  /**
   * Get audit logs with optional filters
   */
  getAuditLogs(filters?: {
    resource?: 'Task' | 'User' | 'Organization';
    action?: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
    userId?: string;
  }): Observable<AuditLogDto[]> {
    let params = new HttpParams();
    
    if (filters?.resource) {
      params = params.set('resource', filters.resource);
    }
    if (filters?.action) {
      params = params.set('action', filters.action);
    }
    if (filters?.userId) {
      params = params.set('userId', filters.userId);
    }

    return this.http.get<AuditLogDto[]>(this.apiUrl, { params });
  }
}
