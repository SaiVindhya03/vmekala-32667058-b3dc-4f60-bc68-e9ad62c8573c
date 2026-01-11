import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { TaskListComponent } from '../../src/app/pages/dashboard/task-list/task-list.component';
import { TaskDto, TaskStatus } from '@vmekala/data';
import * as TaskActions from '../../src/app/store/task/task.actions';
import * as TaskSelectors from '../../src/app/store/task/task.selectors';

describe('TaskListComponent', () => {
  let component: TaskListComponent;
  let fixture: ComponentFixture<TaskListComponent>;
  let store: MockStore;

  const mockTasks: TaskDto[] = [
    {
      id: '1',
      title: 'Test Task 1',
      description: 'Description 1',
      status: TaskStatus.TODO,
      category: 'Work',
      userId: 'user-1',
      organizationId: 'org-1',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: '2',
      title: 'Test Task 2',
      description: 'Description 2',
      status: TaskStatus.IN_PROGRESS,
      category: 'Personal',
      userId: 'user-1',
      organizationId: 'org-1',
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
    },
    {
      id: '3',
      title: 'Test Task 3',
      description: 'Description 3',
      status: TaskStatus.DONE,
      category: 'Work',
      userId: 'user-1',
      organizationId: 'org-1',
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-03'),
    },
  ];

  const initialState = {
    tasks: {
      tasks: mockTasks,
      loading: false,
      error: null,
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskListComponent, FormsModule],
      providers: [provideMockStore({ initialState })],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(TaskListComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should dispatch loadTasks action on init', () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      fixture.detectChanges(); // Triggers ngOnInit

      expect(dispatchSpy).toHaveBeenCalledWith(TaskActions.loadTasks());
    });

    it('should extract categories from tasks', (done) => {
      fixture.detectChanges();

      setTimeout(() => {
        expect(component.categories).toContain('Work');
        expect(component.categories).toContain('Personal');
        expect(component.categories.length).toBe(2);
        done();
      }, 10);
    });

    it('should apply filters and sort on init', (done) => {
      fixture.detectChanges();

      setTimeout(() => {
        expect(component.displayedTasks.length).toBe(3);
        done();
      }, 10);
    });
  });

  describe('extractCategories', () => {
    it('should extract unique categories from tasks', () => {
      component.extractCategories(mockTasks);

      expect(component.categories).toEqual(['Personal', 'Work']);
    });

    it('should handle empty task list', () => {
      component.extractCategories([]);

      expect(component.categories).toEqual([]);
    });

    it('should filter out undefined categories', () => {
      const tasksWithoutCategory = [
        { ...mockTasks[0], category: '' },
        { ...mockTasks[1], category: 'Work' },
      ];

      component.extractCategories(tasksWithoutCategory as TaskDto[]);

      expect(component.categories).toEqual(['Work']);
    });
  });

  describe('applyFiltersAndSort', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter tasks by status', () => {
      component.selectedStatus = TaskStatus.TODO;
      component.applyFiltersAndSort(mockTasks);

      expect(component.displayedTasks.length).toBe(1);
      expect(component.displayedTasks[0].status).toBe(TaskStatus.TODO);
    });

    it('should filter tasks by category', () => {
      component.selectedCategory = 'Work';
      component.applyFiltersAndSort(mockTasks);

      expect(component.displayedTasks.length).toBe(2);
      expect(component.displayedTasks.every((t) => t.category === 'Work')).toBe(true);
    });

    it('should filter tasks by search query', () => {
      component.searchQuery = 'Task 2';
      component.applyFiltersAndSort(mockTasks);

      expect(component.displayedTasks.length).toBe(1);
      expect(component.displayedTasks[0].title).toBe('Test Task 2');
    });

    it('should apply case-insensitive search', () => {
      component.searchQuery = 'test';
      component.applyFiltersAndSort(mockTasks);

      expect(component.displayedTasks.length).toBe(3);
    });

    it('should apply multiple filters together', () => {
      component.selectedStatus = TaskStatus.TODO;
      component.selectedCategory = 'Work';
      component.applyFiltersAndSort(mockTasks);

      expect(component.displayedTasks.length).toBe(1);
      expect(component.displayedTasks[0].id).toBe('1');
    });

    it('should return all tasks when no filters are applied', () => {
      component.applyFiltersAndSort(mockTasks);

      expect(component.displayedTasks.length).toBe(3);
    });
  });

  describe('sortTasks', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should sort tasks by title ascending', () => {
      component.sortField = 'title';
      component.sortDirection = 'asc';
      const sorted = component.sortTasks([...mockTasks]);

      expect(sorted[0].title).toBe('Test Task 1');
      expect(sorted[2].title).toBe('Test Task 3');
    });

    it('should sort tasks by title descending', () => {
      component.sortField = 'title';
      component.sortDirection = 'desc';
      const sorted = component.sortTasks([...mockTasks]);

      expect(sorted[0].title).toBe('Test Task 3');
      expect(sorted[2].title).toBe('Test Task 1');
    });

    it('should sort tasks by status', () => {
      component.sortField = 'status';
      component.sortDirection = 'asc';
      const sorted = component.sortTasks([...mockTasks]);

      expect(sorted[0].status).toBe(TaskStatus.DONE);
    });

    it('should sort tasks by createdAt descending', () => {
      component.sortField = 'createdAt';
      component.sortDirection = 'desc';
      const sorted = component.sortTasks([...mockTasks]);

      expect(sorted[0].id).toBe('3'); // Most recent
      expect(sorted[2].id).toBe('1'); // Oldest
    });

    it('should sort tasks by createdAt ascending', () => {
      component.sortField = 'createdAt';
      component.sortDirection = 'asc';
      const sorted = component.sortTasks([...mockTasks]);

      expect(sorted[0].id).toBe('1'); // Oldest
      expect(sorted[2].id).toBe('3'); // Most recent
    });
  });

  describe('onSort', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should toggle sort direction when clicking same field', () => {
      component.sortField = 'title';
      component.sortDirection = 'asc';

      component.onSort('title');

      expect(component.sortDirection).toBe('desc');
    });

    it('should set sort field and default to ascending when clicking new field', () => {
      component.sortField = 'title';
      component.sortDirection = 'desc';

      component.onSort('status');

      expect(component.sortField).toBe('status');
      expect(component.sortDirection).toBe('asc');
    });
  });

  describe('resetFilters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear all filters', () => {
      component.selectedStatus = TaskStatus.TODO;
      component.selectedCategory = 'Work';
      component.searchQuery = 'test';

      component.resetFilters();

      expect(component.selectedStatus).toBe('');
      expect(component.selectedCategory).toBe('');
      expect(component.searchQuery).toBe('');
    });
  });

  describe('Modal Management', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should open create modal', () => {
      component.openCreateModal();

      expect(component.showCreateModal).toBe(true);
      expect(component.formMode).toBe('create');
      expect(component.selectedTask).toBeNull();
    });

    it('should open edit modal with selected task', () => {
      const task = mockTasks[0];
      component.openEditModal(task);

      expect(component.showEditModal).toBe(true);
      expect(component.formMode).toBe('edit');
      expect(component.selectedTask).toBe(task);
    });

    it('should close form modal', () => {
      component.showEditModal = true;
      component.showCreateModal = true;
      component.selectedTask = mockTasks[0];

      component.closeFormModal();

      expect(component.showEditModal).toBe(false);
      expect(component.showCreateModal).toBe(false);
      expect(component.selectedTask).toBeNull();
    });

    it('should open view modal with selected task', () => {
      const task = mockTasks[0];
      component.openViewModal(task);

      expect(component.showViewModal).toBe(true);
      expect(component.selectedTask).toBe(task);
    });

    it('should close view modal', () => {
      component.showViewModal = true;
      component.selectedTask = mockTasks[0];

      component.closeViewModal();

      expect(component.showViewModal).toBe(false);
      expect(component.selectedTask).toBeNull();
    });

    it('should open delete confirmation with selected task', () => {
      const task = mockTasks[0];
      component.openDeleteConfirm(task);

      expect(component.showDeleteConfirm).toBe(true);
      expect(component.selectedTask).toBe(task);
    });

    it('should close delete confirmation', () => {
      component.showDeleteConfirm = true;
      component.selectedTask = mockTasks[0];

      component.closeDeleteConfirm();

      expect(component.showDeleteConfirm).toBe(false);
      expect(component.selectedTask).toBeNull();
    });
  });

  describe('onTaskSaved', () => {
    it('should dispatch loadTasks action and close modal', () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      component.showEditModal = true;

      component.onTaskSaved(mockTasks[0]);

      expect(dispatchSpy).toHaveBeenCalledWith(TaskActions.loadTasks());
      expect(component.showEditModal).toBe(false);
      expect(component.showCreateModal).toBe(false);
    });
  });

  describe('deleteTask', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should dispatch deleteTask action', () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      component.selectedTask = mockTasks[0];

      component.deleteTask();

      expect(dispatchSpy).toHaveBeenCalledWith(
        TaskActions.deleteTask({ id: mockTasks[0].id })
      );
      expect(component.showDeleteConfirm).toBe(false);
    });

    it('should not dispatch action when no task is selected', () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      component.selectedTask = null;

      component.deleteTask();

      expect(dispatchSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: '[Task] Delete Task' })
      );
    });
  });

  describe('getStatusBadgeClass', () => {
    it('should return correct class for TODO status', () => {
      const result = component.getStatusBadgeClass(TaskStatus.TODO);
      expect(result).toBe('bg-gray-100 text-gray-800');
    });

    it('should return correct class for IN_PROGRESS status', () => {
      const result = component.getStatusBadgeClass(TaskStatus.IN_PROGRESS);
      expect(result).toBe('bg-blue-100 text-blue-800');
    });

    it('should return correct class for DONE status', () => {
      const result = component.getStatusBadgeClass(TaskStatus.DONE);
      expect(result).toBe('bg-green-100 text-green-800');
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

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T00:00:00');
      const formatted = component.formatDate(date);

      expect(formatted).toContain('Jan');
      expect(formatted).toContain('2024');
      // Date might be 14 or 15 depending on timezone
      expect(formatted).toMatch(/14|15/);
    });
  });

  describe('getSortIndicator', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return up arrow for ascending sort', () => {
      component.sortField = 'title';
      component.sortDirection = 'asc';

      expect(component.getSortIndicator('title')).toBe('↑');
    });

    it('should return down arrow for descending sort', () => {
      component.sortField = 'title';
      component.sortDirection = 'desc';

      expect(component.getSortIndicator('title')).toBe('↓');
    });

    it('should return empty string for non-sorted field', () => {
      component.sortField = 'title';

      expect(component.getSortIndicator('status')).toBe('');
    });
  });

  describe('createTask', () => {
    it('should open create modal', () => {
      component.createTask();

      expect(component.showCreateModal).toBe(true);
      expect(component.formMode).toBe('create');
    });
  });
});
