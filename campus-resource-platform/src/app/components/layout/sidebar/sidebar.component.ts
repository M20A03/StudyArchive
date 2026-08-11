import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { UserService } from '../../../services/user.service';
import { SidebarService } from '../../../services/sidebar.service';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit, OnDestroy {
    isCollapsed = false;
    isMobileOpen = false;
    private sub = new Subscription();

    menuItems = [
        { icon: 'layout-dashboard', label: 'Dashboard', path: '/dashboard' },
        { icon: 'upload-cloud', label: 'Upload Resource', path: '/dashboard/upload' },
        { icon: 'folder', label: 'My Resources', path: '/dashboard/my-resources' },
        { icon: 'search', label: 'Search Resources', path: '/dashboard/search' },
    ];

    private sidebarService = inject(SidebarService);

    constructor(private userService: UserService, private router: Router) { }

    ngOnInit() {
        this.sub.add(
            this.sidebarService.mobileOpen$.subscribe((open: boolean) => {
                this.isMobileOpen = open;
            })
        );
    }

    ngOnDestroy() {
        this.sub.unsubscribe();
    }

    toggleSidebar() {
        this.isCollapsed = !this.isCollapsed;
    }

    closeMobile() {
        this.sidebarService.closeMobile();
    }

    logout() {
        this.userService.logout();
        this.closeMobile();
        this.router.navigate(['/dashboard']);
    }
}
