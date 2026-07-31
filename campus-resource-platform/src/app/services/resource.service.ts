import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import {
    Firestore,
    collection,
    addDoc,
    deleteDoc,
    doc,
    updateDoc,
    onSnapshot,
    query,
    orderBy,
    where
} from '@angular/fire/firestore';
import { UserService } from './user.service';

export interface Resource {
    id: string;
    title: string;
    subject: string;
    date: string;
    privacy: 'Public' | 'Private';
    downloads: number;
    rating: number;
    semester?: string;
    branch?: string;
    tags?: string | string[];
    ownerId?: string;
}

const DEFAULT_CAMPUS_RESOURCES: Resource[] = [
    {
        id: 'res-ds-algo',
        title: 'Data Structures & Algorithms Comprehensive Notes',
        subject: 'Computer Science',
        semester: '3rd Semester',
        branch: 'B.Tech CS',
        privacy: 'Public',
        downloads: 1240,
        rating: 4.9,
        date: 'Jul 28, 2026',
        tags: ['Graphs', 'Trees', 'Sorting']
    },
    {
        id: 'res-quantum-phys',
        title: 'Quantum Mechanics & Optics Lecture Series',
        subject: 'Physics',
        semester: '2nd Semester',
        branch: 'B.Sc Physics',
        privacy: 'Public',
        downloads: 850,
        rating: 4.8,
        date: 'Jul 29, 2026',
        tags: ['Quantum', 'Optics']
    },
    {
        id: 'res-discrete-math',
        title: 'Discrete Mathematics & Set Theory Formula Sheet',
        subject: 'Mathematics',
        semester: '1st Semester',
        branch: 'B.Tech CS',
        privacy: 'Public',
        downloads: 620,
        rating: 4.7,
        date: 'Jul 30, 2026',
        tags: ['Logic', 'Sets']
    },
    {
        id: 'res-ml-handbook',
        title: 'Machine Learning & Deep Neural Nets Handbook',
        subject: 'AI & Data Science',
        semester: '6th Semester',
        branch: 'B.Tech AI',
        privacy: 'Public',
        downloads: 1980,
        rating: 5.0,
        date: 'Jul 31, 2026',
        tags: ['Neural Nets', 'Python', 'AI']
    }
];

@Injectable({
    providedIn: 'root'
})
export class ResourceService {
    private firestore = inject(Firestore);
    private userService = inject(UserService);
    private platformId = inject(PLATFORM_ID);
    private isBrowser = isPlatformBrowser(this.platformId);
    private resourcesCollection = collection(this.firestore, 'resources');
    private resourcesSubject = new BehaviorSubject<Resource[]>([]);
    private unsubscribeSnapshot: (() => void) | null = null;
    private activeUserId: string = 'guest-session';

    resources$ = this.resourcesSubject.asObservable();

    constructor() {
        if (this.isBrowser) {
            this.activeUserId = this.getOrCreateGuestId();
            this.loadLocalResources(this.activeUserId);
        }

        this.userService.authState$.subscribe((isAuthenticated) => {
            if (!isAuthenticated) {
                this.clearLiveSubscription();
                this.activeUserId = this.getOrCreateGuestId();
                this.loadLocalResources(this.activeUserId);
                return;
            }

            const uid = this.userService.getCurrentUserId();
            if (uid) {
                this.activeUserId = uid;
                this.loadLocalResources(uid);
                this.startFirestoreSync(uid);
            }
        });
    }

    async addResource(resource: Omit<Resource, 'id' | 'date' | 'downloads' | 'rating'>) {
        const uid = this.activeUserId;
        const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const localResource: Resource = {
            id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            ...resource,
            ownerId: uid,
            date,
            downloads: 0,
            rating: 5.0
        };

        const optimistic = [localResource, ...this.resourcesSubject.value];
        this.resourcesSubject.next(optimistic);
        this.saveLocalResources(uid, optimistic);

        if (this.userService.isAuthenticated()) {
            try {
                await addDoc(this.resourcesCollection, {
                    ...resource,
                    ownerId: uid,
                    date,
                    downloads: 0,
                    rating: 5.0,
                    createdAt: Date.now()
                });
            } catch {
                // Keep local state for offline resilience
            }
        }
    }

    async deleteResource(id: string) {
        const uid = this.activeUserId;
        const next = this.resourcesSubject.value.filter((resource) => resource.id !== id);
        this.resourcesSubject.next(next);
        this.saveLocalResources(uid, next);

        if (this.userService.isAuthenticated() && !id.startsWith('local-') && !id.startsWith('res-')) {
            try {
                await deleteDoc(doc(this.firestore, 'resources', id));
            } catch {
                // Local state is already updated.
            }
        }
    }

