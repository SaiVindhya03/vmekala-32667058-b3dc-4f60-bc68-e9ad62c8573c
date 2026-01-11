import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { TaskDto, TaskStatus, UpdateTaskDto } from '@vmekala/data';
import { TaskFormComponent } from '../task-form/task-form.component';
import * as TaskActions from '../../../store/task/task.actions';
import * as TaskSelectors from '../../../store/task/task.selectors';

interface TaskColumn {
  id: string;
  title: string;
  status: TaskStatus;
  tasks: TaskDto[];
}

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [CommonModule, DragDropModule, TaskFormComponent],
  templateUrl: './task-board.component.html',
  styleUrls: ['./task-board.component.css'],
})
export class TaskBoardComponent implements OnInit {
  private readonly store = inject(Store);

  // Observables
  tasks$ = this.store.select(TaskSelectors.selectAllTasks);
  loading$ = this.store.select(TaskSelectors.selectTasksLoading);
  error$: Observable<string | null> = this.store.select(TaskSelectors.selectTasksError);

  // Local state
  updatingTaskId: string | null = null;
  columns: TaskColumn[] = [
    {
      id: 'todo',
      title: 'To Do',
      status: TaskStatus.TODO,
      tasks: [],
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      status: TaskStatus.IN_PROGRESS,
      tasks: [],
    },
    {
      id: 'done',
      title: 'Done',
      status: TaskStatus.DONE,
      tasks: [],
    },
  ];

  // Form state
  showCreateModal = false;
  showEditModal = false;
  selectedTask: TaskDto | null = null;
  formMode: 'create' | 'edit' = 'create';

  ngOnInit(): void {
    this.store.dispatch(TaskActions.loadTasks());

    // Subscribe to tasks and organize into columns
    this.tasks$.subscribe((tasks) => {
      this.organizeTasks(tasks);
    });
  }

  /**
   * Organize tasks into columns by status
   */
  organizeTasks(tasks: TaskDto[]): void {
    // Clear existing tasks
    this.columns.forEach((col) => (col.tasks = []));

    // Group tasks by status
    tasks.forEach((task) => {
      const column = this.columns.find((col) => col.status === task.status);
      if (column) {
        column.tasks.push(task);
      }
    });
  }

  /**
   * Handle drag and drop event
   */
  onDrop(event: CdkDragDrop<TaskDto[]>): void {
    const task = event.previousContainer.data[event.previousIndex];
    const previousColumn = this.columns.find(
      (col) => col.tasks === event.previousContainer.data
    );
    const newColumn = this.columns.find(
      (col) => col.tasks === event.container.data
    );

    if (!previousColumn || !newColumn || !task) {
      return;
    }

    // If dropped in the same column, just reorder
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      return;
    }

    // Move task to new column
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );

    // Update task status via API
    this.updateTaskStatus(task, newColumn.status, previousColumn, event);
  }

  /**
   * Update task status via API
   */
  updateTaskStatus(
    task: TaskDto,
    newStatus: TaskStatus,
    previousColumn: TaskColumn,
    event: CdkDragDrop<TaskDto[]>
  ): void {
    // Don't show spinner during drag and drop - update happens in background
    const updates: UpdateTaskDto = {
      status: newStatus,
    };

    this.store.dispatch(TaskActions.updateTask({ id: task.id, updates }));
  }

  /**
   * Revert task move if API update fails
   */
  revertTaskMove(
    task: TaskDto,
    previousColumn: TaskColumn,
    event: CdkDragDrop<TaskDto[]>
  ): void {
    // Remove from current column
    const currentColumnTasks = event.container.data;
    const currentIndex = currentColumnTasks.findIndex((t) => t.id === task.id);
    if (currentIndex !== -1) {
      currentColumnTasks.splice(currentIndex, 1);
    }

    // Add back to previous column at original position
    previousColumn.tasks.splice(event.previousIndex, 0, task);
  }

  /**
   * Get column IDs for cdkDropListConnectedTo
   */
  getConnectedLists(): string[] {
    return this.columns.map((col) => col.id);
  }

  /**
   * Get task count for a column
   */
  getTaskCount(column: TaskColumn): number {
    return column.tasks.length;
  }

  /**
   * Open create modal
   */
  openCreateModal(): void {
    this.formMode = 'create';
    this.selectedTask = null;
    this.showCreateModal = true;
  }

  /**
   * Open edit modal
   */
  openEditModal(task: TaskDto): void {
    this.formMode = 'edit';
    this.selectedTask = task;
    this.showEditModal = true;
  }

  /**
   * Close form modal
   */
  closeFormModal(): void {
    this.showEditModal = false;
    this.showCreateModal = false;
    this.selectedTask = null;
  }

  /**
   * Handle task saved
   */
  onTaskSaved(task: TaskDto): void {
    // Task is already created/updated via TaskFormComponent API call
    // Just reload tasks to refresh the view
    this.store.dispatch(TaskActions.loadTasks());
    this.closeFormModal();
  }

  /**
   * Delete task
   */
  deleteTask(task: TaskDto): void {
    if (!confirm(`Are you sure you want to delete "${task.title}"?`)) {
      return;
    }

    this.store.dispatch(TaskActions.deleteTask({ id: task.id }));
  }

  /**
   * Get status badge color
   */
  getColumnColor(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.TODO:
        return 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600';
      case TaskStatus.IN_PROGRESS:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700';
      case TaskStatus.DONE:
        return 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700';
      default:
        return 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600';
    }
  }

  /**
   * Get column header color
   */
  getColumnHeaderColor(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.TODO:
        return 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100';
      case TaskStatus.IN_PROGRESS:
        return 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-100';
      case TaskStatus.DONE:
        return 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-100';
      default:
        return 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100';
    }
  }

  /**
   * Truncate text
   */
  truncate(text: string, length: number): string {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
  }
}
