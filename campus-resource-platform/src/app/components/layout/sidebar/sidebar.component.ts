import { Component } from '@angular/core';
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
    isCollapsed = false;
    menuItems = [
        { icon: 'layout-dashboard', label: 'Dashboard', path: '/dashboard' },
        { icon: 'upload-cloud', label: 'Upload Resource', path: '/dashboard/upload' },
        { icon: 'folder', label: 'My Resources', path: '/dashboard/my-resources' },
        { icon: 'search', label: 'Search Resources', path: '/dashboard/search' },
    ];

    constructor(private userService: UserService, private router: Router) { }

    toggleSidebar() {
        this.isCollapsed = !this.isCollapsed;
    }

    logout() {
        this.userService.logout();
        this.router.navigate(['/login']);
    }
}
