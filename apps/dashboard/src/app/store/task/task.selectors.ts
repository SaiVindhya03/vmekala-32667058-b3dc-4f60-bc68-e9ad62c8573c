import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TaskState } from './task.state';

export const selectTaskState = createFeatureSelector<TaskState>('tasks');

export const selectAllTasks = createSelector(
  selectTaskState,
  (state) => state.tasks
);

export const selectTasksLoading = createSelector(
  selectTaskState,
  (state) => state.loading
);

export const selectTasksError = createSelector(
  selectTaskState,
  (state) => state.error
);

export const selectFilters = createSelector(
  selectTaskState,
  (state) => state.selectedFilters
);

export const selectFilteredTasks = createSelector(
  selectAllTasks,
  selectFilters,
  (tasks, filters) => {
    let filtered = [...tasks];

    if (filters.status) {
      filtered = filtered.filter((task) => task.status === filters.status);
    }

    if (filters.category) {
      filtered = filtered.filter((task) => task.category === filters.category);
    }

    return filtered;
  }
);

export const selectTaskById = (id: string) =>
  createSelector(selectAllTasks, (tasks) => tasks.find((task) => task.id === id));

export const selectTasksByStatus = (status: string) =>
  createSelector(selectAllTasks, (tasks) =>
    tasks.filter((task) => task.status === status)
  );
