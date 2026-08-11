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
    orderBy
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
        this.userService.authState$.subscribe((isAuthenticated) => {
            const uid = isAuthenticated
                ? (this.userService.getCurrentUserId() || 'guest-session')
                : 'guest-session';

            this.activeUserId = uid;
            this.loadLocalResources(uid);
            this.startFirestoreSync(uid);
        });

        // Initial trigger for guest visitors
        this.loadLocalResources('guest-session');
        this.startFirestoreSync('guest-session');
    }

    async addResource(resource: Omit<Resource, 'id' | 'date' | 'downloads' | 'rating'>) {
        const uid = this.requireUserId();
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
            // Keep local resource for resilient offline usage
        }
    }

    async deleteResource(id: string) {
        const uid = this.requireUserId();
        const next = this.resourcesSubject.value.filter((resource) => resource.id !== id);
        this.resourcesSubject.next(next);
        this.saveLocalResources(uid, next);

        if (!id.startsWith('local-')) {
            try {
                await deleteDoc(doc(this.firestore, 'resources', id));
            } catch {
                // Local deletion retained
            }
        }
    }

    async togglePrivacy(id: string) {
        const uid = this.requireUserId();
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
        if (!changed || id.startsWith('local-')) return;

        try {
            await updateDoc(doc(this.firestore, 'resources', id), { privacy: changed.privacy });
        } catch {
            // Retain local state
        }
    }

    updateResource(id: string, changes: Partial<Pick<Resource, 'title' | 'subject' | 'semester' | 'branch' | 'tags'>>) {
        const uid = this.requireUserId();
        const next = this.resourcesSubject.value.map((resource) => {
            if (resource.id !== id) return resource;
            return { ...resource, ...changes };
        });

        this.resourcesSubject.next(next);
        this.saveLocalResources(uid, next);

        if (id.startsWith('local-')) return;

        updateDoc(doc(this.firestore, 'resources', id), changes).catch(() => {
            // Retain local state
        });
    }

    incrementDownloads(id: string) {
        const uid = this.requireUserId();
        const next = this.resourcesSubject.value.map((resource) => {
            if (resource.id !== id) return resource;
            return { ...resource, downloads: (resource.downloads || 0) + 1 };
        });
        this.resourcesSubject.next(next);
        this.saveLocalResources(uid, next);

        if (id.startsWith('local-')) return;
        const changed = next.find((resource) => resource.id === id);
        if (!changed) return;

        updateDoc(doc(this.firestore, 'resources', id), { downloads: changed.downloads }).catch(() => {
            // Retain local state
        });
    }

    private startFirestoreSync(uid: string) {
        this.clearLiveSubscription();

        try {
            const q = query(this.resourcesCollection, orderBy('createdAt', 'desc'));
            this.unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
                const resources = snapshot.docs.map((item) => {
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
                        ownerId: (data['ownerId'] as string) || 'guest-session'
                    } as Resource;
                });

                // Filter: show all Public resources + user's own Private resources
                const filtered = resources.filter(res => res.privacy === 'Public' || res.ownerId === uid);
                
                // Merge with local-only resources
                const localOnly = this.resourcesSubject.value.filter(r => r.id.startsWith('local-'));
                const merged = [...localOnly, ...filtered.filter(f => !localOnly.some(l => l.id === f.id))];

                this.resourcesSubject.next(merged);
                this.saveLocalResources(uid, merged);
            }, () => {
                this.loadLocalResources(uid);
            });
        } catch {
            this.loadLocalResources(uid);
        }
    }

    private clearLiveSubscription() {
        if (this.unsubscribeSnapshot) {
            this.unsubscribeSnapshot();
            this.unsubscribeSnapshot = null;
        }
    }

    private requireUserId(): string {
        return this.activeUserId ?? this.userService.getCurrentUserId() ?? 'guest-session';
    }

    private loadLocalResources(uid: string) {
        if (!this.isBrowser) return;
        const raw = localStorage.getItem(this.storageKey(uid));
        if (!raw) {
            return;
        }

        try {
            const parsed = JSON.parse(raw) as Resource[];
            if (Array.isArray(parsed) && parsed.length > 0) {
                this.resourcesSubject.next(parsed);
            }
        } catch {
            // Keep current subject state
        }
    }

    private saveLocalResources(uid: string, resources: Resource[]) {
        if (!this.isBrowser) return;
        localStorage.setItem(this.storageKey(uid), JSON.stringify(resources));
    }

    private storageKey(uid: string): string {
        return `resources_${uid}`;
    }
}
