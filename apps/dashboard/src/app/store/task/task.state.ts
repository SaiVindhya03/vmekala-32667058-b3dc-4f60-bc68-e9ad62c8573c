import { TaskDto } from '@vmekala/data';

export interface TaskFilters {
  status?: string;
  category?: string;
}

export interface TaskState {
  tasks: TaskDto[];
  loading: boolean;
  error: string | null;
  selectedFilters: TaskFilters;
}

export const initialTaskState: TaskState = {
  tasks: [],
  loading: false,
  error: null,
  selectedFilters: {},
};
