import { createReducer, on } from '@ngrx/store';
import { TaskState, initialTaskState } from './task.state';
import * as TaskActions from './task.actions';

export const taskReducer = createReducer(
  initialTaskState,

  // Load Tasks
  on(TaskActions.loadTasks, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(TaskActions.loadTasksSuccess, (state, { tasks }) => ({
    ...state,
    tasks,
    loading: false,
    error: null,
  })),
  on(TaskActions.loadTasksFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Create Task
  on(TaskActions.createTask, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(TaskActions.createTaskSuccess, (state, { task }) => ({
    ...state,
    tasks: [...state.tasks, task],
    loading: false,
    error: null,
  })),
  on(TaskActions.createTaskFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Update Task
  on(TaskActions.updateTask, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(TaskActions.updateTaskSuccess, (state, { task }) => ({
    ...state,
    tasks: state.tasks.map((t) => (t.id === task.id ? task : t)),
    loading: false,
    error: null,
  })),
  on(TaskActions.updateTaskFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Delete Task
  on(TaskActions.deleteTask, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(TaskActions.deleteTaskSuccess, (state, { id }) => ({
    ...state,
    tasks: state.tasks.filter((t) => t.id !== id),
    loading: false,
    error: null,
  })),
  on(TaskActions.deleteTaskFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Filters
  on(TaskActions.setFilters, (state, { filters }) => ({
    ...state,
    selectedFilters: filters,
  })),
  on(TaskActions.clearFilters, (state) => ({
    ...state,
    selectedFilters: {},
  }))
);
