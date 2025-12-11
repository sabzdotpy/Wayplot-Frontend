import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export interface MapData{
  id: number;
  name: string;
  gpx_url: string;
  json_url: string;
  uploadedAt: Date;
  active: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class MapServices {
  // further works with mongo dB integration 

  constructor(private http:HttpClient){}

  downloadFile(url:string, fileName:string){
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const a=document.createElement('a');
        const objectUrl=URL.createObjectURL(blob);
        a.href=objectUrl;
        a.download=fileName;
        a.click();
        URL.revokeObjectURL(objectUrl);
      },
      error: (err) => {
        console.error('Download failed:', err);
        alert(`Failed to download "${fileName}". Please check the file or try again.`);
      },
    });
  }

  OnDownloadMapFiles(gpxUrl: string, jsonUrl: string, baseFileName: string): void {
    
    this.downloadFile(gpxUrl, `${baseFileName}.gpx`);

    setTimeout(() => {
        this.downloadFile(jsonUrl, `${baseFileName}.json`);
    }, 500); 
  }

  OnUpdateMap(map:MapData){
    // update map details in database
  }
}
