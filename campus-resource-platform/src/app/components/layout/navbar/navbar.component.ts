import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { UserService, UserProfile } from '../../../services/user.service';
import { SidebarService } from '../../../services/sidebar.service';

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
    isLoggedIn = false;
    showNotifications = false;
    searchValue = '';
    showAccountMenu = false;

    // In-Website Auth Modal state
    showAuthModal = false;
    authTab: 'login' | 'register' = 'login';
    authError = '';
    authLoading = false;

    loginData = {
        identifier: '',
        password: ''
    };

    registerData = {
        fullName: '',
        email: '',
        college: '',
        department: '',
        semester: '1st Semester',
        password: ''
    };

    private sidebarService = inject(SidebarService);

    constructor(private userService: UserService, private router: Router) {
        this.userProfile = this.userService.getProfile();
        this.isLoggedIn = this.userService.isAuthenticated();

        this.userService.userProfile$.subscribe((profile: UserProfile) => {
            this.userProfile = profile;
        });

        this.userService.authState$.subscribe((authenticated: boolean) => {
            this.isLoggedIn = authenticated;
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

    toggleMobileSidebar() {
        this.sidebarService.toggleMobile();
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

    openAuthModal(tab: 'login' | 'register' = 'login') {
        this.authTab = tab;
        this.authError = '';
        this.showAuthModal = true;
    }

    closeAuthModal() {
        this.showAuthModal = false;
        this.authError = '';
    }

    async submitLogin() {
        if (!this.loginData.identifier || !this.loginData.password) {
            this.authError = 'Please enter your username/email and password';
            return;
        }
        this.authLoading = true;
        this.authError = '';

        try {
            await this.userService.login(this.loginData.identifier, this.loginData.password);
            this.showAuthModal = false;
            this.loginData = { identifier: '', password: '' };
        } catch (err: any) {
            this.authError = err?.message || 'Login failed. Please check credentials.';
        } finally {
            this.authLoading = false;
        }
    }

    async submitRegister() {
        if (!this.registerData.fullName || !this.registerData.email || !this.registerData.password) {
            this.authError = 'Please fill out all required fields';
            return;
        }
        this.authLoading = true;
        this.authError = '';

        try {
            await this.userService.register(this.registerData);
            this.showAuthModal = false;
            this.registerData = {
                fullName: '',
                email: '',
                college: '',
                department: '',
                semester: '1st Semester',
                password: ''
            };
        } catch (err: any) {
            this.authError = err?.message || 'Registration failed.';
        } finally {
            this.authLoading = false;
        }
    }

    logout() {
        this.userService.logout();
        this.showAccountMenu = false;
        this.router.navigate(['/dashboard']);
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
