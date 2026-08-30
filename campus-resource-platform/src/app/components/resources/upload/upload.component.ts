import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ResourceService } from '../../../services/resource.service';
import { ToastService } from '../../../core/toast.service';

@Component({
    selector: 'app-upload',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './upload.component.html',
    styleUrl: './upload.component.scss'
})
export class UploadComponent {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private resourceService = inject(ResourceService);
    private toastService = inject(ToastService);

    uploadForm: FormGroup;
    isUploading = false;
    uploadProgress = 0;
    selectedFile: File | null = null;
    uploadError = '';
    isDragging = false;

    constructor() {
        this.uploadForm = this.fb.group({
            title: ['', [Validators.required, Validators.minLength(5)]],
            subject: ['', [Validators.required]],
            semester: ['', [Validators.required]],
            branch: ['', [Validators.required]],
            privacy: ['Public', [Validators.required]],
            tags: ['']
        });
    }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            this.handleFile(input.files[0]);
        }
    }

    onDragOver(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = true;
    }

    onDragLeave(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = false;
    }

    onDrop(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDragging = false;

        if (event.dataTransfer && event.dataTransfer.files.length > 0) {
            this.handleFile(event.dataTransfer.files[0]);
        }
    }

    private handleFile(file: File) {
        const maxSizeBytes = 25 * 1024 * 1024; // 25MB
        if (file.size > maxSizeBytes) {
            this.uploadError = 'File exceeds maximum size of 25MB.';
            this.toastService.error(this.uploadError, 'File Size Error');
            return;
        }

        this.selectedFile = file;
        this.uploadError = '';

        // Auto-fill title if empty
        if (!this.uploadForm.get('title')?.value) {
            const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
            this.uploadForm.patchValue({ title: cleanName });
        }
    }

    async onSubmit() {
        if (this.uploadForm.invalid || !this.selectedFile || this.isUploading) {
            return;
        }

        this.isUploading = true;
        this.uploadError = '';
        this.uploadProgress = 0;

        const rawTags = this.uploadForm.get('tags')?.value || '';
        const tagList = typeof rawTags === 'string'
            ? rawTags.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0)
            : rawTags;

        const progressInterval = setInterval(() => {
            if (this.uploadProgress < 90) {
                this.uploadProgress += 15;
            }
        }, 120);

        try {
            const idempotencyKey = `upload-${this.selectedFile.name}-${Date.now()}`;
            await this.resourceService.addResource({
                title: this.uploadForm.get('title')?.value.trim(),
                subject: this.uploadForm.get('subject')?.value,
                semester: this.uploadForm.get('semester')?.value,
                branch: this.uploadForm.get('branch')?.value,
                privacy: this.uploadForm.get('privacy')?.value,
                tags: tagList,
                fileName: this.selectedFile.name,
                size: this.selectedFile.size,
                description: `Uploaded academic material for ${this.uploadForm.get('subject')?.value} (${this.uploadForm.get('branch')?.value}).`
            }, idempotencyKey);

            this.uploadProgress = 100;
            clearInterval(progressInterval);

            setTimeout(() => {
                this.isUploading = false;
                this.router.navigate(['/dashboard/my-resources']);
            }, 400);
        } catch (error: unknown) {
            clearInterval(progressInterval);
            this.isUploading = false;
            this.uploadError = (error as Error)?.message || 'Failed to upload resource. Please try again.';
            this.toastService.error(this.uploadError, 'Upload Failed');
        }
    }

    cancelUpload() {
        this.selectedFile = null;
        this.uploadForm.reset({ privacy: 'Public' });
        this.uploadProgress = 0;
        this.uploadError = '';
    }
}
