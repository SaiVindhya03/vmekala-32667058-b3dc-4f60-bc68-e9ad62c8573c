import { Component, inject, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserDto } from '@vmekala/data';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Output event for mobile menu toggle
  mobileMenuToggle = output<void>();

  protected currentUser: UserDto | null = null;
  protected isUserMenuOpen = signal(false);
  protected isDarkMode = signal(false);

  constructor() {
    this.currentUser = this.authService.getCurrentUser();
    
    // Load dark mode preference from localStorage
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
      this.isDarkMode.set(true);
      document.documentElement.classList.add('dark');
    }
  }

  protected toggleUserMenu(): void {
    this.isUserMenuOpen.update((value) => !value);
  }

  protected toggleMobileMenu(): void {
    this.mobileMenuToggle.emit();
  }

  protected toggleDarkMode(): void {
    this.isDarkMode.update((value) => !value);
    
    if (this.isDarkMode()) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }

  protected closeUserMenu(): void {
    this.isUserMenuOpen.set(false);
  }

  protected navigateToProfile(): void {
    this.closeUserMenu();
    this.router.navigate(['/profile']);
  }

  protected logout(): void {
    this.closeUserMenu();
    this.authService.logout();
  }

  protected getUserDisplayName(): string {
    if (!this.currentUser) {
      return 'Guest';
    }
    return `${this.currentUser.firstName} ${this.currentUser.lastName}`.trim() || this.currentUser.email;
  }

  protected getUserInitials(): string {
    if (!this.currentUser) {
      return 'G';
    }
    const firstInitial = this.currentUser.firstName?.charAt(0) || '';
    const lastInitial = this.currentUser.lastName?.charAt(0) || '';
    return (firstInitial + lastInitial).toUpperCase() || this.currentUser.email.charAt(0).toUpperCase();
  }
}
