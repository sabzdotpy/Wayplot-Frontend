import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MapVisualitionUrl {
    constructor(){}
  private url =new BehaviorSubject<string>('');
  url$=this.url.asObservable();

  AssignUrl(mapUrl:string){
    this.url.next(mapUrl);  
  }
}
