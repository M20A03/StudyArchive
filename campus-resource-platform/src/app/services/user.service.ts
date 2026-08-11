import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { Firestore, collection, addDoc, getDocs, query, where, updateDoc, doc, getDoc } from '@angular/fire/firestore';

export interface UserProfile {
    id?: string;
    email?: string;
    password?: string;
    username?: string;
    name: string;
    university: string;
    department: string;
    semester: string;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private firestore = inject(Firestore);
    private platformId = inject(PLATFORM_ID);
    private isBrowser = isPlatformBrowser(this.platformId);
    private usersCollection = collection(this.firestore, 'users');
    private currentUserId: string | null = null;
    private readonly uidStorageKey = 'uid';

    private userProfile = new BehaviorSubject<UserProfile>({
        name: 'Guest User',
        university: 'Your University',
        department: 'Your Department',
        semester: '1st Semester'
    });
    private authState = new BehaviorSubject<boolean>(false);

    userProfile$ = this.userProfile.asObservable();
    authState$ = this.authState.asObservable();

    constructor() {
        if (this.isBrowser) {
            this.restoreSession();
        }
    }

    private async restoreSession() {
        const uid = localStorage.getItem(this.uidStorageKey);
        if (!uid) return;
        try {
            const snap = await getDoc(doc(this.firestore, 'users', uid));
            if (snap.exists()) {
                this.currentUserId = uid;
                this.userProfile.next(this.fromFirestore(snap.data() as Record<string, unknown>, uid));
                this.authState.next(true);
            }
        } catch {
            localStorage.removeItem(this.uidStorageKey);
            this.authState.next(false);
        }
    }

    async register(payload: { fullName: string; email: string; college: string; department: string; semester: string; password: string }): Promise<void> {
        const username = payload.email.split('@')[0].toLowerCase();
        const existingByEmail = await getDocs(query(this.usersCollection, where('email', '==', payload.email.toLowerCase())));
        if (!existingByEmail.empty) {
            throw new Error('Email already registered');
        }

        const now = new Date().toISOString();
        const created = await addDoc(this.usersCollection, {
            name: payload.fullName,
            email: payload.email.toLowerCase(),
            password: payload.password,
            username,
            university: payload.college,
            department: payload.department,
            semester: payload.semester,
            createdAt: now,
            updatedAt: now
        });

        this.currentUserId = created.id;
        if (this.isBrowser) {
            localStorage.setItem(this.uidStorageKey, created.id);
        }
        this.authState.next(true);
        this.userProfile.next({
            id: created.id,
            name: payload.fullName,
            email: payload.email.toLowerCase(),
            username,
            university: payload.college,
            department: payload.department,
            semester: payload.semester
        });
    }

    async login(identifier: string, password: string): Promise<void> {
        const normalized = identifier.trim().toLowerCase();
        const emailQuery = await getDocs(query(this.usersCollection, where('email', '==', normalized)));
        let match = emailQuery.docs[0];

        if (!match) {
            const usernameQuery = await getDocs(query(this.usersCollection, where('username', '==', normalized)));
            match = usernameQuery.docs[0];
        }

        if (!match) {
            throw new Error('User not found');
        }

        const data = match.data() as Record<string, unknown>;
        if ((data['password'] as string) !== password) {
            throw new Error('Invalid password');
        }

        this.currentUserId = match.id;
        if (this.isBrowser) {
            localStorage.setItem(this.uidStorageKey, match.id);
        }
        this.authState.next(true);
        this.userProfile.next(this.fromFirestore(data, match.id));
    }

    logout() {
        this.currentUserId = null;
        if (this.isBrowser) {
            localStorage.removeItem(this.uidStorageKey);
        }
        this.authState.next(false);
        this.userProfile.next({
            name: 'Guest User',
            university: 'Your University',
            department: 'Your Department',
            semester: '1st Semester'
        });
    }

    async updateProfile(profile: Partial<UserProfile>) {
        const current = this.userProfile.value;
        const updated = { ...current, ...profile };
        this.userProfile.next(updated);

        if (this.currentUserId) {
            await updateDoc(doc(this.firestore, 'users', this.currentUserId), {
                name: updated.name,
                university: updated.university,
                department: updated.department,
                semester: updated.semester,
                updatedAt: new Date().toISOString()
            });
        }
    }

    getProfile(): UserProfile {
        return this.userProfile.value;
    }

    isAuthenticated(): boolean {
        return !!this.currentUserId;
    }

    getCurrentUserId(): string | null {
        return this.currentUserId;
    }

    private fromFirestore(data: Record<string, unknown>, id: string): UserProfile {
        return {
            id,
            name: (data['name'] as string) || 'Guest User',
            email: (data['email'] as string) || '',
            username: (data['username'] as string) || '',
            university: (data['university'] as string) || 'Your University',
            department: (data['department'] as string) || 'Your Department',
            semester: (data['semester'] as string) || '1st Semester'
        };
    }
}
