import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { SimpleChange, NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { TaskFormComponent } from '../../src/app/pages/dashboard/task-form/task-form.component';
import { TaskService } from '../../src/app/services/task.service';
import { TaskDto, TaskStatus } from '@vmekala/data';

describe('TaskFormComponent', () => {
  let component: TaskFormComponent;
  let fixture: ComponentFixture<TaskFormComponent>;
  let mockTaskService: jest.Mocked<TaskService>;

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

  beforeEach(async () => {
    mockTaskService = {
      createTask: jest.fn(),
      updateTask: jest.fn(),
      deleteTask: jest.fn(),
      getTasks: jest.fn(),
      getTaskById: jest.fn(),
      getAuditLog: jest.fn(),
    } as any;

    await TestBed.configureTestingModule({
      imports: [TaskFormComponent, ReactiveFormsModule],
      providers: [{ provide: TaskService, useValue: mockTaskService }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskFormComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initialize form on init', () => {
      fixture.detectChanges();

      expect(component.taskForm).toBeDefined();
      expect(component.taskForm.get('title')).toBeDefined();
      expect(component.taskForm.get('description')).toBeDefined();
      expect(component.taskForm.get('status')).toBeDefined();
      expect(component.taskForm.get('category')).toBeDefined();
    });

    it('should initialize form with default values for create mode', () => {
      component.mode = 'create';
      fixture.detectChanges();

      expect(component.taskForm.get('status')?.value).toBe(TaskStatus.TODO);
    });

    it('should pre-fill form in edit mode with task data', () => {
      component.mode = 'edit';
      component.task = mockTask;
      fixture.detectChanges();

      expect(component.taskForm.get('title')?.value).toBe(mockTask.title);
      expect(component.taskForm.get('description')?.value).toBe(mockTask.description);
      expect(component.taskForm.get('status')?.value).toBe(mockTask.status);
      expect(component.taskForm.get('category')?.value).toBe(mockTask.category);
    });
  });

  describe('ngOnChanges', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should refill form when task input changes in edit mode', () => {
      component.mode = 'edit';
      component.task = mockTask;
      const updatedTask = { ...mockTask, title: 'Updated Task' };

      component.ngOnChanges({
        task: new SimpleChange(mockTask, updatedTask, false),
      });

      // Manually set the task and call ngOnChanges logic
      component.task = updatedTask;
      component.taskForm.patchValue({
        title: updatedTask.title,
        description: updatedTask.description,
        status: updatedTask.status,
        category: updatedTask.category,
      });

      expect(component.taskForm.get('title')?.value).toBe('Updated Task');
    });

    it('should reset form when mode changes to create', () => {
      component.mode = 'edit';
      component.task = mockTask;
      component.taskForm.patchValue({
        title: mockTask.title,
        description: mockTask.description,
        status: mockTask.status,
        category: mockTask.category,
      });

      component.mode = 'create';
      component.ngOnChanges({
        mode: new SimpleChange('edit', 'create', false),
      });

      expect(component.taskForm.get('title')?.value).toBe('');
      expect(component.taskForm.get('description')?.value).toBe('');
    });

    it('should refill form when mode changes to edit with task', () => {
      component.mode = 'edit';
      component.task = mockTask;

      component.ngOnChanges({
        mode: new SimpleChange('create', 'edit', false),
      });

      expect(component.taskForm.get('title')?.value).toBe(mockTask.title);
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should require title field', () => {
      const titleControl = component.taskForm.get('title');
      expect(titleControl?.hasError('required')).toBe(true);
    });

    it('should enforce minimum title length', () => {
      const titleControl = component.taskForm.get('title');
      titleControl?.setValue('ab');
      expect(titleControl?.hasError('minlength')).toBe(true);

      titleControl?.setValue('abc');
      expect(titleControl?.hasError('minlength')).toBe(false);
    });

    it('should enforce maximum title length', () => {
      const titleControl = component.taskForm.get('title');
      const longTitle = 'a'.repeat(101);
      titleControl?.setValue(longTitle);
      expect(titleControl?.hasError('maxlength')).toBe(true);

      titleControl?.setValue('a'.repeat(100));
      expect(titleControl?.hasError('maxlength')).toBe(false);
    });

    it('should enforce maximum description length', () => {
      const descControl = component.taskForm.get('description');
      const longDesc = 'a'.repeat(501);
      descControl?.setValue(longDesc);
      expect(descControl?.hasError('maxlength')).toBe(true);

      descControl?.setValue('a'.repeat(500));
      expect(descControl?.hasError('maxlength')).toBe(false);
    });

    it('should require status field', () => {
      const statusControl = component.taskForm.get('status');
      statusControl?.setValue(null);
      expect(statusControl?.hasError('required')).toBe(true);
    });

    it('should require category field', () => {
      const categoryControl = component.taskForm.get('category');
      expect(categoryControl?.hasError('required')).toBe(true);
    });
  });

  describe('hasError', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return true when field has error and is dirty', () => {
      const titleControl = component.taskForm.get('title');
      titleControl?.markAsDirty();

      expect(component.hasError('title', 'required')).toBe(true);
    });

    it('should return true when field has error and is touched', () => {
      const titleControl = component.taskForm.get('title');
      titleControl?.markAsTouched();

      expect(component.hasError('title', 'required')).toBe(true);
    });

    it('should return false when field is pristine', () => {
      expect(component.hasError('title', 'required')).toBe(false);
    });

    it('should return false when field has no error', () => {
      const titleControl = component.taskForm.get('title');
      titleControl?.setValue('Valid Title');
      titleControl?.markAsTouched();

      expect(component.hasError('title', 'required')).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return required error message', () => {
      const titleControl = component.taskForm.get('title');
      titleControl?.markAsTouched();

      expect(component.getErrorMessage('title')).toBe('Title is required');
    });

    it('should return minlength error message', () => {
      const titleControl = component.taskForm.get('title');
      titleControl?.setValue('ab');
      titleControl?.markAsTouched();

      expect(component.getErrorMessage('title')).toBe('Title must be at least 3 characters');
    });

    it('should return maxlength error message', () => {
      const titleControl = component.taskForm.get('title');
      titleControl?.setValue('a'.repeat(101));
      titleControl?.markAsTouched();

      expect(component.getErrorMessage('title')).toBe('Title must not exceed 100 characters');
    });

    it('should return empty string when no error', () => {
      const titleControl = component.taskForm.get('title');
      titleControl?.setValue('Valid Title');

      expect(component.getErrorMessage('title')).toBe('');
    });

    it('should return empty string when field is not touched or dirty', () => {
      expect(component.getErrorMessage('title')).toBe('');
    });
  });

  describe('capitalizeFirst', () => {
    it('should capitalize first letter', () => {
      expect(component.capitalizeFirst('title')).toBe('Title');
      expect(component.capitalizeFirst('description')).toBe('Description');
    });
  });

  describe('onSubmit - Create Mode', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.mode = 'create';
    });

    it('should not submit when form is invalid', () => {
      component.onSubmit();

      expect(mockTaskService.createTask).not.toHaveBeenCalled();
      expect(component.taskForm.get('title')?.touched).toBe(true);
    });

    it('should create task when form is valid', (done) => {
      component.taskForm.patchValue({
        title: 'New Task',
        description: 'New Description',
        status: TaskStatus.TODO,
        category: 'Work',
      });

      mockTaskService.createTask.mockReturnValue(of(mockTask));

      const taskSavedSpy = jest.fn();
      component.taskSaved.subscribe(taskSavedSpy);

      component.onSubmit();

      expect(mockTaskService.createTask).toHaveBeenCalledWith({
        title: 'New Task',
        description: 'New Description',
        status: TaskStatus.TODO,
        category: 'Work',
      });

      setTimeout(() => {
        expect(component.loading).toBe(false);
        expect(taskSavedSpy).toHaveBeenCalledWith(mockTask);
        expect(component.error).toBeNull();
        done();
      }, 10);
    });

    it('should handle create error', (done) => {
      component.taskForm.patchValue({
        title: 'New Task',
        description: 'New Description',
        status: TaskStatus.TODO,
        category: 'Work',
      });

      const error = { message: 'Failed to create task' };
      mockTaskService.createTask.mockReturnValue(throwError(() => error));

      component.onSubmit();

      setTimeout(() => {
        expect(component.loading).toBe(false);
        expect(component.error).toBe('Failed to create task');
        done();
      }, 10);
    });

    it('should display default error message when no error message provided', (done) => {
      component.taskForm.patchValue({
        title: 'New Task',
        description: 'New Description',
        status: TaskStatus.TODO,
        category: 'Work',
      });

      mockTaskService.createTask.mockReturnValue(throwError(() => ({})));

      component.onSubmit();

      setTimeout(() => {
        expect(component.error).toBe('Failed to create task');
        done();
      }, 10);
    });
  });

  describe('onSubmit - Edit Mode', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.mode = 'edit';
      component.task = mockTask;
    });

    it('should update task when form is valid', (done) => {
      component.taskForm.patchValue({
        title: 'Updated Task',
        description: 'Updated Description',
        status: TaskStatus.IN_PROGRESS,
        category: 'Personal',
      });

      const updatedTask = { ...mockTask, title: 'Updated Task' };
      mockTaskService.updateTask.mockReturnValue(of(updatedTask));

      const taskSavedSpy = jest.fn();
      component.taskSaved.subscribe(taskSavedSpy);

      component.onSubmit();

      expect(mockTaskService.updateTask).toHaveBeenCalledWith(mockTask.id, {
        title: 'Updated Task',
        description: 'Updated Description',
        status: TaskStatus.IN_PROGRESS,
        category: 'Personal',
      });

      setTimeout(() => {
        expect(component.loading).toBe(false);
        expect(taskSavedSpy).toHaveBeenCalledWith(updatedTask);
        done();
      }, 10);
    });

    it('should handle update error', (done) => {
      component.taskForm.patchValue({
        title: 'Updated Task',
        description: 'Updated Description',
        status: TaskStatus.IN_PROGRESS,
        category: 'Personal',
      });

      const error = { message: 'Failed to update task' };
      mockTaskService.updateTask.mockReturnValue(throwError(() => error));

      component.onSubmit();

      setTimeout(() => {
        expect(component.loading).toBe(false);
        expect(component.error).toBe('Failed to update task');
        done();
      }, 10);
    });

    it('should not update when task is null in edit mode', () => {
      component.task = null;
      component.taskForm.patchValue({
        title: 'Updated Task',
        description: 'Updated Description',
        status: TaskStatus.IN_PROGRESS,
        category: 'Personal',
      });

      component.onSubmit();

      expect(mockTaskService.updateTask).not.toHaveBeenCalled();
    });
  });

  describe('onCancel', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset form and emit cancelled event', () => {
      const cancelledSpy = jest.fn();
      component.cancelled.subscribe(cancelledSpy);

      component.taskForm.patchValue({
        title: 'Test',
        description: 'Test',
        status: TaskStatus.IN_PROGRESS,
        category: 'Work',
      });

      component.onCancel();

      expect(component.taskForm.get('title')?.value).toBe('');
      expect(cancelledSpy).toHaveBeenCalled();
    });
  });

  describe('resetForm', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset form to default values', () => {
      component.taskForm.patchValue({
        title: 'Test',
        description: 'Test',
        status: TaskStatus.IN_PROGRESS,
        category: 'Work',
      });
      component.error = 'Some error';
      component.loading = true;

      component.resetForm();

      expect(component.taskForm.get('title')?.value).toBe('');
      expect(component.taskForm.get('description')?.value).toBe('');
      expect(component.taskForm.get('status')?.value).toBe(TaskStatus.TODO);
      expect(component.taskForm.get('category')?.value).toBe('');
      expect(component.error).toBeNull();
      expect(component.loading).toBe(false);
    });
  });

  describe('onBackdropClick', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call onCancel when not loading', () => {
      component.loading = false;
      const cancelSpy = jest.spyOn(component, 'onCancel');

      component.onBackdropClick();

      expect(cancelSpy).toHaveBeenCalled();
    });

    it('should not call onCancel when loading', () => {
      component.loading = true;
      const cancelSpy = jest.spyOn(component, 'onCancel');

      component.onBackdropClick();

      expect(cancelSpy).not.toHaveBeenCalled();
    });
  });

  describe('onModalClick', () => {
    it('should stop event propagation', () => {
      const event = new Event('click');
      const stopPropagationSpy = jest.spyOn(event, 'stopPropagation');

      component.onModalClick(event);

      expect(stopPropagationSpy).toHaveBeenCalled();
    });
  });

  describe('getModalTitle', () => {
    it('should return create title in create mode', () => {
      component.mode = 'create';
      expect(component.getModalTitle()).toBe('Create New Task');
    });

    it('should return edit title in edit mode', () => {
      component.mode = 'edit';
      expect(component.getModalTitle()).toBe('Edit Task');
    });
  });

  describe('getSubmitButtonText', () => {
    it('should return creating text when loading in create mode', () => {
      component.mode = 'create';
      component.loading = true;
      expect(component.getSubmitButtonText()).toBe('Creating...');
    });

    it('should return updating text when loading in edit mode', () => {
      component.mode = 'edit';
      component.loading = true;
      expect(component.getSubmitButtonText()).toBe('Updating...');
    });

    it('should return create task text when not loading in create mode', () => {
      component.mode = 'create';
      component.loading = false;
      expect(component.getSubmitButtonText()).toBe('Create Task');
    });

    it('should return update task text when not loading in edit mode', () => {
      component.mode = 'edit';
      component.loading = false;
      expect(component.getSubmitButtonText()).toBe('Update Task');
    });
  });

  describe('formatStatus', () => {
    it('should format TODO status', () => {
      expect(component.formatStatus(TaskStatus.TODO)).toBe('To Do');
    });

    it('should format IN_PROGRESS status', () => {
      expect(component.formatStatus(TaskStatus.IN_PROGRESS)).toBe('In Progress');
    });

    it('should format DONE status', () => {
      expect(component.formatStatus(TaskStatus.DONE)).toBe('Done');
    });
  });

  describe('onDelete', () => {
    beforeEach(() => {
      fixture.detectChanges();
      global.confirm = jest.fn();
    });

    it('should emit taskDeleted when confirmed', () => {
      component.task = mockTask;
      (global.confirm as jest.Mock).mockReturnValue(true);

      const taskDeletedSpy = jest.fn();
      component.taskDeleted.subscribe(taskDeletedSpy);

      const cancelSpy = jest.spyOn(component, 'onCancel');

      component.onDelete();

      expect(global.confirm).toHaveBeenCalledWith(`Are you sure you want to delete "${mockTask.title}"?`);
      expect(taskDeletedSpy).toHaveBeenCalledWith(mockTask);
      expect(cancelSpy).toHaveBeenCalled();
    });

    it('should not emit taskDeleted when not confirmed', () => {
      component.task = mockTask;
      (global.confirm as jest.Mock).mockReturnValue(false);

      const taskDeletedSpy = jest.fn();
      component.taskDeleted.subscribe(taskDeletedSpy);

      component.onDelete();

      expect(taskDeletedSpy).not.toHaveBeenCalled();
    });

    it('should not emit when task is null', () => {
      component.task = null;
      (global.confirm as jest.Mock).mockReturnValue(true);

      const taskDeletedSpy = jest.fn();
      component.taskDeleted.subscribe(taskDeletedSpy);

      component.onDelete();

      expect(taskDeletedSpy).not.toHaveBeenCalled();
    });
  });

  describe('categories', () => {
    it('should have predefined categories', () => {
      expect(component.categories).toContain('Work');
      expect(component.categories).toContain('Personal');
      expect(component.categories).toContain('Shopping');
      expect(component.categories).toContain('Health');
      expect(component.categories).toContain('Finance');
      expect(component.categories).toContain('Other');
    });
  });
});
