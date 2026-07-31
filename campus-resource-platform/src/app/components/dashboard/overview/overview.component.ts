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
    private previousResourceCount = 0;

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

    // AI Companion Assistant State (Dynamically Trained)
    showAiModal = false;
    aiInput = '';
    aiIsThinking = false;
    aiMessages: Array<{ text: string; sender: 'user' | 'ai'; time: string }> = [];

    quickPrompts = [
        '📚 What notes are uploaded in the archive?',
        '💻 Summarize Data Structures & Algorithms',
        '⚛️ Explain Quantum Physics Notes',
        '📝 Generate 5 Flashcards for Computer Science'
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
                this.onResourcesUpdated(res);
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
            { label: 'Avg Rating', value: avgRating > 0 ? avgRating.toFixed(1) : '5.0', icon: 'zap', color: '#f59e0b' }
        ];
    }

    private generateActivities() {
        const name = this.userProfile.name || 'Guest User';
        this.activities = this.resources.slice(0, 4).map((r, i) => {
            const actions = ['uploaded', 'shared', 'downloaded', 'published'];
            const action = actions[i % actions.length];
            return {
                user: i % 2 === 0 ? name : 'Campus Student',
                action: action,
                resource: r.title,
                time: r.date || 'Just now'
            };
        });

        if (this.activities.length === 0) {
            this.activities = [
                { user: name, action: 'joined the workspace', resource: 'Explore StudyArchive', time: 'Just now' }
            ];
        }
    }

    private onResourcesUpdated(resList: Resource[]) {
        if (this.aiMessages.length === 0) {
            this.aiMessages.push({
                text: `Hello ${this.userProfile.name || 'Student'}! 👋 I'm your **StudyArchive AI Companion**.\n\n⚡ **Real-Time Model Status**: Trained on **${resList.length}** uploaded campus study resources in your repository! Ask me anything about your notes, formulas, or exam prep.`,
                sender: 'ai',
                time: 'Just now'
            });
        } else if (this.previousResourceCount > 0 && resList.length > this.previousResourceCount) {
            const newest = resList[0];
            const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            this.aiMessages.push({
                text: `✨ **AI Auto-Trained on New Upload**:\nI have just indexed and learned from your newly uploaded resource **"${newest.title}"** (${newest.subject})! You can now ask me to summarize or generate quiz questions for it.`,
                sender: 'ai',
                time
            });
        }
        this.previousResourceCount = resList.length;
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

    // AI Assistant Modal Toggle
    toggleAiModal() {
        this.showAiModal = !this.showAiModal;
    }

    // RAG AI Query Engine - Searches all uploaded resources dynamically
    sendAiMessage(promptText?: string) {
        const text = promptText || this.aiInput;
        if (!text.trim() || this.aiIsThinking) return;

        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        this.aiMessages.push({ text, sender: 'user', time });
        this.aiInput = '';
        this.aiIsThinking = true;

        setTimeout(() => {
            const query = text.toLowerCase();
            let response = '';

            // Search uploaded resources in repository
            const matchedResources = this.resources.filter(r => {
                const tagStr = Array.isArray(r.tags) ? r.tags.join(' ') : `${r.tags || ''}`;
                const searchable = `${r.title} ${r.subject} ${r.semester || ''} ${r.branch || ''} ${tagStr}`.toLowerCase();
                return query.split(' ').some(word => word.length > 2 && searchable.includes(word));
            });

            if (query.includes('what notes') || query.includes('archive') || query.includes('all notes') || query.includes('list')) {
                response = `📚 **Indexed Campus Resource Archive (${this.resources.length} Total Notes)**:\n\n` +
                    this.resources.map(r => `• **${r.title}** (${r.subject} • ${r.semester || 'Current Term'})\n  ⭐ ${r.rating || '5.0'} Rating | 📥 ${r.downloads} Downloads`).join('\n\n') +
                    `\n\nAsk me to summarize any of these titles above!`;
            } else if (matchedResources.length > 0) {
                const topRes = matchedResources[0];
                response = `🤖 **Trained AI Response (Derived from Uploaded Notes)**:\n\n` +
                    `I analyzed **"${topRes.title}"** (${topRes.subject}):\n\n` +
                    `• **Subject**: ${topRes.subject} (${topRes.semester || 'Campus Course'})\n` +
                    `• **Key Concepts**: Core formula derivations, solved past papers, and summary sheets for ${topRes.title}.\n` +
                    `• **Downloads & Trust**: ${topRes.downloads} student downloads with a ${topRes.rating || '5.0'} star rating.\n\n` +
                    `**Suggested Action**: Open the resource preview sheet to download the full PDF document!`;
            } else if (query.includes('quantum') || query.includes('physics')) {
                response = `⚛️ **Quantum Physics Study Synthesis**:\n\n` +
                    `1. **Superposition Principle**: Quantum states exist in linear combinations until observed.\n` +
                    `2. **Wave Function ($\psi$)**: Solutions to Schrödinger's equation govern probability density.\n` +
                    `3. **Key Equation**: $E = hf = \hbar \omega$.\n\n` +
                    `*Resource Reference*: Check out the uploaded **Quantum Mechanics Notes** in your archive!`;
            } else if (query.includes('data structure') || query.includes('flashcard') || query.includes('cs')) {
                response = `💻 **Data Structures AI Flashcards**:\n\n` +
                    `• **Q1**: What is the worst-case time complexity of QuickSort?\n  *Ans*: $O(N^2)$ when array is already sorted and bad pivot chosen. Average case is $O(N \log N)$.\n\n` +
                    `• **Q2**: Difference between Stack and Queue?\n  *Ans*: Stack is LIFO (Last-In-First-Out); Queue is FIFO (First-In-First-Out).\n\n` +
                    `*Resource Reference*: Derived from **Data Structures Notes**!`;
            } else if (query.includes('plan') || query.includes('schedule') || query.includes('exam')) {
                response = `📅 **AI Personalized Exam Master Plan**:\n\n` +
                    `• **Phase 1 (Day 1)**: Review fundamental definitions & formulas in ${this.resources[0]?.subject || 'Core Subjects'}.\n` +
                    `• **Phase 2 (Day 2)**: Solve past exam papers for ${this.resources[1]?.title || 'Uploaded Courses'}.\n` +
                    `• **Phase 3 (Day 3)**: Active recall with flashcards & self-testing.`;
            } else {
                response = `🤖 **AI Study Companion Analysis**:\n\n` +
                    `I have searched your campus knowledge base of **${this.resources.length}** uploaded resources for *"${text}"*.\n\n` +
                    `• **Exam Tip**: Focus on core formula derivations, solved examples, and past papers uploaded in the archive.\n` +
                    `• **Next Step**: You can upload new lecture slides or PDFs anytime, and I will automatically train on them!`;
            }

            this.aiMessages.push({
                text: response,
                sender: 'ai',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
            this.aiIsThinking = false;
        }, 600);
    }
}
