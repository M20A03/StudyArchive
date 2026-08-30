import { Component, EventEmitter, Input, Output, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../../services/user.service';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
    private userService = inject(UserService);
    private router = inject(Router);

    @Input() isMobileOpen = false;
    @Output() closeMobileDrawer = new EventEmitter<void>();

    isCollapsed = false;
    isAuthenticated = false;

    menuItems = [
        { icon: 'layout-dashboard', label: 'Dashboard', path: '/dashboard' },
        { icon: 'search', label: 'Search Resources', path: '/dashboard/search' },
        { icon: 'upload-cloud', label: 'Upload Resource', path: '/dashboard/upload' },
        { icon: 'folder', label: 'My Resources', path: '/dashboard/my-resources' }
    ];

    constructor() {
        this.userService.authState$.subscribe((auth) => {
            this.isAuthenticated = auth;
        });
    }

    toggleSidebar() {
        this.isCollapsed = !this.isCollapsed;
    }

    onNavClick() {
        if (this.isMobileOpen) {
            this.closeMobileDrawer.emit();
        }
    }

    onBackdropClick() {
        this.closeMobileDrawer.emit();
    }

    logout() {
        this.onNavClick();
        this.userService.logout();
        this.router.navigate(['/dashboard']);
    }

    @HostListener('document:keydown.escape')
    onEscape() {
        if (this.isMobileOpen) {
            this.closeMobileDrawer.emit();
        }
    }
}
