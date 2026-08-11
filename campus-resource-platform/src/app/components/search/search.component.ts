import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResourceCardComponent } from '../shared/resource-card/resource-card.component';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { Resource, ResourceService } from '../../services/resource.service';

@Component({
    selector: 'app-search',
    standalone: true,
    imports: [CommonModule, ResourceCardComponent, FormsModule, RouterModule],
    templateUrl: './search.component.html',
    styleUrl: './search.component.scss'
})
export class SearchComponent implements OnInit, OnDestroy {
    searchQuery = '';
    viewMode: 'grid' | 'list' = 'grid';
    private sub = new Subscription();

    filters = {
        subject: 'All Subjects',
        semester: 'All Semesters',
        type: 'All Types',
        branch: 'All Branches'
    };

    resources: Resource[] = [];

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private resourceService: ResourceService
    ) {}

    ngOnInit() {
        this.sub.add(
            this.route.queryParamMap.subscribe((params) => {
                this.searchQuery = params.get('q') ?? '';
            })
        );

        this.sub.add(
            this.resourceService.resources$.subscribe((liveResources) => {
                if (liveResources && liveResources.length > 0) {
                    this.resources = liveResources;
                } else {
                    this.resources = this.communityDefaults();
                }
            })
        );
    }

    ngOnDestroy() {
        this.sub.unsubscribe();
    }

    filteredResources() {
        const queryText = this.searchQuery.trim().toLowerCase();
        return this.resources.filter(res =>
            this.matchesSearch(res, queryText) &&
            this.matchesSelectFilters(res)
        );
    }

    clearFilters() {
        this.searchQuery = '';
        this.filters = {
            subject: 'All Subjects',
            semester: 'All Semesters',
            type: 'All Types',
            branch: 'All Branches'
        };
    }

    runSearch() {
        const query = this.searchQuery.trim();
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { q: query || null },
            queryParamsHandling: 'merge'
        });
    }

    onDownloadResource(resourceId: string) {
        this.resourceService.incrementDownloads(resourceId);
    }

    private communityDefaults(): Resource[] {
        return [
            { id: 'comm-1', title: 'Data Structures & Algorithms Cheat Sheet', subject: 'Computer Science', date: 'Feb 2026', privacy: 'Public', downloads: 142, rating: 4.9, semester: '3rd Semester', branch: 'Computer Science' },
            { id: 'comm-2', title: 'Quantum Mechanics Lecture Notes', subject: 'Physics', date: 'Jan 2026', privacy: 'Public', downloads: 98, rating: 4.8, semester: '4th Semester', branch: 'Physics' },
            { id: 'comm-3', title: 'Calculus II Integration Formula Guide', subject: 'Mathematics', date: 'Mar 2026', privacy: 'Public', downloads: 215, rating: 5.0, semester: '2nd Semester', branch: 'Mathematics' }
        ];
    }

    private matchesSearch(resource: Resource, queryText: string): boolean {
        if (!queryText) return true;

        const tagText = Array.isArray(resource.tags) ? resource.tags.join(' ') : `${resource.tags ?? ''}`;
        const searchable = `${resource.title} ${resource.subject} ${tagText}`.toLowerCase();
        return searchable.includes(queryText);
    }

    private matchesSelectFilters(resource: Resource): boolean {
        const subjectMatch = this.filters.subject === 'All Subjects' || resource.subject === this.filters.subject;
        const semesterMatch = this.filters.semester === 'All Semesters' || resource.semester === this.filters.semester;
        const branchMatch = this.filters.branch === 'All Branches' || resource.branch === this.filters.branch;
        return subjectMatch && semesterMatch && branchMatch;
    }
}
