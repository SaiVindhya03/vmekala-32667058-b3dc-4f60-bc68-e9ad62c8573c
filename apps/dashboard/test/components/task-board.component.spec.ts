import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { TaskBoardComponent } from '../../src/app/pages/dashboard/task-board/task-board.component';
import { TaskDto, TaskStatus } from '@vmekala/data';
import * as TaskActions from '../../src/app/store/task/task.actions';
import * as TaskSelectors from '../../src/app/store/task/task.selectors';

describe('TaskBoardComponent', () => {
  let component: TaskBoardComponent;
  let fixture: ComponentFixture<TaskBoardComponent>;
  let store: MockStore;

  const mockTasks: TaskDto[] = [
    {
      id: '1',
      title: 'Task 1',
      description: 'Description 1',
      status: TaskStatus.TODO,
      category: 'Work',
      userId: 'user-1',
      organizationId: 'org-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      title: 'Task 2',
      description: 'Description 2',
      status: TaskStatus.IN_PROGRESS,
      category: 'Personal',
      userId: 'user-1',
      organizationId: 'org-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      title: 'Task 3',
      description: 'Description 3',
      status: TaskStatus.DONE,
      category: 'Work',
      userId: 'user-1',
      organizationId: 'org-1',
      createdAt: new Date(),
      updatedAt: new Date(),
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
      imports: [TaskBoardComponent, DragDropModule],
      providers: [provideMockStore({ initialState })],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(TaskBoardComponent);
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

      fixture.detectChanges();

      expect(dispatchSpy).toHaveBeenCalledWith(TaskActions.loadTasks());
    });

    it('should organize tasks into columns', (done) => {
      fixture.detectChanges();

      setTimeout(() => {
        const todoColumn = component.columns.find((c) => c.status === TaskStatus.TODO);
        const inProgressColumn = component.columns.find((c) => c.status === TaskStatus.IN_PROGRESS);
        const doneColumn = component.columns.find((c) => c.status === TaskStatus.DONE);

        expect(todoColumn?.tasks.length).toBe(1);
        expect(inProgressColumn?.tasks.length).toBe(1);
        expect(doneColumn?.tasks.length).toBe(1);
        done();
      }, 10);
    });

    it('should initialize columns with correct properties', () => {
      fixture.detectChanges();

      expect(component.columns.length).toBe(3);
      expect(component.columns[0].id).toBe('todo');
      expect(component.columns[0].status).toBe(TaskStatus.TODO);
      expect(component.columns[1].id).toBe('in-progress');
      expect(component.columns[1].status).toBe(TaskStatus.IN_PROGRESS);
      expect(component.columns[2].id).toBe('done');
      expect(component.columns[2].status).toBe(TaskStatus.DONE);
    });
  });

  describe('organizeTasks', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should organize tasks by status', () => {
      component.organizeTasks(mockTasks);

      const todoColumn = component.columns.find((c) => c.status === TaskStatus.TODO);
      const inProgressColumn = component.columns.find((c) => c.status === TaskStatus.IN_PROGRESS);
      const doneColumn = component.columns.find((c) => c.status === TaskStatus.DONE);

      expect(todoColumn?.tasks[0].id).toBe('1');
      expect(inProgressColumn?.tasks[0].id).toBe('2');
      expect(doneColumn?.tasks[0].id).toBe('3');
    });

    it('should clear existing tasks before organizing', () => {
      component.columns[0].tasks = [mockTasks[0], mockTasks[1]];

      component.organizeTasks([mockTasks[0]]);

      const todoColumn = component.columns.find((c) => c.status === TaskStatus.TODO);
      expect(todoColumn?.tasks.length).toBe(1);
    });

    it('should handle empty task list', () => {
      component.organizeTasks([]);

      component.columns.forEach((col) => {
        expect(col.tasks.length).toBe(0);
      });
    });

    it('should handle tasks with no matching column', () => {
      const customTask = { ...mockTasks[0], status: 'CUSTOM' as TaskStatus };

      expect(() => {
        component.organizeTasks([customTask]);
      }).not.toThrow();
    });
  });

  describe('onDrop', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.organizeTasks(mockTasks);
    });

    it('should reorder tasks within the same column', () => {
      const todoColumn = component.columns[0];
      const task1 = { ...mockTasks[0] };
      const task2 = { ...mockTasks[0], id: '4', title: 'Task 4' };
      todoColumn.tasks = [task1, task2];

      const event = {
        previousContainer: { data: todoColumn.tasks },
        container: { data: todoColumn.tasks },
        previousIndex: 0,
        currentIndex: 1,
      } as CdkDragDrop<TaskDto[]>;

      const dispatchSpy = jest.spyOn(store, 'dispatch');

      component.onDrop(event);

      // Should not dispatch update since it's just reordering
      expect(todoColumn.tasks[0]).toBe(task2);
      expect(todoColumn.tasks[1]).toBe(task1);
    });

    it('should move task to different column and update status', () => {
      const todoColumn = component.columns[0];
      const inProgressColumn = component.columns[1];
      const task = mockTasks[0];

      const event = {
        previousContainer: { data: todoColumn.tasks },
        container: { data: inProgressColumn.tasks },
        previousIndex: 0,
        currentIndex: 0,
      } as CdkDragDrop<TaskDto[]>;

      const dispatchSpy = jest.spyOn(store, 'dispatch');

      component.onDrop(event);

      expect(dispatchSpy).toHaveBeenCalledWith(
        TaskActions.updateTask({
          id: task.id,
          updates: { status: TaskStatus.IN_PROGRESS },
        })
      );
    });

    it('should handle drop when task is not found', () => {
      const todoColumn = component.columns[0];
      const inProgressColumn = component.columns[1];
      todoColumn.tasks = [];

      const event = {
        previousContainer: { data: todoColumn.tasks },
        container: { data: inProgressColumn.tasks },
        previousIndex: 0,
        currentIndex: 0,
      } as CdkDragDrop<TaskDto[]>;

      expect(() => {
        component.onDrop(event);
      }).not.toThrow();
    });

    it('should handle drop when column is not found', () => {
      const customData: TaskDto[] = [];

      const event = {
        previousContainer: { data: customData },
        container: { data: customData },
        previousIndex: 0,
        currentIndex: 0,
      } as CdkDragDrop<TaskDto[]>;

      expect(() => {
        component.onDrop(event);
      }).not.toThrow();
    });
  });

  describe('updateTaskStatus', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should dispatch updateTask action with new status', () => {
      const task = mockTasks[0];
      const previousColumn = component.columns[0];
      const event = {} as CdkDragDrop<TaskDto[]>;

      const dispatchSpy = jest.spyOn(store, 'dispatch');

      component.updateTaskStatus(task, TaskStatus.IN_PROGRESS, previousColumn, event);

      expect(dispatchSpy).toHaveBeenCalledWith(
        TaskActions.updateTask({
          id: task.id,
          updates: { status: TaskStatus.IN_PROGRESS },
        })
      );
    });
  });

  describe('revertTaskMove', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.organizeTasks(mockTasks);
    });

    it('should revert task to previous column', () => {
      const task = mockTasks[0];
      const todoColumn = component.columns[0];
      const inProgressColumn = component.columns[1];

      // Move task to in-progress column
      inProgressColumn.tasks.push(task);

      const event = {
        container: { data: inProgressColumn.tasks },
        previousIndex: 0,
      } as CdkDragDrop<TaskDto[]>;

      component.revertTaskMove(task, todoColumn, event);

      expect(todoColumn.tasks).toContain(task);
      expect(inProgressColumn.tasks).not.toContain(task);
    });

    it('should handle revert when task is not in current column', () => {
      const task = mockTasks[0];
      const todoColumn = component.columns[0];
      const inProgressColumn = component.columns[1];

      const event = {
        container: { data: inProgressColumn.tasks },
        previousIndex: 0,
      } as CdkDragDrop<TaskDto[]>;

      expect(() => {
        component.revertTaskMove(task, todoColumn, event);
      }).not.toThrow();
    });
  });

  describe('getConnectedLists', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return all column IDs', () => {
      const connectedLists = component.getConnectedLists();

      expect(connectedLists).toEqual(['todo', 'in-progress', 'done']);
    });
  });

  describe('getTaskCount', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.organizeTasks(mockTasks);
    });

    it('should return correct task count for column', () => {
      const todoColumn = component.columns.find((c) => c.status === TaskStatus.TODO)!;
      const count = component.getTaskCount(todoColumn);

      expect(count).toBe(1);
    });

    it('should return 0 for empty column', () => {
      const todoColumn = component.columns.find((c) => c.status === TaskStatus.TODO)!;
      todoColumn.tasks = [];

      const count = component.getTaskCount(todoColumn);

      expect(count).toBe(0);
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
      global.confirm = jest.fn();
    });

    it('should dispatch deleteTask action when confirmed', () => {
      (global.confirm as jest.Mock).mockReturnValue(true);
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      component.deleteTask(mockTasks[0]);

      expect(global.confirm).toHaveBeenCalledWith(`Are you sure you want to delete "${mockTasks[0].title}"?`);
      expect(dispatchSpy).toHaveBeenCalledWith(TaskActions.deleteTask({ id: mockTasks[0].id }));
    });

    it('should not dispatch deleteTask action when not confirmed', () => {
      (global.confirm as jest.Mock).mockReturnValue(false);
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      component.deleteTask(mockTasks[0]);

      expect(dispatchSpy).not.toHaveBeenCalled();
    });
  });

  describe('getColumnColor', () => {
    it('should return correct color for TODO status', () => {
      const color = component.getColumnColor(TaskStatus.TODO);
      expect(color).toContain('gray');
    });

    it('should return correct color for IN_PROGRESS status', () => {
      const color = component.getColumnColor(TaskStatus.IN_PROGRESS);
      expect(color).toContain('blue');
    });

    it('should return correct color for DONE status', () => {
      const color = component.getColumnColor(TaskStatus.DONE);
      expect(color).toContain('green');
    });
  });

  describe('getColumnHeaderColor', () => {
    it('should return correct header color for TODO status', () => {
      const color = component.getColumnHeaderColor(TaskStatus.TODO);
      expect(color).toContain('gray');
    });

    it('should return correct header color for IN_PROGRESS status', () => {
      const color = component.getColumnHeaderColor(TaskStatus.IN_PROGRESS);
      expect(color).toContain('blue');
    });

    it('should return correct header color for DONE status', () => {
      const color = component.getColumnHeaderColor(TaskStatus.DONE);
      expect(color).toContain('green');
    });
  });

  describe('truncate', () => {
    it('should truncate text longer than specified length', () => {
      const text = 'This is a very long text that should be truncated';
      const result = component.truncate(text, 20);

      expect(result).toBe('This is a very long ...');
    });

    it('should not truncate text shorter than specified length', () => {
      const text = 'Short text';
      const result = component.truncate(text, 20);

      expect(result).toBe('Short text');
    });

    it('should handle empty text', () => {
      const result = component.truncate('', 20);

      expect(result).toBe('');
    });

    it('should handle text exactly at length limit', () => {
      const text = 'Exactly twenty chars';
      const result = component.truncate(text, 20);

      expect(result).toBe('Exactly twenty chars');
    });
  });
});
