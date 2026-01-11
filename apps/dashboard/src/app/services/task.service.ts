import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import {
  TaskDto,
  CreateTaskDto,
  UpdateTaskDto,
  AuditLogDto,
  TaskStatus,
} from '@vmekala/data';
import { environment } from '../../environments/environment';

interface TaskFilters {
  status?: TaskStatus;
  category?: string;
}

interface AuditLogFilters {
  userId?: string;
  action?: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
  resource?: 'Task' | 'User' | 'Organization';
  resourceId?: string;
}

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = environment.API_URL;

  /**
   * Get all tasks with optional filters
   * GET /tasks?status=todo&category=Work
   */
  getTasks(filters?: TaskFilters): Observable<TaskDto[]> {
    let params = new HttpParams();

    if (filters) {
      if (filters.status) {
        params = params.set('status', filters.status);
      }
      if (filters.category) {
        params = params.set('category', filters.category);
      }
    }

    return this.http
      .get<TaskDto[]>(`${this.API_URL}/tasks`, { params })
      .pipe(
        catchError((error) => {
          console.error('Error fetching tasks:', error);
          return throwError(
            () => new Error('Failed to fetch tasks. Please try again later.')
          );
        })
      );
  }

  /**
   * Get a single task by ID
   * GET /tasks/:id
   */
  getTaskById(id: string): Observable<TaskDto> {
    return this.http.get<TaskDto>(`${this.API_URL}/tasks/${id}`).pipe(
      catchError((error) => {
        console.error(`Error fetching task ${id}:`, error);
        return throwError(
          () => new Error('Failed to fetch task. Please try again later.')
        );
      })
    );
  }

  /**
   * Create a new task
   * POST /tasks
   * Body: { title, description, status?, category? }
   */
  createTask(task: CreateTaskDto): Observable<TaskDto> {
    return this.http.post<TaskDto>(`${this.API_URL}/tasks`, task).pipe(
      catchError((error) => {
        console.error('Error creating task:', error);
        return throwError(
          () => new Error('Failed to create task. Please try again later.')
        );
      })
    );
  }

  /**
   * Update an existing task
   * PUT /tasks/:id
   * Body: { title?, description?, status?, category? }
   */
  updateTask(id: string, updates: UpdateTaskDto): Observable<TaskDto> {
    return this.http.put<TaskDto>(`${this.API_URL}/tasks/${id}`, updates).pipe(
      catchError((error) => {
        console.error(`Error updating task ${id}:`, error);
        return throwError(
          () => new Error('Failed to update task. Please try again later.')
        );
      })
    );
  }

  /**
   * Delete a task
   * DELETE /tasks/:id
   */
  deleteTask(id: string): Observable<{ success: boolean }> {
    return this.http
      .delete<{ success: boolean }>(`${this.API_URL}/tasks/${id}`)
      .pipe(
        catchError((error) => {
          console.error(`Error deleting task ${id}:`, error);
          return throwError(
            () => new Error('Failed to delete task. Please try again later.')
          );
        })
      );
  }

  /**
   * Get audit log with optional filters
   * GET /audit-log?userId=xxx&action=CREATE
   */
  getAuditLog(filters?: AuditLogFilters): Observable<AuditLogDto[]> {
    let params = new HttpParams();

    if (filters) {
      if (filters.userId) {
        params = params.set('userId', filters.userId);
      }
      if (filters.action) {
        params = params.set('action', filters.action);
      }
      if (filters.resource) {
        params = params.set('resource', filters.resource);
      }
      if (filters.resourceId) {
        params = params.set('resourceId', filters.resourceId);
      }
    }

    return this.http
      .get<AuditLogDto[]>(`${this.API_URL}/audit-log`, { params })
      .pipe(
        catchError((error) => {
          console.error('Error fetching audit log:', error);
          return throwError(
            () =>
              new Error('Failed to fetch audit log. Please try again later.')
          );
        })
      );
  }
}