    async togglePrivacy(id: string) {
        const uid = this.activeUserId;
        const next: Resource[] = this.resourcesSubject.value.map((resource) => {
            if (resource.id !== id) return resource;
            return {
                ...resource,
                privacy: (resource.privacy === 'Public' ? 'Private' : 'Public') as 'Public' | 'Private'
            };
        });
        this.resourcesSubject.next(next);
        this.saveLocalResources(uid, next);

        const changed = next.find((resource) => resource.id === id);
        if (!changed || id.startsWith('local-') || id.startsWith('res-') || !this.userService.isAuthenticated()) return;

        try {
            await updateDoc(doc(this.firestore, 'resources', id), { privacy: changed.privacy });
        } catch {
            // Keep local state
        }
    }

    updateResource(id: string, changes: Partial<Pick<Resource, 'title' | 'subject' | 'semester' | 'branch' | 'tags'>>) {
        const uid = this.activeUserId;
        const next = this.resourcesSubject.value.map((resource) => {
            if (resource.id !== id) return resource;
            return { ...resource, ...changes };
        });

        this.resourcesSubject.next(next);
        this.saveLocalResources(uid, next);

        if (id.startsWith('local-') || id.startsWith('res-') || !this.userService.isAuthenticated()) return;

        updateDoc(doc(this.firestore, 'resources', id), changes).catch(() => {});
    }

    incrementDownloads(id: string) {
        const uid = this.activeUserId;
        const next = this.resourcesSubject.value.map((resource) => {
            if (resource.id !== id) return resource;
            return { ...resource, downloads: (resource.downloads || 0) + 1 };
        });
        this.resourcesSubject.next(next);
        this.saveLocalResources(uid, next);

        if (id.startsWith('local-') || id.startsWith('res-') || !this.userService.isAuthenticated()) return;
        const changed = next.find((resource) => resource.id === id);
        if (!changed) return;

        updateDoc(doc(this.firestore, 'resources', id), { downloads: changed.downloads }).catch(() => {});
    }

    private startFirestoreSync(uid: string) {
        this.clearLiveSubscription();

        try {
            const q = query(this.resourcesCollection, where('ownerId', '==', uid), orderBy('createdAt', 'desc'));
            this.unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
                const firestoreDocs = snapshot.docs.map((item) => {
                    const data = item.data() as Record<string, unknown>;
                    return {
                        id: item.id,
                        title: (data['title'] as string) || '',
                        subject: (data['subject'] as string) || '',
                        date: (data['date'] as string) || new Date().toLocaleDateString(),
                        privacy: ((data['privacy'] as 'Public' | 'Private') || 'Public'),
                        downloads: Number(data['downloads'] || 0),
                        rating: Number(data['rating'] || 5.0),
                        semester: data['semester'] as string | undefined,
                        branch: data['branch'] as string | undefined,
                        tags: data['tags'] as string | string[] | undefined,
                        ownerId: (data['ownerId'] as string) || uid
                    } as Resource;
                });

                const combined = [...firestoreDocs, ...DEFAULT_CAMPUS_RESOURCES];
                this.resourcesSubject.next(combined);
                this.saveLocalResources(uid, combined);
            });
        } catch {
            // Local storage fallback
        }
    }

    private clearLiveSubscription() {
        if (this.unsubscribeSnapshot) {
            this.unsubscribeSnapshot();
            this.unsubscribeSnapshot = null;
        }
    }

    private loadLocalResources(uid: string) {
        if (!this.isBrowser) return;
        const raw = localStorage.getItem(this.storageKey(uid));
        if (!raw) {
            this.resourcesSubject.next(DEFAULT_CAMPUS_RESOURCES);
            this.saveLocalResources(uid, DEFAULT_CAMPUS_RESOURCES);
            return;
        }

        try {
            const parsed = JSON.parse(raw) as Resource[];
            if (Array.isArray(parsed) && parsed.length > 0) {
                this.resourcesSubject.next(parsed);
            } else {
                this.resourcesSubject.next(DEFAULT_CAMPUS_RESOURCES);
            }
        } catch {
            this.resourcesSubject.next(DEFAULT_CAMPUS_RESOURCES);
        }
    }

    private saveLocalResources(uid: string, resources: Resource[]) {
        if (!this.isBrowser) return;
        localStorage.setItem(this.storageKey(uid), JSON.stringify(resources));
    }

    private getOrCreateGuestId(): string {
        if (!this.isBrowser) return 'guest-session';
        let gid = localStorage.getItem('guest_user_id');
        if (!gid) {
            gid = `guest-${Date.now()}`;
            localStorage.setItem('guest_user_id', gid);
        }
        return gid;
    }

    private storageKey(uid: string): string {
        return `resources_${uid}`;
    }
}
