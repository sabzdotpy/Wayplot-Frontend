import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CloudinaryService {
  private cloudName = 'dezwo04ym'; //dezwo04ym
  private uploadPreset = 'Wayplot';
  private uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/raw/upload`;

  constructor(private http:HttpClient){}



  uploadGPX(file:File):Observable<any>{
    const formdata=new FormData();
    formdata.append('file',file);
    formdata.append('upload_preset',this.uploadPreset);
    return this.http.post(this.uploadUrl,formdata);  // returns a metadata of file uploaded

  }
  
}
