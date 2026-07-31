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
    private activeUserId: string | null = null;

    resources$ = this.resourcesSubject.asObservable();

    constructor() {
        this.userService.authState$.subscribe((isAuthenticated) => {
            if (!isAuthenticated) {
                this.clearLiveSubscription();
                this.activeUserId = null;
                this.resourcesSubject.next([]);
                return;
            }

            const uid = this.userService.getCurrentUserId();
            if (!uid) {
                this.resourcesSubject.next([]);
                return;
            }

            this.activeUserId = uid;
            this.loadLocalResources(uid);
            this.startFirestoreSync(uid);
        });
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
            rating: 0
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
                rating: 0,
                createdAt: Date.now()
            });
        } catch {
            // Keep local data so app still works in offline or restricted firestore scenarios.
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
                // Local state is already updated.
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
            // Keep local privacy value for resilience.
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
            // Keep local edits even if remote update fails.
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
            // Keep local value even if remote update fails.
        });
    }

    private startFirestoreSync(uid: string) {
        this.clearLiveSubscription();

        try {
            const q = query(this.resourcesCollection, where('ownerId', '==', uid), orderBy('createdAt', 'desc'));
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
                        rating: Number(data['rating'] || 0),
                        semester: data['semester'] as string | undefined,
                        branch: data['branch'] as string | undefined,
                        tags: data['tags'] as string | string[] | undefined,
                        ownerId: (data['ownerId'] as string) || uid
                    } as Resource;
                });

                this.resourcesSubject.next(resources);
                this.saveLocalResources(uid, resources);
            });
        } catch {
            // If firestore query fails (rules/index/network), local storage still powers the app.
        }
    }

    private clearLiveSubscription() {
        if (this.unsubscribeSnapshot) {
            this.unsubscribeSnapshot();
            this.unsubscribeSnapshot = null;
        }
    }

    private requireUserId(): string {
        const uid = this.activeUserId ?? this.userService.getCurrentUserId();
        if (!uid) {
            throw new Error('Please login first.');
        }
        return uid;
    }

    private loadLocalResources(uid: string) {
        if (!this.isBrowser) return;
        const raw = localStorage.getItem(this.storageKey(uid));
        if (!raw) {
            this.resourcesSubject.next([]);
            return;
        }

        try {
            const parsed = JSON.parse(raw) as Resource[];
            this.resourcesSubject.next(Array.isArray(parsed) ? parsed : []);
        } catch {
            this.resourcesSubject.next([]);
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
