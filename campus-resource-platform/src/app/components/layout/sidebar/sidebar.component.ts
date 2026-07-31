import { Component, OnInit, OnDestroy } from '@angular/core';
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
        { label: 'Dashboard', path: '/dashboard', svgIcon: 'dashboard' },
        { label: 'Upload Resource', path: '/dashboard/upload', svgIcon: 'upload' },
        { label: 'My Resources', path: '/dashboard/my-resources', svgIcon: 'folder' },
        { label: 'Search Resources', path: '/dashboard/search', svgIcon: 'search' },
    ];

    constructor(
        private userService: UserService,
        private sidebarService: SidebarService,
        private router: Router
    ) {}

    ngOnInit() {
        this.sub.add(
            this.sidebarService.mobileOpen$.subscribe((open) => {
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

    async logout() {
        this.closeMobile();
        await this.userService.logout();
        this.router.navigate(['/dashboard']);
    }
}
