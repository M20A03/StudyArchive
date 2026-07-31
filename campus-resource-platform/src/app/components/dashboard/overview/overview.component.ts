import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { UserService, UserProfile } from '../../../services/user.service';
import { ResourceService, Resource } from '../../../services/resource.service';

@Component({
    selector: 'app-overview',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './overview.component.html',
    styleUrl: './overview.component.scss'
})
export class OverviewComponent implements OnInit, OnDestroy {
    userProfile: UserProfile;
    resources: Resource[] = [];
    private sub = new Subscription();

    stats = [
        { label: 'Total Uploads', value: '0', icon: 'upload', color: '#6366f1' },
        { label: 'Total Downloads', value: '0', icon: 'download', color: '#06b6d4' },
        { label: 'Total Reviews', value: '0', icon: 'star', color: '#10b981' },
        { label: 'Avg Rating', value: '0.0', icon: 'zap', color: '#f59e0b' }
    ];

    recentResources: Resource[] = [];
    activities: any[] = [];

    showEditModal = false;
    editForm = {
        name: '',
        university: '',
        department: '',
        semester: ''
    };

    constructor(
        private userService: UserService,
        private resourceService: ResourceService
    ) {
        this.userProfile = this.userService.getProfile();
        this.sub.add(
            this.userService.userProfile$.subscribe((profile: UserProfile) => {
                this.userProfile = profile;
            })
        );
    }

    ngOnInit() {
        this.sub.add(
            this.resourceService.resources$.subscribe((res) => {
                this.resources = res;
                this.calculateStats();
                this.recentResources = res.slice(0, 4);
                this.generateActivities();
            })
        );
    }

    ngOnDestroy() {
        this.sub.unsubscribe();
    }

    deleteResource(id: string) {
        if (confirm('Are you sure you want to delete this resource?')) {
            this.resourceService.deleteResource(id);
        }
    }

    togglePrivacy(id: string) {
        this.resourceService.togglePrivacy(id);
    }

    private calculateStats() {
        const totalUploads = this.resources.length;
        const totalDownloads = this.resources.reduce((acc, curr) => acc + (curr.downloads || 0), 0);
        const ratedResources = this.resources.filter(r => r.rating > 0);
        const totalReviews = ratedResources.length;
        
        let avgRating = 0;
        if (totalReviews > 0) {
            const sum = ratedResources.reduce((acc, curr) => acc + (curr.rating || 0), 0);
            avgRating = Math.round((sum / totalReviews) * 10) / 10;
        }

        this.stats = [
            { label: 'Total Uploads', value: totalUploads.toString(), icon: 'upload', color: '#6366f1' },
            { label: 'Total Downloads', value: totalDownloads >= 1000 ? (totalDownloads / 1000).toFixed(1) + 'k' : totalDownloads.toString(), icon: 'download', color: '#06b6d4' },
            { label: 'Total Reviews', value: totalReviews.toString(), icon: 'star', color: '#10b981' },
            { label: 'Avg Rating', value: avgRating > 0 ? avgRating.toFixed(1) : '0.0', icon: 'zap', color: '#f59e0b' }
        ];
    }

    private generateActivities() {
        const name = this.userProfile.name || 'You';
        this.activities = this.resources.slice(0, 3).map((r, i) => {
            const actions = ['uploaded', 'shared', 'published'];
            const action = actions[i % actions.length];
            return {
                user: name,
                action: action,
                resource: r.title,
                time: r.date
            };
        });

        if (this.activities.length === 0) {
            this.activities = [
                { user: name, action: 'joined the workspace', resource: 'Explore StudyArchive', time: 'Just now' }
            ];
        }
    }

    openEditModal() {
        this.editForm = { ...this.userProfile };
        this.showEditModal = true;
    }

    closeEditModal() {
        this.showEditModal = false;
    }

    saveProfile() {
        this.userService.updateProfile(this.editForm);
        this.closeEditModal();
    }
}
