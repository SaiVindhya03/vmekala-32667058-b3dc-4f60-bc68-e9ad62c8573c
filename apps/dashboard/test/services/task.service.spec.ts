import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TaskService } from '../../src/app/services/task.service';
import { TaskDto, CreateTaskDto, UpdateTaskDto, TaskStatus } from '@vmekala/data';
import { environment } from '../../src/environments/environment';

describe('TaskService', () => {
  let service: TaskService;
  let httpMock: HttpTestingController;

  const mockTask: TaskDto = {
    id: '1',
    title: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.TODO,
    category: 'Work',
    userId: 'user-1',
    organizationId: 'org-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTasks: TaskDto[] = [
    mockTask,
    {
      ...mockTask,
      id: '2',
      title: 'Test Task 2',
      status: TaskStatus.IN_PROGRESS,
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TaskService],
    });

    service = TestBed.inject(TaskService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getTasks', () => {
    it('should retrieve all tasks without filters', (done) => {
      service.getTasks().subscribe({
        next: (tasks) => {
          expect(tasks).toEqual(mockTasks);
          expect(tasks.length).toBe(2);
          done();
        },
      });

      const req = httpMock.expectOne(`${environment.API_URL}/tasks`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTasks);
    });

    it('should retrieve tasks with status filter', (done) => {
      service.getTasks({ status: TaskStatus.TODO }).subscribe({
        next: (tasks) => {
          expect(tasks).toBeTruthy();
          done();
        },
      });

      const req = httpMock.expectOne((request) => {
        return request.url === `${environment.API_URL}/tasks` &&
               request.params.get('status') === TaskStatus.TODO;
      });
      expect(req.request.method).toBe('GET');
      req.flush([mockTask]);
    });

    it('should retrieve tasks with category filter', (done) => {
      service.getTasks({ category: 'Work' }).subscribe({
        next: (tasks) => {
          expect(tasks).toBeTruthy();
          done();
        },
      });

      const req = httpMock.expectOne((request) => {
        return request.url === `${environment.API_URL}/tasks` &&
               request.params.get('category') === 'Work';
      });
      expect(req.request.method).toBe('GET');
      req.flush([mockTask]);
    });

    it('should handle error when fetching tasks', (done) => {
      service.getTasks().subscribe({
        error: (error) => {
          expect(error.message).toContain('Failed to fetch tasks');
          done();
        },
      });

      const req = httpMock.expectOne(`${environment.API_URL}/tasks`);
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('getTaskById', () => {
    it('should retrieve a single task by ID', (done) => {
      const taskId = '1';

      service.getTaskById(taskId).subscribe({
        next: (task) => {
          expect(task).toEqual(mockTask);
          expect(task.id).toBe(taskId);
          done();
        },
      });

      const req = httpMock.expectOne(`${environment.API_URL}/tasks/${taskId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTask);
    });

    it('should handle error when fetching task by ID', (done) => {
      const taskId = '999';

      service.getTaskById(taskId).subscribe({
        error: (error) => {
          expect(error.message).toContain('Failed to fetch task');
          done();
        },
      });

      const req = httpMock.expectOne(`${environment.API_URL}/tasks/${taskId}`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('createTask', () => {
    it('should create a new task', (done) => {
      const newTask: CreateTaskDto = {
        title: 'New Task',
        description: 'New Description',
        status: TaskStatus.TODO,
        category: 'Work',
      };

      service.createTask(newTask).subscribe({
        next: (task) => {
          expect(task.title).toBe(newTask.title);
          expect(task.description).toBe(newTask.description);
          done();
        },
      });

      const req = httpMock.expectOne(`${environment.API_URL}/tasks`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newTask);
      req.flush({ ...mockTask, ...newTask });
    });

    it('should handle error when creating task', (done) => {
      const newTask: CreateTaskDto = {
        title: 'New Task',
        description: 'New Description',
        status: TaskStatus.TODO,
        category: 'Work',
      };

      service.createTask(newTask).subscribe({
        error: (error) => {
          expect(error.message).toContain('Failed to create task');
          done();
        },
      });

      const req = httpMock.expectOne(`${environment.API_URL}/tasks`);
      req.flush('Error', { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('updateTask', () => {
    it('should update an existing task', (done) => {
      const taskId = '1';
      const updates: UpdateTaskDto = {
        title: 'Updated Task',
        status: TaskStatus.DONE,
      };

      service.updateTask(taskId, updates).subscribe({
        next: (task) => {
          expect(task.title).toBe(updates.title);
          expect(task.status).toBe(updates.status);
          done();
        },
      });

      const req = httpMock.expectOne(`${environment.API_URL}/tasks/${taskId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updates);
      req.flush({ ...mockTask, ...updates });
    });

    it('should handle error when updating task', (done) => {
      const taskId = '1';
      const updates: UpdateTaskDto = {
        title: 'Updated Task',
      };

      service.updateTask(taskId, updates).subscribe({
        error: (error) => {
          expect(error.message).toContain('Failed to update task');
          done();
        },
      });

      const req = httpMock.expectOne(`${environment.API_URL}/tasks/${taskId}`);
      req.flush('Error', { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('deleteTask', () => {
    it('should delete a task', (done) => {
      const taskId = '1';

      service.deleteTask(taskId).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          done();
        },
      });

      const req = httpMock.expectOne(`${environment.API_URL}/tasks/${taskId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });

    it('should handle error when deleting task', (done) => {
      const taskId = '1';

      service.deleteTask(taskId).subscribe({
        error: (error) => {
          expect(error.message).toContain('Failed to delete task');
          done();
        },
      });

      const req = httpMock.expectOne(`${environment.API_URL}/tasks/${taskId}`);
      req.flush('Error', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('getAuditLog', () => {
    it('should retrieve audit logs without filters', (done) => {
      const mockAuditLogs = [
        {
          id: '1',
          action: 'CREATE' as const,
          resource: 'Task' as const,
          resourceId: 'task-1',
          userId: 'user-1',
          organizationId: 'org-1',
          metadata: {},
          createdAt: new Date(),
        },
      ];

      service.getAuditLog().subscribe({
        next: (logs) => {
          expect(logs).toEqual(mockAuditLogs);
          done();
        },
      });

      const req = httpMock.expectOne(`${environment.API_URL}/audit-log`);
      expect(req.request.method).toBe('GET');
      req.flush(mockAuditLogs);
    });

    it('should retrieve audit logs with filters', (done) => {
      service.getAuditLog({ userId: 'user-1', action: 'CREATE' }).subscribe({
        next: (logs) => {
          expect(logs).toBeTruthy();
          done();
        },
      });

      const req = httpMock.expectOne((request) => {
        return request.url === `${environment.API_URL}/audit-log` &&
               request.params.get('userId') === 'user-1' &&
               request.params.get('action') === 'CREATE';
      });
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('should handle error when fetching audit logs', (done) => {
      service.getAuditLog().subscribe({
        error: (error) => {
          expect(error.message).toContain('Failed to fetch audit log');
          done();
        },
      });

      const req = httpMock.expectOne(`${environment.API_URL}/audit-log`);
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });
});
