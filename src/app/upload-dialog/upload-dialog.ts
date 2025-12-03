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

    this.cloudinaryservice.uploadGPX(this.selectedFile).subscribe({
      next:(response)=>{
        const mapUrl=response.secure_url;

        const mapData:Partial<MapData>={
          name: this.mapName,
          url: mapUrl,
          uploadedAt: new Date(),
          active: true
        }
        console.log('File uploaded to Cloudinary:', mapUrl);
        
        // call the mongoDb to store the data
        console.log('Map data to be saved:', mapData);
        
        this.isUploading = false;
        this.dialogRef.close(mapData);
        alert('File uploaded successfully!');
      },
      error:(err)=>{
        console.error('Cloudinary upload failed', err);
        this.isUploading = false;
      }
    });
    
  }
}
