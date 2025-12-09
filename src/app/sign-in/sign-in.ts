import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from "@angular/router";

export interface UserData{
  email:string;
  password:string;
}

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [RouterLink, FormsModule,CommonModule],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.css',
})
export class SignIn {
  constructor(private router : Router) { }

  admin:UserData={
    email:"wayplot@gmail.com",
    password:"123456789"
  }
  user:UserData={
    email:"",
    password:""
  }
  signIn(){
    if(this.admin.email==this.user.email && this.admin.password==this.user.password){
      //  this.router.navigate(['/admindashboard']);
       this.router.navigate(['/userdashboard']);
    }
    else{
      alert("Invalid UserName or Password")
    }

    }


}
