import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ResourceService } from '../../../services/resource.service';

@Component({
    selector: 'app-upload',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './upload.component.html',
    styleUrl: './upload.component.scss'
})
export class UploadComponent {
    uploadForm: FormGroup;
    isUploading = false;
    uploadProgress = 0;
    selectedFile: File | null = null;
    uploadError = '';

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private resourceService: ResourceService
    ) {
        console.log('UploadComponent initialized');
        // @ts-ignore
        console.log('UploadComponent Service ID:', this.resourceService.instanceId);

        this.uploadForm = this.fb.group({
            title: ['', [Validators.required, Validators.minLength(5)]],
            subject: ['', [Validators.required]],
            semester: ['', [Validators.required]],
            branch: ['', [Validators.required]],
            privacy: ['Public', [Validators.required]],
            tags: ['']
        });
    }

    onFileSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            this.selectedFile = file;
            this.uploadError = '';
        }
    }

    async onSubmit() {
        if (this.uploadForm.valid && this.selectedFile) {
            this.isUploading = true;
            this.uploadError = '';
            this.uploadProgress = 0;

            // Simulate file upload progress
            const interval = setInterval(async () => {
                this.uploadProgress += 10;
                if (this.uploadProgress >= 100) {
                    clearInterval(interval);

                    // Add resource to service
                    console.log('Adding resource:', this.uploadForm.value);
                    try {
                        await this.resourceService.addResource({
                            title: this.uploadForm.get('title')?.value,
                            subject: this.uploadForm.get('subject')?.value,
                            semester: this.uploadForm.get('semester')?.value,
                            branch: this.uploadForm.get('branch')?.value,
                            privacy: this.uploadForm.get('privacy')?.value,
                            tags: this.uploadForm.get('tags')?.value
                        });
                        console.log('Resource added, navigating...');

                        setTimeout(() => {
                            this.isUploading = false;
                            this.router.navigate(['/dashboard/my-resources']);
                        }, 500);
                    } catch (error: any) {
                        this.isUploading = false;
                        this.uploadError = error?.message || 'Upload failed';
                    }
                }
            }, 200);
        }
    }

    cancelUpload() {
        this.selectedFile = null;
        this.uploadForm.reset({
            privacy: 'Public'
        });
        this.uploadProgress = 0;
        this.uploadError = '';
    }
}
