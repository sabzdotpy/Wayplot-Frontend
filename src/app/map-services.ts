import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../Environment/environment';
import { Observable } from 'rxjs';

export interface MapData{
  id: number;
  name: string;
  description: string;
  gpxUrl: string;
  jsonUrl: string;
  status: number;
  active: boolean;
  visibility: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root',
})
export class MapServices {
  private baseurl=environment.ASP_API_URL+'/Map'
  // further works with mongo dB integration 

  constructor(private http:HttpClient){}

  listAllMaps():Observable<MapData[]>{
    return this.http.get<MapData[]>(this.baseurl);
  }

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

  UploadMapDB(map:Partial<MapData>):Observable<MapData>{
    return this.http.post<MapData>(this.baseurl,map);
  }
}
