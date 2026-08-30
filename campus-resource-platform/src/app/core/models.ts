export interface UserProfile {
    id?: string;
    email?: string;
    username?: string;
    name: string;
    university: string;
    department: string;
    semester: string;
    bio?: string;
    recognitionPoints?: number;
    resourcesUploaded?: number;
    resourcesDownloaded?: number;
    createdAt?: string;
    updatedAt?: string;
}

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
    uploaderCollege?: string;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
    size?: number;
    description?: string;
    createdAt?: number | string;
    idempotencyKey?: string;
}

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastMessage {
    id: string;
    type: ToastType;
    title?: string;
    message: string;
    durationMs?: number;
}

export type ThemeMode = 'system' | 'light' | 'dark';

export interface SearchFilterState {
    q: string;
    subject: string;
    semester: string;
    type: string;
    branch: string;
    view: 'grid' | 'list';
    resourceId?: string | null;
}
