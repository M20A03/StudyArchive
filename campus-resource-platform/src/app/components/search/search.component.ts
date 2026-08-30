import { Component, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ResourceCardComponent } from '../shared/resource-card/resource-card.component';
import { ResourceService } from '../../services/resource.service';
import { Resource, SearchFilterState } from '../../core/models';
import { ToastService } from '../../core/toast.service';

@Component({
    selector: 'app-search',
    standalone: true,
    imports: [CommonModule, ResourceCardComponent, FormsModule, RouterModule],
    templateUrl: './search.component.html',
    styleUrl: './search.component.scss'
})
export class SearchComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private resourceService = inject(ResourceService);
    private toastService = inject(ToastService);

    searchQuery = '';
    viewMode: 'grid' | 'list' = 'grid';

    filters = {
        subject: 'All Subjects',
        semester: 'All Semesters',
        type: 'All Types',
        branch: 'All Branches'
    };

    activeModalResource: Resource | null = null;
    resources: Resource[] = this.defaultResources();

    ngOnInit(): void {
        // Hydrate search filter state from URL Query Parameters
        this.route.queryParamMap.subscribe((params) => {
            this.searchQuery = params.get('q') || '';
            this.filters.subject = params.get('subject') || 'All Subjects';
            this.filters.semester = params.get('semester') || 'All Semesters';
            this.filters.type = params.get('type') || 'All Types';
            this.filters.branch = params.get('branch') || 'All Branches';
            this.viewMode = (params.get('view') as 'grid' | 'list') || 'grid';

            const resourceId = params.get('resourceId');
            if (resourceId) {
                this.openResourceModalById(resourceId);
            } else {
                this.activeModalResource = null;
            }
        });

        this.resourceService.resources$.subscribe((myResources) => {
            const combined = [...myResources, ...this.defaultResources()];
            // Deduplicate by id
            const seen = new Set<string>();
            this.resources = combined.filter((r) => {
                if (seen.has(r.id)) return false;
                seen.add(r.id);
                return true;
            });

            const currentParamId = this.route.snapshot.queryParamMap.get('resourceId');
            if (currentParamId) {
                this.openResourceModalById(currentParamId);
            }
        });
    }

    filteredResources(): Resource[] {
        const queryText = this.searchQuery.trim().toLowerCase();
        return this.resources.filter(
            (res) => this.matchesSearch(res, queryText) && this.matchesSelectFilters(res)
        );
    }

    syncStateToUrl() {
        const queryParams: Record<string, string | null> = {
            q: this.searchQuery.trim() || null,
            subject: this.filters.subject !== 'All Subjects' ? this.filters.subject : null,
            semester: this.filters.semester !== 'All Semesters' ? this.filters.semester : null,
            type: this.filters.type !== 'All Types' ? this.filters.type : null,
            branch: this.filters.branch !== 'All Branches' ? this.filters.branch : null,
            view: this.viewMode !== 'grid' ? this.viewMode : null
        };

        this.router.navigate([], {
            relativeTo: this.route,
            queryParams,
            queryParamsHandling: 'merge'
        });
    }

    setViewMode(mode: 'grid' | 'list') {
        this.viewMode = mode;
        this.syncStateToUrl();
    }

    clearFilters() {
        this.searchQuery = '';
        this.filters = {
            subject: 'All Subjects',
            semester: 'All Semesters',
            type: 'All Types',
            branch: 'All Branches'
        };
        this.syncStateToUrl();
    }

    openResourceModal(resource: Resource) {
        this.activeModalResource = resource;
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { resourceId: resource.id },
            queryParamsHandling: 'merge'
        });
    }

    closeResourceModal() {
        this.activeModalResource = null;
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { resourceId: null },
            queryParamsHandling: 'merge'
        });
    }

    onDownload(resource: Resource) {
        this.resourceService.incrementDownloads(resource.id);
        this.toastService.success(`Downloading "${resource.title}"...`, 'Download Started');
    }

    @HostListener('document:keydown.escape')
    handleEscape() {
        if (this.activeModalResource) {
            this.closeResourceModal();
        }
    }

    private openResourceModalById(id: string) {
        const found = this.resources.find((r) => r.id === id);
        if (found) {
            this.activeModalResource = found;
        }
    }

    private matchesSearch(resource: Resource, queryText: string): boolean {
        if (!queryText) return true;
        const tagText = Array.isArray(resource.tags) ? resource.tags.join(' ') : `${resource.tags || ''}`;
        const searchable = `${resource.title} ${resource.subject} ${resource.branch || ''} ${tagText}`.toLowerCase();
        return searchable.includes(queryText);
    }

    private matchesSelectFilters(resource: Resource): boolean {
        const subjectMatch = this.filters.subject === 'All Subjects' || resource.subject === this.filters.subject;
        const semesterMatch = this.filters.semester === 'All Semesters' || resource.semester === this.filters.semester;
        const branchMatch = this.filters.branch === 'All Branches' || resource.branch === this.filters.branch;
        return subjectMatch && semesterMatch && branchMatch;
    }

    private defaultResources(): Resource[] {
        return [
            {
                id: 'sample-1',
                title: 'Data Structures & Algorithms Comprehensive Guide',
                subject: 'Computer Science',
                branch: 'B.Tech CS',
                semester: '3rd Semester',
                tags: ['Graph Theory', 'Dynamic Programming', 'Trees'],
                privacy: 'Public',
                rating: 4.9,
                downloads: 842,
                date: 'Feb 2024',
                description: 'Detailed lecture notes covering sorting algorithms, red-black trees, graph algorithms (Dijkstra, Bellman-Ford), and asymptotic complexity analysis.'
            },
            {
                id: 'sample-2',
                title: 'Quantum Physics Fundamentals & Wave Mechanics',
                subject: 'Physics',
                branch: 'B.Sc Physics',
                semester: '2nd Semester',
                tags: ['Schrodinger Equation', 'Wave Packets', 'Quantum States'],
                privacy: 'Public',
                rating: 4.8,
                downloads: 512,
                date: 'Jan 2024',
                description: 'Complete syllabus guide for quantum mechanics, mathematical foundations, and particle-in-a-box problem walkthroughs.'
            },
            {
                id: 'sample-3',
                title: 'Discrete Mathematics & Combinatorics Proofs',
                subject: 'Mathematics',
                branch: 'B.Tech CS',
                semester: '1st Semester',
                tags: ['Set Theory', 'Propositional Logic', 'Recurrence'],
                privacy: 'Public',
                rating: 4.9,
                downloads: 980,
                date: 'Mar 2024',
                description: 'Handwritten problem sheets and proven theorems covering induction, pigeonhole principle, and Boolean algebra.'
            },
            {
                id: 'sample-4',
                title: 'Operating Systems Kernel Architecture & Threading',
                subject: 'Computer Science',
                branch: 'B.Tech CS',
                semester: '4th Semester',
                tags: ['Virtual Memory', 'Deadlock', 'POSIX Threads'],
                privacy: 'Public',
                rating: 4.7,
                downloads: 630,
                date: 'Dec 2023',
                description: 'In-depth notes on concurrency control, semaphore primitives, memory paging mechanisms, and disk scheduling algorithms.'
            },
            {
                id: 'sample-5',
                title: 'Microeconomics Theory & Market Models',
                subject: 'Economics',
                branch: 'BA Economics',
                semester: '2nd Semester',
                tags: ['Supply Demand', 'Game Theory', 'Elasticity'],
                privacy: 'Public',
                rating: 4.6,
                downloads: 340,
                date: 'Feb 2024',
                description: 'Analytical study notes on consumer choice, Nash equilibrium, monopoly pricing, and welfare economics.'
            },
            {
                id: 'sample-6',
                title: 'Organic Chemistry Reactions & Synthesis Pathways',
                subject: 'Chemistry',
                branch: 'B.Sc Physics',
                semester: '1st Semester',
                tags: ['Reaction Mechanisms', 'NMR Spectroscopy', 'Synthesis'],
                privacy: 'Public',
                rating: 4.7,
                downloads: 415,
                date: 'Apr 2024',
                description: 'Laboratory experimental procedures and mechanism reaction roadmaps for university term exams.'
            }
        ];
    }
}
