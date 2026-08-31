import { Component, HostListener, inject, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { ResourceService } from '../../../services/resource.service';
import { UserProfile, Resource } from '../../../core/models';

declare var lucide: any;

@Component({
    selector: 'app-overview',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './overview.component.html',
    styleUrl: './overview.component.scss'
})
export class OverviewComponent implements AfterViewInit {
    private userService = inject(UserService);
    private resourceService = inject(ResourceService);

    userProfile: UserProfile = this.userService.getProfile();
    isAuthenticated = false;

    stats = [
        { label: 'Total Uploads', value: '124', icon: 'upload-cloud', color: '#6366f1' },
        { label: 'Total Downloads', value: '1.2k', icon: 'download-cloud', color: '#38bdf8' },
        { label: 'Total Reviews', value: '85', icon: 'star', color: '#10b981' },
        { label: 'Avg Rating', value: '4.9', icon: 'zap', color: '#f59e0b' }
    ];

    recentResources: Resource[] = [];

    activities = [
        { user: 'Sarah J.', action: 'uploaded', resource: 'Chemistry Lab Guide', time: '20m ago' },
        { user: 'Alex M.', action: 'downloaded', resource: 'Data Structures & Algorithms', time: '1h ago' },
        { user: 'Emma W.', action: 'rated 5★', resource: 'Discrete Mathematics Notes', time: '3h ago' }
    ];

    showEditModal = false;
    isSaving = false;
    editForm = {
        name: '',
        university: '',
        department: '',
        semester: ''
    };

    constructor() {
        this.userService.userProfile$.subscribe((profile: UserProfile) => {
            this.userProfile = profile;
        });

        this.userService.authState$.subscribe((auth) => {
            this.isAuthenticated = auth;
        });

        this.resourceService.resources$.subscribe((resList) => {
            if (resList.length > 0) {
                this.recentResources = resList.slice(0, 5);
                this.stats[0].value = `${resList.length}`;
                const totalDownloads = resList.reduce((acc, curr) => acc + (curr.downloads || 0), 0);
                this.stats[1].value = totalDownloads > 0 ? `${totalDownloads}` : '0';
            } else {
                this.recentResources = this.defaultSampleResources();
            }
            this.refreshIcons();
        });
    }

    ngAfterViewInit(): void {
        this.refreshIcons();
    }

    refreshIcons(): void {
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            setTimeout(() => lucide.createIcons(), 50);
        }
    }

    openEditModal() {
        this.editForm = {
            name: this.userProfile.name || '',
            university: this.userProfile.university || '',
            department: this.userProfile.department || '',
            semester: this.userProfile.semester || '1st Semester'
        };
        this.showEditModal = true;
    }

    closeEditModal() {
        this.showEditModal = false;
    }

    async saveProfile() {
        if (!this.editForm.name.trim()) return;
        this.isSaving = true;
        try {
            await this.userService.updateProfile(this.editForm);
            this.closeEditModal();
        } finally {
            this.isSaving = false;
        }
    }

    deleteResource(id: string) {
        this.resourceService.deleteResource(id);
    }

    @HostListener('document:keydown.escape')
    handleEscape() {
        if (this.showEditModal) {
            this.closeEditModal();
        }
    }

    private defaultSampleResources(): Resource[] {
        return [
            { id: 'sample-1', title: 'Data Structures & Algorithms Cheat Sheet', subject: 'Computer Science', privacy: 'Public', rating: 4.9, downloads: 482, date: 'May 2024' },
            { id: 'sample-2', title: 'Calculus II Multivariable Integration Notes', subject: 'Mathematics', privacy: 'Public', rating: 4.8, downloads: 310, date: 'Apr 2024' },
            { id: 'sample-3', title: 'Operating Systems Virtual Memory & CPU Scheduling', subject: 'Computer Science', privacy: 'Public', rating: 4.7, downloads: 195, date: 'Apr 2024' }
        ];
    }
}
