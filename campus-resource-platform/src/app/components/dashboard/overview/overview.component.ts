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

    // Gamification & Streak
    streakCount = 7;
    scholarLevel = 3;
    currentXp = 780;
    targetXp = 1000;

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

    // Quick Resource Preview Modal
    selectedResourceForPreview: Resource | null = null;

    // AI Companion Assistant State
    showAiModal = false;
    aiInput = '';
    aiIsThinking = false;
    aiMessages: Array<{ text: string; sender: 'user' | 'ai'; time: string }> = [
        {
            text: "Hello! I'm your StudyArchive AI Companion 🤖. Ask me to summarize lecture notes, generate flashcards, or create a revision schedule!",
            sender: 'ai',
            time: 'Just now'
        }
    ];

    quickPrompts = [
        '💡 Summarize Quantum Physics Notes',
        '📝 Generate 5 Flashcards for Data Structures',
        '📊 Give me a 3-day Exam Study Plan',
        '📐 Key Formulas for Calculus II'
    ];

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

    // Resource Preview Sheet
    openPreview(res: Resource) {
        this.selectedResourceForPreview = res;
    }

    closePreview() {
        this.selectedResourceForPreview = null;
    }

    // AI Assistant
    toggleAiModal() {
        this.showAiModal = !this.showAiModal;
    }

    sendAiMessage(promptText?: string) {
        const text = promptText || this.aiInput;
        if (!text.trim() || this.aiIsThinking) return;

        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        this.aiMessages.push({ text, sender: 'user', time });
        this.aiInput = '';
        this.aiIsThinking = true;

        setTimeout(() => {
            let response = "I've analyzed your request! Here are key takeaways and a study overview for your topic.";
            if (text.toLowerCase().includes('quantum')) {
                response = "⚛️ **Quantum Physics Summary**:\n1. Superposition allows states to exist simultaneously until measured.\n2. Quantum Entanglement links particles regardless of distance.\n3. Key Formula: E = hf (Planck's Relation).";
            } else if (text.toLowerCase().includes('data structure') || text.toLowerCase().includes('flashcard')) {
                response = "💻 **Data Structures Flashcards**:\n• Q: What is time complexity of QuickSort average case?\n  A: O(N log N)\n• Q: Difference between Tree and Graph?\n  A: Graphs can contain cycles; Trees are connected acyclic graphs.";
            } else if (text.toLowerCase().includes('plan') || text.toLowerCase().includes('schedule')) {
                response = "📅 **3-Day Master Study Plan**:\n• Day 1: Core Definitions & Formula derivations (2 hrs)\n• Day 2: Solve 10 Past Exam Questions & Practice Problems (3 hrs)\n• Day 3: Mock Test & Flashcard Review (1.5 hrs)";
            }

            this.aiMessages.push({ text: response, sender: 'ai', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
            this.aiIsThinking = false;
        }, 800);
    }
}
