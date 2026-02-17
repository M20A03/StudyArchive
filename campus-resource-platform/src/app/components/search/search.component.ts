import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResourceCardComponent } from '../shared/resource-card/resource-card.component';
import { FormsModule } from '@angular/forms';

import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Resource, ResourceService } from '../../services/resource.service';

@Component({
    selector: 'app-search',
    standalone: true,
    imports: [CommonModule, ResourceCardComponent, FormsModule, RouterModule],

    templateUrl: './search.component.html',
    styleUrl: './search.component.scss'
})
export class SearchComponent {
    searchQuery = '';
    viewMode: 'grid' | 'list' = 'grid';

    filters = {
        subject: 'All Subjects',
        semester: 'All Semesters',
        type: 'All Types',
        branch: 'All Branches'
    };

    resources: Resource[] = this.defaultResources();

    constructor(private route: ActivatedRoute, private router: Router, private resourceService: ResourceService) {
        this.route.queryParamMap.subscribe((params) => {
            this.searchQuery = params.get('q') ?? '';
        });

        this.resourceService.resources$.subscribe((myResources) => {
            this.resources = [...myResources, ...this.defaultResources()];
        });
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
        if (!resourceId.startsWith('sample-')) {
            this.resourceService.incrementDownloads(resourceId);
        }
        alert('Download started');
    }

    private defaultResources(): Resource[] {
        return [
            { title: 'Data Structures & Algorithms', subject: 'CS', tags: ['Graph', 'Trees'], privacy: 'Public', rating: 4.8, downloads: 542, date: 'Feb 2024', id: 'sample-1' },
            { title: 'Physics Fundamentals', subject: 'Physics', tags: ['Quantum', 'Mechanics'], privacy: 'Public', rating: 4.5, downloads: 321, date: 'Jan 2024', id: 'sample-2' },
            { title: 'Economics Overview', subject: 'Arts', tags: ['Macro', 'Finance'], privacy: 'Private', rating: 4.2, downloads: 128, date: 'Mar 2024', id: 'sample-3' },
            { title: 'Discrete Mathematics', subject: 'Math', tags: ['Logic', 'Sets'], privacy: 'Public', rating: 4.9, downloads: 876, date: 'Dec 2023', id: 'sample-4' },
            { title: 'Operating Systems', subject: 'CS', tags: ['Kernel', 'CPU'], privacy: 'Public', rating: 4.7, downloads: 432, date: 'Jan 2024', id: 'sample-5' },
            { title: 'Chemistry Lab Guide', subject: 'Science', tags: ['Organic', 'Experiments'], privacy: 'Public', rating: 4.4, downloads: 254, date: 'Feb 2024', id: 'sample-6' }
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
