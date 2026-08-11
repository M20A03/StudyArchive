import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { UserService, UserProfile } from '../../../services/user.service';

@Component({
    selector: 'app-overview',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './overview.component.html',
    styleUrl: './overview.component.scss'
})
export class OverviewComponent {
    userProfile: UserProfile;

    stats = [
        { label: 'Total Uploads', value: '124', icon: 'upload-cloud', color: '#1e40af' },
        { label: 'Total Downloads', value: '1.2k', icon: 'download-cloud', color: '#3b82f6' },
        { label: 'Total Reviews', value: '85', icon: 'star', color: '#10b981' },
        { label: 'Avg Rating', value: '4.8', icon: 'zap', color: '#f59e0b' }
    ];

    recentResources = [
        { title: 'Intro to Quantum Computing', subject: 'Physics', privacy: 'Public', rating: 4.9 },
        { title: 'Advanced Data Structures', subject: 'Computer Science', privacy: 'Public', rating: 4.7 },
        { title: 'Machine Learning Notes', subject: 'AI', privacy: 'Private', rating: 4.5 },
        { title: 'Calculus II Cheat Sheet', subject: 'Mathematics', privacy: 'Public', rating: 5.0 }
    ];

    activities = [
        { user: 'Sarah J.', action: 'uploaded', resource: 'Chemistry Lab Report', time: '2h ago' },
        { user: 'Mike R.', action: 'downloaded', resource: 'OS Algorithms', time: '5h ago' },
        { user: 'Emma W.', action: 'reviewed', resource: 'Microeconomics Theory', time: '1d ago' }
    ];

    showEditModal = false;
    editForm = {
        name: '',
        university: '',
        department: '',
        semester: ''
    };

    constructor(private userService: UserService) {
        this.userProfile = this.userService.getProfile();
        this.userService.userProfile$.subscribe((profile: UserProfile) => {
            this.userProfile = profile;
        });
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
