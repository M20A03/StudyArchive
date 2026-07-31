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
        { label: 'Dashboard', path: '/dashboard', svgIcon: 'dashboard' },
        { label: 'Upload Resource', path: '/dashboard/upload', svgIcon: 'upload' },
        { label: 'My Resources', path: '/dashboard/my-resources', svgIcon: 'folder' },
        { label: 'Search Resources', path: '/dashboard/search', svgIcon: 'search' },
    ];

    constructor(private userService: UserService, private router: Router) { }

    toggleSidebar() {
        this.isCollapsed = !this.isCollapsed;
    }

    async logout() {
        await this.userService.logout();
        this.router.navigate(['/dashboard']);
    }
}
