import { Component } from '@angular/core';
import { PassingURL } from '../passing-url';
import { Route, Router } from '@angular/router';

@Component({
  selector: 'app-parent',
  imports: [],
  templateUrl: './parent.html',
  styleUrl: './parent.css',
})
export class Parent {
  url:string = 'https://res.cloudinary.com/dezwo04ym/raw/upload/v1764950417/campus_full_walk_nhb8rq.json';

  constructor(private passingUrl:PassingURL,private route:Router){}
  OnClick(){
    this.passingUrl.AssignUrl(this.url);
    this.route.navigate(['/map'])
  }
}
