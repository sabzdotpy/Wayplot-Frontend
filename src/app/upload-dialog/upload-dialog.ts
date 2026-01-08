import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CloudinaryService, GpxUploadResponse } from '../cloudinary-service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MapData, MapServices } from '../map-services';
import { switchMap, catchError, finalize } from 'rxjs/operators';
import { of, throwError } from 'rxjs';
import { ToastrService, ToastrModule } from 'ngx-toastr';

@Component({
  selector: 'app-upload-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule, FormsModule, CommonModule, ToastrModule],
  templateUrl: './upload-dialog.html',
  styleUrl: './upload-dialog.css',
})
export class UploadDialog {
  mapName: string = '';
  mapDescription: string = '';
  visibility: string = 'PRIVATE';
  selectedFile: File | null = null;
  isUploading: boolean = false;

  constructor(
    private cloudinaryservice: CloudinaryService,
    private dialogRef: MatDialogRef<UploadDialog>,
    private mapservices: MapServices,
    private toastr: ToastrService
  ) {}

  onSelectedFile(event: any) {
    this.selectedFile = event.target.files[0];
  }

  async onSubmit() {
    if (!this.selectedFile || !this.mapName || !this.mapDescription) {
      alert('Please provide a name and a file.');
      return;
    }
    this.isUploading = true;
    let response: GpxUploadResponse = await this.cloudinaryservice.UploadToCloudinary(
      this.selectedFile
    );
    of(response)
      .pipe(
        switchMap((response) => {
          const gpx_url = response.cloudinary_gpx_url;
          const json_url = response.cloudinary_json_url;

          const mapData: Partial<MapData> = {
            name: this.mapName,
            description: this.mapDescription,
            gpxUrl: gpx_url,
            jsonUrl: json_url,
            visibility: this.visibility == 'PUBLIC' ? 0 : 1,
          };
          console.log('Map data to be saved:', mapData);

          // 3. Return the Observable for the DB save
          let res = this.mapservices.UploadMapDB(mapData);
          this.mapservices.listAllMaps();
          return res;
        }),
        catchError((error) => {
          this.isUploading = false;
          console.error('Upload Process Failed:', error);
          alert('Upload failed: ' + (error.message || 'Check console for details.'));
          // Return a new error Observable to keep the chain going/halt gracefully
          this.toastr.error(`${error.message || 'Upload failed. Check console for details.'}`, 'Error', {
            positionClass: 'toast-top-right',
            timeOut: 5000,
            progressBar: true,
            easeTime: 400,
            toastClass: 'ngx-toastr slide-in',
          });
          return throwError(() => new Error('Upload process failed.'));
        }),
        finalize(() => {
          this.isUploading = false; // Turn off loading indicator
        })
      )
      .subscribe({
        next: (dbResponse) => {
          alert('File uploaded and data saved successfully!');
          this.dialogRef.close(dbResponse);
        },
        error: (finalError) => {
          console.log('Subscription terminated by error.');
        },
      });
  }
}
