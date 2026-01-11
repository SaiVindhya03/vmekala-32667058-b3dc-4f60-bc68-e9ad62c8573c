import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { TaskDto, TaskStatus } from '@vmekala/data';
import { TaskFormComponent } from '../task-form/task-form.component';
import * as TaskActions from '../../../store/task/task.actions';
import * as TaskSelectors from '../../../store/task/task.selectors';

type SortField = 'title' | 'status' | 'createdAt';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TaskFormComponent],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.css'],
})
export class TaskListComponent implements OnInit {
  private readonly store = inject(Store);

  // Observables
  allTasks$ = this.store.select(TaskSelectors.selectAllTasks);
  loading$ = this.store.select(TaskSelectors.selectTasksLoading);
  error$: Observable<string | null> = this.store.select(TaskSelectors.selectTasksError);

  // Data
  displayedTasks: TaskDto[] = [];
  categories: string[] = [];

  // Filters
  selectedStatus = '';
  selectedCategory = '';
  searchQuery = '';

  // Sorting
  sortField: SortField = 'createdAt';
  sortDirection: SortDirection = 'desc';

  // Enums for template
  TaskStatus = TaskStatus;

  // Modal state
  showEditModal = false;
  showCreateModal = false;
  showDeleteConfirm = false;
  showViewModal = false;
  selectedTask: TaskDto | null = null;
  formMode: 'create' | 'edit' = 'create';

  ngOnInit(): void {
    this.store.dispatch(TaskActions.loadTasks());

    // Subscribe to tasks and apply filters/sorting
    this.allTasks$.subscribe((tasks) => {
      this.extractCategories(tasks);
      this.applyFiltersAndSort(tasks);
    });
  }

  /**
   * Extract unique categories from tasks
   */
  extractCategories(tasks: TaskDto[]): void {
    const categorySet = new Set(
      tasks.map((task) => task.category).filter((cat) => cat)
    );
    this.categories = Array.from(categorySet).sort();
  }

  /**
   * Apply all filters and sorting
   */
  applyFiltersAndSort(tasks: TaskDto[]): void {
    // Start with all tasks
    let result = [...tasks];

    // Apply status filter
    if (this.selectedStatus) {
      result = result.filter((task) => task.status === this.selectedStatus);
    }

    // Apply category filter
    if (this.selectedCategory) {
      result = result.filter((task) => task.category === this.selectedCategory);
    }

    // Apply search filter (client-side)
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter((task) =>
        task.title.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    this.displayedTasks = this.sortTasks(result);
  }
  /**
   * Sort tasks based on current sort field and direction
   */
  sortTasks(tasks: TaskDto[]): TaskDto[] {
    return tasks.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (this.sortField) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
      }

      if (aValue < bValue) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  /**
   * Handle column header click for sorting
   */
  onSort(field: SortField): void {
    if (this.sortField === field) {
      // Toggle direction if same field
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // New field, default to ascending
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    // Reapply filters with new sort
    this.allTasks$.subscribe((tasks) => {
      this.applyFiltersAndSort(tasks);
    }).unsubscribe();
  }

  /**
   * Reset all filters
   */
  resetFilters(): void {
    this.selectedStatus = '';
    this.selectedCategory = '';
    this.searchQuery = '';
    this.allTasks$.subscribe((tasks) => {
      this.applyFiltersAndSort(tasks);
    }).unsubscribe();
  }

  /**
   * Handle filter changes
   */
  onFilterChange(): void {
    this.allTasks$.subscribe((tasks) => {
      this.applyFiltersAndSort(tasks);
    }).unsubscribe();
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
   * Close form modals
   */
  closeFormModal(): void {
    this.showEditModal = false;
    this.showCreateModal = false;
    this.selectedTask = null;
  }

  /**
   * Handle task saved event
   */
  onTaskSaved(task: TaskDto): void {
    // Task is already created/updated via TaskFormComponent API call
    // Just reload tasks to refresh the view
    this.store.dispatch(TaskActions.loadTasks());
    this.closeFormModal();
  }

  /**
   * Open view modal
   */
  openViewModal(task: TaskDto): void {
    this.selectedTask = task;
    this.showViewModal = true;
  }

  /**
   * Close view modal
   */
  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedTask = null;
  }

  /**
   * Open delete confirmation
   */
  openDeleteConfirm(task: TaskDto): void {
    this.selectedTask = task;
    this.showDeleteConfirm = true;
  }

  /**
   * Close delete confirmation
   */
  closeDeleteConfirm(): void {
    this.showDeleteConfirm = false;
    this.selectedTask = null;
  }

  /**
   * Delete task
   */
  /**
   * Delete task
   */
  deleteTask(): void {
    if (!this.selectedTask) return;

    const taskId = this.selectedTask.id;
    this.store.dispatch(TaskActions.deleteTask({ id: taskId }));
    this.closeDeleteConfirm();
  }

  /**
   * Get status badge class
   */
  getStatusBadgeClass(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.TODO:
        return 'bg-gray-100 text-gray-800';
      case TaskStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800';
      case TaskStatus.DONE:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Format status for display
   */
  formatStatus(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.TODO:
        return 'To Do';
      case TaskStatus.IN_PROGRESS:
        return 'In Progress';
      case TaskStatus.DONE:
        return 'Done';
      default:
        return status;
    }
  }

  /**
   * Format date for display
   */
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Get sort indicator
   */
  getSortIndicator(field: SortField): string {
    if (this.sortField !== field) {
      return '';
    }
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  /**
   * Open create task modal
   */
  createTask(): void {
    this.openCreateModal();
  }
}
