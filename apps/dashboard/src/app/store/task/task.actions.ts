import { createAction, props } from '@ngrx/store';
import { TaskDto, CreateTaskDto, UpdateTaskDto } from '@vmekala/data';

// Load Tasks
export const loadTasks = createAction('[Task] Load Tasks');
export const loadTasksSuccess = createAction(
  '[Task] Load Tasks Success',
  props<{ tasks: TaskDto[] }>()
);
export const loadTasksFailure = createAction(
  '[Task] Load Tasks Failure',
  props<{ error: string }>()
);

// Create Task
export const createTask = createAction(
  '[Task] Create Task',
  props<{ task: CreateTaskDto }>()
);
export const createTaskSuccess = createAction(
  '[Task] Create Task Success',
  props<{ task: TaskDto }>()
);
export const createTaskFailure = createAction(
  '[Task] Create Task Failure',
  props<{ error: string }>()
);

// Update Task
export const updateTask = createAction(
  '[Task] Update Task',
  props<{ id: string; updates: UpdateTaskDto }>()
);
export const updateTaskSuccess = createAction(
  '[Task] Update Task Success',
  props<{ task: TaskDto }>()
);
export const updateTaskFailure = createAction(
  '[Task] Update Task Failure',
  props<{ error: string }>()
);

// Delete Task
export const deleteTask = createAction(
  '[Task] Delete Task',
  props<{ id: string }>()
);
export const deleteTaskSuccess = createAction(
  '[Task] Delete Task Success',
  props<{ id: string }>()
);
export const deleteTaskFailure = createAction(
  '[Task] Delete Task Failure',
  props<{ error: string }>()
);

// Set Filters
export const setFilters = createAction(
  '[Task] Set Filters',
  props<{ filters: { status?: string; category?: string } }>()
);

export const clearFilters = createAction('[Task] Clear Filters');
