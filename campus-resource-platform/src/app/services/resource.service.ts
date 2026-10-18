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
import { Resource } from '../core/models';
import { ToastService } from '../core/toast.service';

@Injectable({
    providedIn: 'root'
})
export class ResourceService {
    private firestore = inject(Firestore);
    private userService = inject(UserService);
    private toastService = inject(ToastService);
    private platformId = inject(PLATFORM_ID);
    private isBrowser = isPlatformBrowser(this.platformId);
    private resourcesCollection = collection(this.firestore, 'resources');
    private resourcesSubject = new BehaviorSubject<Resource[]>([]);
    private unsubscribeSnapshot: (() => void) | null = null;
    private activeUserId: string | null = null;

    resources$ = this.resourcesSubject.asObservable();

    // Idempotency tracking to prevent double submissions
    private pendingOperations = new Set<string>();

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

    async addResource(
        resourceData: Omit<Resource, 'id' | 'date' | 'downloads' | 'rating'>,
        idempotencyKey?: string
    ): Promise<string> {
        const uid = this.requireUserId();
        const opKey = idempotencyKey || `add-${resourceData.title}-${Date.now()}`;

        if (this.pendingOperations.has(opKey)) {
            console.warn('[ResourceService] Duplicate addResource invocation prevented by idempotency guard.');
            return opKey;
        }
        this.pendingOperations.add(opKey);

        const date = new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const localResource: Resource = {
            id: localId,
            ...resourceData,
            ownerId: uid,
            date,
            downloads: 0,
            rating: 5.0,
            createdAt: Date.now(),
            idempotencyKey: opKey
        };

        // Optimistic UI update
        const optimistic = [localResource, ...this.resourcesSubject.value];
        this.resourcesSubject.next(optimistic);
        this.saveLocalResources(uid, optimistic);

        try {
            const docRef = await addDoc(this.resourcesCollection, {
                ...resourceData,
                ownerId: uid,
                date,
                downloads: 0,
                rating: 5.0,
                createdAt: Date.now(),
                idempotencyKey: opKey
            });

            this.toastService.success(`"${resourceData.title}" published successfully!`, 'Resource Uploaded');
            return docRef.id;
        } catch (error) {
            console.warn('[ResourceService] Firestore offline or rejected write. Resource cached locally.', error);
            this.toastService.warning('Resource saved locally (offline mode).', 'Offline Storage');
            return localId;
        } finally {
            this.pendingOperations.delete(opKey);
        }
    }

    async deleteResource(id: string): Promise<void> {
        const uid = this.requireUserId();
        const target = this.resourcesSubject.value.find(r => r.id === id);
        const title = target?.title || 'Resource';

        const next = this.resourcesSubject.value.filter((resource) => resource.id !== id);
        this.resourcesSubject.next(next);
        this.saveLocalResources(uid, next);

        if (!id.startsWith('local-')) {
            try {
                await deleteDoc(doc(this.firestore, 'resources', id));
                this.toastService.info(`"${title}" deleted.`, 'Deleted');
            } catch (error) {
                console.warn('[ResourceService] Remote delete failed; local delete retained.', error);
            }
        } else {
            this.toastService.info(`"${title}" deleted.`, 'Deleted');
        }
    }

    async togglePrivacy(id: string): Promise<void> {
        const uid = this.requireUserId();
        let newPrivacy: 'Public' | 'Private' = 'Public';

        const next: Resource[] = this.resourcesSubject.value.map((resource) => {
            if (resource.id !== id) return resource;
            newPrivacy = resource.privacy === 'Public' ? 'Private' : 'Public';
            return {
                ...resource,
                privacy: newPrivacy
            };
        });

        this.resourcesSubject.next(next);
        this.saveLocalResources(uid, next);

        this.toastService.info(`Resource visibility set to ${newPrivacy}.`, 'Visibility Changed');

        if (id.startsWith('local-')) return;

        try {
            await updateDoc(doc(this.firestore, 'resources', id), { privacy: newPrivacy });
        } catch (error) {
            console.warn('[ResourceService] Remote privacy toggle failed; local updated.', error);
        }
    }

    updateResource(
        id: string,
        changes: Partial<Pick<Resource, 'title' | 'subject' | 'semester' | 'branch' | 'tags' | 'category' | 'description'>>
    ) {
        const uid = this.requireUserId();
        const next = this.resourcesSubject.value.map((resource) => {
            if (resource.id !== id) return resource;
            return { ...resource, ...changes };
        });

        this.resourcesSubject.next(next);
        this.saveLocalResources(uid, next);
        this.toastService.success('Resource details updated.', 'Updated');

        if (id.startsWith('local-')) return;

        updateDoc(doc(this.firestore, 'resources', id), changes).catch((err) => {
            console.warn('[ResourceService] Remote update failed; local retained.', err);
        });
    }

    incrementDownloads(id: string) {
        const uid = this.userService.getCurrentUserId();
        const next = this.resourcesSubject.value.map((resource) => {
            if (resource.id !== id) return resource;
            return { ...resource, downloads: (resource.downloads || 0) + 1 };
        });
        this.resourcesSubject.next(next);

        if (uid) {
            this.saveLocalResources(uid, next);
        }

        if (id.startsWith('local-') || id.startsWith('sample-')) return;
        const changed = next.find((resource) => resource.id === id);
        if (!changed) return;

        updateDoc(doc(this.firestore, 'resources', id), { downloads: changed.downloads }).catch((err) => {
            console.warn('[ResourceService] Remote download count update failed.', err);
        });
    }

    private startFirestoreSync(uid: string) {
        this.clearLiveSubscription();

        try {
            const q = query(
                this.resourcesCollection,
                where('ownerId', '==', uid),
                orderBy('createdAt', 'desc')
            );
            this.unsubscribeSnapshot = onSnapshot(
                q,
                (snapshot) => {
                    const remoteResources = snapshot.docs.map((item) => {
                        const data = item.data() as Record<string, unknown>;
                        return {
                            id: item.id,
                            title: (data['title'] as string) || '',
                            subject: (data['subject'] as string) || '',
                            date: (data['date'] as string) || new Date().toLocaleDateString(),
                            privacy: (data['privacy'] as 'Public' | 'Private') || 'Public',
                            downloads: Number(data['downloads'] || 0),
                            rating: Number(data['rating'] || 0),
                            semester: data['semester'] as string | undefined,
                            branch: data['branch'] as string | undefined,
                            tags: data['tags'] as string | string[] | undefined,
                            ownerId: (data['ownerId'] as string) || uid,
                            createdAt: data['createdAt'] as number | string | undefined
                        } as Resource;
                    });

                    // Retain any pending local-only items
                    const currentLocals = this.resourcesSubject.value.filter((r) => r.id.startsWith('local-'));
                    const combined = [...currentLocals, ...remoteResources];

                    this.resourcesSubject.next(combined);
                    this.saveLocalResources(uid, combined);
                },
                (error) => {
                    console.warn('[ResourceService] Live Firestore subscription error. Falling back to local cache.', error);
                }
            );
        } catch (error) {
            console.warn('[ResourceService] Firestore query init exception. Local cache active.', error);
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
            throw new Error('Please log in to continue.');
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
