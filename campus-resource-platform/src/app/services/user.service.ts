import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { Auth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc, updateDoc } from '@angular/fire/firestore';

export interface UserProfile {
    id?: string;
    email?: string;
    username?: string;
    name: string;
    photoURL?: string;
    university: string;
    department: string;
    semester: string;
}

const GUEST_PROFILE: UserProfile = {
    name: 'Guest User',
    email: '',
    photoURL: '',
    university: 'StudyArchive Platform',
    department: 'Guest Visitor',
    semester: 'Explore Mode'
};

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private auth = inject(Auth);
    private firestore = inject(Firestore);
    private platformId = inject(PLATFORM_ID);
    private isBrowser = isPlatformBrowser(this.platformId);
    private currentUserId: string | null = null;

    private userProfile = new BehaviorSubject<UserProfile>(GUEST_PROFILE);
    private authState = new BehaviorSubject<boolean>(false);

    userProfile$ = this.userProfile.asObservable();
    authState$ = this.authState.asObservable();

    constructor() {
        if (this.isBrowser) {
            onAuthStateChanged(this.auth, async (firebaseUser: User | null) => {
                if (firebaseUser) {
                    await this.handleFirebaseUser(firebaseUser);
                } else {
                    this.currentUserId = null;
                    this.authState.next(false);
                    this.userProfile.next(GUEST_PROFILE);
                }
            });
        }
    }

    async loginWithGoogle(): Promise<UserProfile> {
        if (!this.isBrowser) {
            throw new Error('Google Sign-In is only supported in browser environment.');
        }

        try {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });
            const credential = await signInWithPopup(this.auth, provider);
            const user = credential.user;
            return await this.handleFirebaseUser(user);
        } catch (error: any) {
            if (error?.code === 'auth/popup-closed-by-user') {
                throw new Error('Sign in popup was closed before completion.');
            }
            throw new Error(error?.message || 'Failed to sign in with Google Account.');
        }
    }

    private async handleFirebaseUser(user: User): Promise<UserProfile> {
        this.currentUserId = user.uid;
        const userDocRef = doc(this.firestore, 'users', user.uid);

        let profile: UserProfile = {
            id: user.uid,
            name: user.displayName || user.email?.split('@')[0] || 'Google User',
            email: user.email || '',
            photoURL: user.photoURL || '',
            university: 'Campus University',
            department: 'Computer Science',
            semester: 'Current Semester'
        };

        try {
            const snap = await getDoc(userDocRef);
            if (snap.exists()) {
                const data = snap.data() as Record<string, unknown>;
                profile = {
                    ...profile,
                    name: (data['name'] as string) || profile.name,
                    university: (data['university'] as string) || profile.university,
                    department: (data['department'] as string) || profile.department,
                    semester: (data['semester'] as string) || profile.semester,
                    photoURL: (data['photoURL'] as string) || profile.photoURL
                };
            } else {
                await setDoc(userDocRef, {
                    name: profile.name,
                    email: profile.email,
                    photoURL: profile.photoURL,
                    university: profile.university,
                    department: profile.department,
                    semester: profile.semester,
                    createdAt: new Date().toISOString()
                }, { merge: true });
            }
        } catch {
            // Local fallback if Firestore is restricted
        }

        this.userProfile.next(profile);
        this.authState.next(true);
        return profile;
    }

    async logout(): Promise<void> {
        if (this.isBrowser) {
            try {
                await signOut(this.auth);
            } catch (err) {
                console.error('Logout error:', err);
            }
        }
        this.currentUserId = null;
        this.authState.next(false);
        this.userProfile.next(GUEST_PROFILE);
    }

    async updateProfile(profile: Partial<UserProfile>) {
        const current = this.userProfile.value;
        const updated = { ...current, ...profile };
        this.userProfile.next(updated);

        if (this.currentUserId) {
            try {
                await updateDoc(doc(this.firestore, 'users', this.currentUserId), {
                    name: updated.name,
                    university: updated.university,
                    department: updated.department,
                    semester: updated.semester,
                    updatedAt: new Date().toISOString()
                });
            } catch {
                // Ignore remote sync errors locally
            }
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
}
