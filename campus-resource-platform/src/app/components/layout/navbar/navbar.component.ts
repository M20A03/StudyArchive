import { Component, EventEmitter, HostListener, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { ThemeService } from '../../../core/theme.service';
import { UserProfile, ThemeMode } from '../../../core/models';

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './navbar.component.html',
    styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
    private userService = inject(UserService);
    private router = inject(Router);
    public themeService = inject(ThemeService);

    @Output() toggleMobileMenu = new EventEmitter<void>();

    userProfile: UserProfile = this.userService.getProfile();
    isAuthenticated = false;
    showNotifications = false;
    searchValue = '';
    showAccountMenu = false;

    constructor() {
        this.userService.userProfile$.subscribe((profile: UserProfile) => {
            this.userProfile = profile;
        });

        this.userService.authState$.subscribe((auth) => {
            this.isAuthenticated = auth;
        });
    }

    onMobileMenuClick() {
        this.toggleMobileMenu.emit();
    }

    toggleTheme() {
        this.themeService.toggleTheme();
    }

    setThemeMode(mode: ThemeMode) {
        this.themeService.setTheme(mode);
    }

    toggleNotifications(event: MouseEvent) {
        event.stopPropagation();
        this.showNotifications = !this.showNotifications;
        this.showAccountMenu = false;
    }

    goToSearch() {
        const query = this.searchValue.trim();
        this.router.navigate(['/dashboard/search'], {
            queryParams: query ? { q: query } : {}
        });
    }

    openProfileEditor() {
        this.showAccountMenu = false;
        this.router.navigate(['/dashboard']);
    }

    toggleAccountMenu(event: MouseEvent) {
        event.stopPropagation();
        this.showAccountMenu = !this.showAccountMenu;
        this.showNotifications = false;
    }

    logout() {
        this.showAccountMenu = false;
        this.userService.logout();
        this.router.navigate(['/dashboard']);
    }

    @HostListener('document:click')
    closeMenusOnOutsideClick() {
        this.showAccountMenu = false;
        this.showNotifications = false;
    }

    @HostListener('document:keydown.escape')
    handleEscape() {
        this.showAccountMenu = false;
        this.showNotifications = false;
    }
}
