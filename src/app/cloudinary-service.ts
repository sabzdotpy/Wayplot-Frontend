import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

interface GpxUploadResponse {
  status: string;
  message: string;
  cloudinary_gpx_url: string;
  cloudinary_json_url: string;
  nodes: number;
  edges: number;
}

@Injectable({
  providedIn: 'root',
})
export class CloudinaryService {

  constructor(private http:HttpClient){}

  private apiUrl='http://127.0.0.1:8000/convert-gpx'
  
  UploadToCloudinary(file:File):Observable<GpxUploadResponse>{
    const formData = new FormData();
    formData.append('gpx_file', file, file.name);
    return this.http.post<GpxUploadResponse>(this.apiUrl,formData);
  }


  
}
