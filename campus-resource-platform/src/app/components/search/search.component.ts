import { Component, HostListener, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ResourceCardComponent } from '../shared/resource-card/resource-card.component';
import { ResourceService } from '../../services/resource.service';
import { BookmarkService } from '../../core/bookmark.service';
import { Resource } from '../../core/models';
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
  private bookmarkService = inject(BookmarkService);
  private toastService = inject(ToastService);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  searchQuery = '';
  viewMode: 'grid' | 'list' = 'grid';
  selectedCategory = 'All Categories';
  sortBy = 'rating'; // 'rating' | 'downloads' | 'newest'

  categories = [
    'All Categories',
    'Lecture Notes',
    'Question Papers',
    'Lab Manuals',
    'Syllabus',
    'Cheatsheets'
  ];

  filters = {
    subject: 'All Subjects',
    semester: 'All Semesters',
    branch: 'All Branches'
  };

  subjects = [
    'All Subjects',
    'Computer Science',
    'Physics',
    'Mathematics',
    'Economics',
    'Chemistry',
    'Electronics',
    'Mechanical'
  ];

  semesters = [
    'All Semesters',
    '1st Semester',
    '2nd Semester',
    '3rd Semester',
    '4th Semester',
    '5th Semester',
    '6th Semester',
    '7th Semester',
    '8th Semester'
  ];

  branches = [
    'All Branches',
    'B.Tech CS',
    'B.Tech IT',
    'B.Sc Physics',
    'BA Economics',
    'B.Tech ECE',
    'B.Tech Mech'
  ];

  activeModalResource: Resource | null = null;
  hoveredStar = 0;
  resources: Resource[] = this.defaultResources();

  ngOnInit(): void {
    // Hydrate search filter state from URL Query Parameters
    this.route.queryParamMap.subscribe((params) => {
      this.searchQuery = params.get('q') || '';
      this.filters.subject = params.get('subject') || 'All Subjects';
      this.filters.semester = params.get('semester') || 'All Semesters';
      this.filters.branch = params.get('branch') || 'All Branches';
      this.selectedCategory = params.get('category') || 'All Categories';
      this.sortBy = params.get('sort') || 'rating';
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
    const result = this.resources.filter(
      (res) => this.matchesSearch(res, queryText) && this.matchesSelectFilters(res)
    );

    // Sorting
    return result.sort((a, b) => {
      if (this.sortBy === 'rating') {
        return (b.rating || 0) - (a.rating || 0);
      } else if (this.sortBy === 'downloads') {
        return (b.downloads || 0) - (a.downloads || 0);
      } else if (this.sortBy === 'newest') {
        return (b.id.localeCompare(a.id));
      }
      return 0;
    });
  }

  setCategory(cat: string) {
    this.selectedCategory = cat;
    this.syncStateToUrl();
  }

  syncStateToUrl() {
    const queryParams: Record<string, string | null> = {
      q: this.searchQuery.trim() || null,
      subject: this.filters.subject !== 'All Subjects' ? this.filters.subject : null,
      semester: this.filters.semester !== 'All Semesters' ? this.filters.semester : null,
      branch: this.filters.branch !== 'All Branches' ? this.filters.branch : null,
      category: this.selectedCategory !== 'All Categories' ? this.selectedCategory : null,
      sort: this.sortBy !== 'rating' ? this.sortBy : null,
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
    this.selectedCategory = 'All Categories';
    this.sortBy = 'rating';
    this.filters = {
      subject: 'All Subjects',
      semester: 'All Semesters',
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

  isBookmarked(resId: string): boolean {
    return this.bookmarkService.isBookmarked(resId);
  }

  toggleModalBookmark() {
    if (!this.activeModalResource) return;
    this.bookmarkService.toggleBookmark(this.activeModalResource);
  }

  copyShareLink() {
    if (!this.activeModalResource || !this.isBrowser) return;
    const url = window.location.origin + '/dashboard/search?resourceId=' + this.activeModalResource.id;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        this.toastService.success('Direct resource link copied to clipboard!', 'Link Copied');
      }).catch(() => {
        this.toastService.info(url, 'Share Link');
      });
    } else {
      this.toastService.info(url, 'Share Link');
    }
  }

  rateResource(stars: number) {
    if (!this.activeModalResource) return;
    this.activeModalResource.userRating = stars;
    // Calculate new optimistic rating
    const currentRating = this.activeModalResource.rating || 5.0;
    this.activeModalResource.rating = Number(((currentRating + stars) / 2).toFixed(1));
    this.toastService.success(`You gave ${stars} stars to "${this.activeModalResource.title}"!`, 'Rating Recorded');
  }

  onDownload(resource: Resource) {
    this.resourceService.incrementDownloads(resource.id);
    resource.downloads = (resource.downloads || 0) + 1;
    this.toastService.success(`Downloading "${resource.title}"...`, 'Download Started');
  }

  @HostListener('document:keydown.escape')
  handleEscape() {
    if (this.activeModalResource) {
      this.closeResourceModal();
    }
  }

  getTagsList(tags: string | string[] | undefined): string[] {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;
    return tags.split(',').map((t) => t.trim()).filter((t) => t.length > 0);
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
    const categoryText = resource.category || '';
    const searchable = `${resource.title} ${resource.subject} ${resource.branch || ''} ${categoryText} ${tagText}`.toLowerCase();
    return searchable.includes(queryText);
  }

  private matchesSelectFilters(resource: Resource): boolean {
    const subjectMatch = this.filters.subject === 'All Subjects' || resource.subject === this.filters.subject;
    const semesterMatch = this.filters.semester === 'All Semesters' || resource.semester === this.filters.semester;
    const branchMatch = this.filters.branch === 'All Branches' || resource.branch === this.filters.branch;
    const categoryMatch = this.selectedCategory === 'All Categories' || resource.category === this.selectedCategory;
    return subjectMatch && semesterMatch && branchMatch && categoryMatch;
  }

  private defaultResources(): Resource[] {
    return [
      {
        id: 'sample-1',
        title: 'Data Structures & Algorithms Comprehensive Master Guide',
        subject: 'Computer Science',
        branch: 'B.Tech CS',
        semester: '3rd Semester',
        category: 'Lecture Notes',
        tags: ['Graph Theory', 'Dynamic Programming', 'Red-Black Trees', 'Asymptotic Complexity'],
        privacy: 'Public',
        rating: 4.9,
        downloads: 842,
        date: 'Feb 2024',
        fileName: 'DSA_Comprehensive_Guide_Sem3.pdf',
        fileType: 'pdf',
        size: 4200000,
        pageCount: 38,
        description: 'Complete lecture notes covering asymptotic complexity analysis, sorting algorithms, red-black trees, disjoint sets, graph algorithms (Dijkstra, Bellman-Ford, Floyd-Warshall), and dynamic programming patterns with solved university exam problems.'
      },
      {
        id: 'sample-2',
        title: 'Quantum Physics Fundamentals & Wave Mechanics Solved Papers',
        subject: 'Physics',
        branch: 'B.Sc Physics',
        semester: '2nd Semester',
        category: 'Question Papers',
        tags: ['Schrodinger Equation', 'Wave Packets', 'Quantum States', 'Perturbation Theory'],
        privacy: 'Public',
        rating: 4.8,
        downloads: 512,
        date: 'Jan 2024',
        fileName: 'Quantum_Mechanics_Past_Papers.pdf',
        fileType: 'pdf',
        size: 3100000,
        pageCount: 24,
        description: 'Past 5 years solved university examination papers for wave mechanics, particle-in-a-box boundary conditions, harmonic oscillator eigenstates, and operator algebra walkthroughs.'
      },
      {
        id: 'sample-3',
        title: 'Discrete Mathematics & Combinatorics Cheatsheet',
        subject: 'Mathematics',
        branch: 'B.Tech CS',
        semester: '1st Semester',
        category: 'Cheatsheets',
        tags: ['Set Theory', 'Propositional Logic', 'Recurrence Relations', 'Pigeonhole Principle'],
        privacy: 'Public',
        rating: 4.9,
        downloads: 980,
        date: 'Mar 2024',
        fileName: 'Discrete_Math_Cheatsheet_v2.pdf',
        fileType: 'pdf',
        size: 1800000,
        pageCount: 8,
        description: 'Compact 8-page quick revision cheatsheet containing essential theorems, Boolean algebra rules, graph isomorphism conditions, recurrence relation master theorems, and induction templates.'
      },
      {
        id: 'sample-4',
        title: 'Operating Systems Kernel Architecture & Threading Manual',
        subject: 'Computer Science',
        branch: 'B.Tech CS',
        semester: '4th Semester',
        category: 'Lab Manuals',
        tags: ['Virtual Memory', 'Deadlock Detection', 'POSIX Threads', 'Semaphore Primitives'],
        privacy: 'Public',
        rating: 4.7,
        downloads: 630,
        date: 'Dec 2023',
        fileName: 'OS_Kernel_Lab_Manual.pdf',
        fileType: 'pdf',
        size: 5600000,
        pageCount: 52,
        description: 'Practical lab instructions and implementation code for process synchronization primitives, deadlock avoidance algorithms, Linux paging simulation, and fork-exec pipeline examples.'
      },
      {
        id: 'sample-5',
        title: 'Microeconomics Theory & Market Models Syllabus Summary',
        subject: 'Economics',
        branch: 'BA Economics',
        semester: '2nd Semester',
        category: 'Syllabus',
        tags: ['Supply Demand', 'Game Theory', 'Elasticity', 'Nash Equilibrium'],
        privacy: 'Public',
        rating: 4.6,
        downloads: 340,
        date: 'Feb 2024',
        fileName: 'Microeconomics_Course_Summary.docx',
        fileType: 'docx',
        size: 2400000,
        pageCount: 19,
        description: 'Comprehensive syllabus review notes on consumer preference curves, Cobb-Douglas utility optimization, monopoly vs oligopoly pricing, game theoretic equilibria, and externality remedies.'
      },
      {
        id: 'sample-6',
        title: 'Organic Chemistry Reactions & Synthesis Mechanism Roadmaps',
        subject: 'Chemistry',
        branch: 'B.Sc Physics',
        semester: '1st Semester',
        category: 'Lecture Notes',
        tags: ['Reaction Mechanisms', 'NMR Spectroscopy', 'Synthesis Roadmaps', 'Electrophilic Addition'],
        privacy: 'Public',
        rating: 4.7,
        downloads: 415,
        date: 'Apr 2024',
        fileName: 'Organic_Chemistry_Roadmaps.pdf',
        fileType: 'pdf',
        size: 6100000,
        pageCount: 44,
        description: 'Color-coded visual chemical synthesis roadmaps, step-by-step electron pushing arrows for SN1/SN2/E1/E2 reactions, and carbon-13 NMR spectra interpretation charts.'
      }
    ];
  }
}
