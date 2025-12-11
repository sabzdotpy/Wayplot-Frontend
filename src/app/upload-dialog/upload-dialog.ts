import { Component } from '@angular/core';
import {  MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CloudinaryService } from '../cloudinary-service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MapData } from '../map-services';

@Component({
  selector: 'app-upload-dialog',
  standalone:true,
  imports: [MatDialogModule,MatButtonModule,MatProgressSpinnerModule,FormsModule,CommonModule],
  templateUrl: './upload-dialog.html',
  styleUrl: './upload-dialog.css',
})
export class UploadDialog {
  mapName:string='';
  selectedFile:File| null=null;
  isUploading:boolean=false;

  constructor(private cloudinaryservice:CloudinaryService,private dialogRef: MatDialogRef<UploadDialog>){}

  onSelectedFile(event:any){
    this.selectedFile=event.target.files[0];
  }

  onSubmit(){
    if(!this.selectedFile|| !this.mapName){
      alert('Please provide a name and a file.');
      return;
    }
    this.isUploading = true;
    this.cloudinaryservice.UploadToCloudinary(this.selectedFile).subscribe({
      next:(response)=>{
        const gpx_url=response.cloudinary_gpx_url;
        const json_url=response.cloudinary_json_url;
         const mapData:Partial<MapData>={
          name: this.mapName,
          gpx_url: gpx_url,
          json_url: json_url,
          uploadedAt: new Date(),
          active: true
        }
        console.log('Map data to be saved:', mapData);
        
        // <=====================call the sqlserver to store the data
        this.isUploading = false;
        this.dialogRef.close(mapData);
        alert('File uploaded successfully!');
      },
      error:(err)=>{
        console.error('File upload failed', err);
        this.isUploading = false;

      }
    })

    
  }
}
