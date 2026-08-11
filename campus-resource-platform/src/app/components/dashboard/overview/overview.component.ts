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
        { label: 'Total Uploads', value: '0', icon: 'upload-cloud', color: '#6d7cff' },
        { label: 'Total Downloads', value: '0', icon: 'download-cloud', color: '#38bdf8' },
        { label: 'Total Reviews', value: '0', icon: 'star', color: '#10b981' },
        { label: 'Avg Rating', value: '0.0', icon: 'zap', color: '#f2c56d' }
    ];

    recentResources: Resource[] = [];
    activities: { user: string; action: string; resource: string; time: string }[] = [];

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
    }

    ngOnInit() {
        this.sub.add(
            this.userService.userProfile$.subscribe((profile: UserProfile) => {
                this.userProfile = profile;
            })
        );

        this.sub.add(
            this.resourceService.resources$.subscribe((list: Resource[]) => {
                this.resources = list;
                this.calculateRealDashboardData(list);
            })
        );
    }

    ngOnDestroy() {
        this.sub.unsubscribe();
    }

    private calculateRealDashboardData(list: Resource[]) {
        const totalUploads = list.length;
        const totalDownloads = list.reduce((sum, res) => sum + (res.downloads || 0), 0);
        const ratedResources = list.filter((res) => (res.rating || 0) > 0);
        const totalReviews = ratedResources.length;
        const avgRating = ratedResources.length > 0
            ? (ratedResources.reduce((sum, r) => sum + r.rating, 0) / ratedResources.length).toFixed(1)
            : '0.0';

        this.stats[0].value = totalUploads.toString();
        this.stats[1].value = totalDownloads >= 1000 ? (totalDownloads / 1000).toFixed(1) + 'k' : totalDownloads.toString();
        this.stats[2].value = totalReviews.toString();
        this.stats[3].value = avgRating;

        this.recentResources = list.slice(0, 5);

        // Generate REAL activity items from user's actual resources
        this.activities = list.slice(0, 4).map((res) => ({
            user: this.userProfile.name || 'You',
            action: 'uploaded',
            resource: res.title,
            time: res.date || 'Recently'
        }));
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
