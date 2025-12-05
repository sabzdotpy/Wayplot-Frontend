import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export interface MapData{
  id: number;
  name: string;
  url: string;
  uploadedAt: Date;
  active: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class MapServices {
  // further works with mongo dB integration 

  constructor(private http:HttpClient){}

  OnDownloadMap(url:string, fileName:string){
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

  OnUpdateMap(map:MapData){
    // update map details in database
  }
}
