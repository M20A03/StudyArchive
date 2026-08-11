import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { UserService, UserProfile } from '../../../services/user.service';

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './navbar.component.html',
    styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
    userProfile: UserProfile;
    isLightTheme = false;
    showNotifications = false;
    searchValue = '';
    showAccountMenu = false;

    constructor(private userService: UserService, private router: Router) {
        this.userProfile = this.userService.getProfile();
        this.userService.userProfile$.subscribe((profile: UserProfile) => {
            this.userProfile = profile;
        });

        if (typeof window !== 'undefined') {
            this.isLightTheme = localStorage.getItem('theme') === 'light';
            this.applyTheme();
        }
    }

    toggleTheme() {
        this.isLightTheme = !this.isLightTheme;
        if (typeof window !== 'undefined') {
            localStorage.setItem('theme', this.isLightTheme ? 'light' : 'dark');
        }
        this.applyTheme();
    }

    setTheme(mode: 'light' | 'dark') {
        this.isLightTheme = mode === 'light';
        if (typeof window !== 'undefined') {
            localStorage.setItem('theme', mode);
        }
        this.applyTheme();
    }

    toggleNotifications() {
        this.showNotifications = !this.showNotifications;
    }

    goToSearch() {
        const query = this.searchValue.trim();
        this.router.navigate(['/dashboard/search'], {
            queryParams: query ? { q: query } : {}
        });
    }

    openProfileEditor() {
        this.router.navigate(['/dashboard']);
        this.showAccountMenu = false;
    }

    toggleAccountMenu(event: MouseEvent) {
        event.stopPropagation();
        this.showAccountMenu = !this.showAccountMenu;
    }

    changeAccount() {
        this.userService.logout();
        this.showAccountMenu = false;
        this.router.navigate(['/login']);
    }

    logout() {
        this.userService.logout();
        this.showAccountMenu = false;
        this.router.navigate(['/login']);
    }

    @HostListener('document:click')
    closeMenuOnOutsideClick() {
        this.showAccountMenu = false;
    }

    private applyTheme() {
        if (typeof document !== 'undefined') {
            document.body.classList.toggle('light-theme', this.isLightTheme);
        }
    }
}
