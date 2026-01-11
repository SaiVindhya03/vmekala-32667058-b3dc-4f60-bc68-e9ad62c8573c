import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  Output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TaskDto, TaskStatus } from '@vmekala/data';
import { TaskService } from '../../../services/task.service';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.css'],
})
export class TaskFormComponent implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly taskService = inject(TaskService);

  // Inputs
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() task: TaskDto | null = null;
  @Input() show = false;

  // Outputs
  @Output() taskSaved = new EventEmitter<TaskDto>();
  @Output() cancelled = new EventEmitter<void>();
  @Output() taskDeleted = new EventEmitter<TaskDto>();

  // Form
  taskForm!: FormGroup;

  // State
  loading = false;
  error: string | null = null;

  // Enums for template
  TaskStatus = TaskStatus;

  // Categories
  categories = ['Work', 'Personal', 'Shopping', 'Health', 'Finance', 'Other'];

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // When the task input changes and we're in edit mode, refill the form
    if (changes['task'] && this.taskForm && this.mode === 'edit' && this.task) {
      this.taskForm.patchValue({
        title: this.task.title,
        description: this.task.description,
        status: this.task.status,
        category: this.task.category,
      });
    }
    
    // When mode changes, reset or refill the form
    if (changes['mode'] && this.taskForm) {
      if (this.mode === 'edit' && this.task) {
        this.taskForm.patchValue({
          title: this.task.title,
          description: this.task.description,
          status: this.task.status,
          category: this.task.category,
        });
      } else if (this.mode === 'create') {
        this.resetForm();
      }
    }
  }

  /**
   * Initialize the form with validators
   */
  initializeForm(): void {
    this.taskForm = this.fb.group({
      title: [
        '',
        [Validators.required, Validators.minLength(3), Validators.maxLength(100)],
      ],
      description: ['', [Validators.maxLength(500)]],
      status: [TaskStatus.TODO, [Validators.required]],
      category: ['', [Validators.required]],
    });

    // If in edit mode and task is provided, pre-fill the form
    if (this.mode === 'edit' && this.task) {
      this.taskForm.patchValue({
        title: this.task.title,
        description: this.task.description,
        status: this.task.status,
        category: this.task.category,
      });
    }
  }

  /**
   * Get form control for template access
   */
  get f() {
    return this.taskForm.controls;
  }

  /**
   * Check if a field has an error
   */
  hasError(fieldName: string, errorType: string): boolean {
    const field = this.taskForm.get(fieldName);
    return !!(field && field.hasError(errorType) && (field.dirty || field.touched));
  }

  /**
   * Get error message for a field
   */
  getErrorMessage(fieldName: string): string {
    const field = this.taskForm.get(fieldName);
    if (!field || !field.errors || (!field.dirty && !field.touched)) {
      return '';
    }

    if (field.hasError('required')) {
      return `${this.capitalizeFirst(fieldName)} is required`;
    }
    if (field.hasError('minlength')) {
      const minLength = field.errors['minlength'].requiredLength;
      return `${this.capitalizeFirst(fieldName)} must be at least ${minLength} characters`;
    }
    if (field.hasError('maxlength')) {
      const maxLength = field.errors['maxlength'].requiredLength;
      return `${this.capitalizeFirst(fieldName)} must not exceed ${maxLength} characters`;
    }
    return '';
  }

  /**
   * Capitalize first letter of a string
   */
  capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    // Mark all fields as touched to show validation errors
    Object.keys(this.taskForm.controls).forEach((key) => {
      this.taskForm.get(key)?.markAsTouched();
    });

    // Check if form is valid
    if (this.taskForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = null;

    const formValue = this.taskForm.value;

    if (this.mode === 'create') {
      // Create new task
      this.taskService.createTask(formValue).subscribe({
        next: (task) => {
          this.loading = false;
          this.taskSaved.emit(task);
          this.resetForm();
        },
        error: (err) => {
          this.loading = false;
          this.error = err.message || 'Failed to create task';
        },
      });
    } else if (this.mode === 'edit' && this.task) {
      // Update existing task
      this.taskService.updateTask(this.task.id, formValue).subscribe({
        next: (task) => {
          this.loading = false;
          this.taskSaved.emit(task);
          this.resetForm();
        },
        error: (err) => {
          this.loading = false;
          this.error = err.message || 'Failed to update task';
        },
      });
    }
  }

  /**
   * Handle cancel button click
   */
  onCancel(): void {
    this.resetForm();
    this.cancelled.emit();
  }

  /**
   * Reset form and state
   */
  resetForm(): void {
    this.taskForm.reset({
      title: '',
      description: '',
      status: TaskStatus.TODO,
      category: '',
    });
    this.error = null;
    this.loading = false;
  }

  /**
   * Close modal when clicking backdrop
   */
  onBackdropClick(): void {
    if (!this.loading) {
      this.onCancel();
    }
  }

  /**
   * Prevent modal close when clicking inside
   */
  onModalClick(event: Event): void {
    event.stopPropagation();
  }

  /**
   * Get modal title based on mode
   */
  getModalTitle(): string {
    return this.mode === 'create' ? 'Create New Task' : 'Edit Task';
  }

  /**
   * Get submit button text based on mode
   */
  getSubmitButtonText(): string {
    if (this.loading) {
      return this.mode === 'create' ? 'Creating...' : 'Updating...';
    }
    return this.mode === 'create' ? 'Create Task' : 'Update Task';
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
   * Handle delete button click
   */
  onDelete(): void {
    if (!this.task) return;
    
    if (confirm(`Are you sure you want to delete "${this.task.title}"?`)) {
      this.taskDeleted.emit(this.task);
      this.onCancel();
    }
  }
}
