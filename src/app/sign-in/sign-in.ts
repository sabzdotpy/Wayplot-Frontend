import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ToastrService, ToastrModule } from 'ngx-toastr';
import { trigger, transition, style, animate } from '@angular/animations';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import axios from '../../lib/axios';

export interface UserData {
  email: string;
  password: string;
}

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ToastrModule],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.css',
  animations: [
    trigger('flyInOut', [
      transition(':enter', [
        style({ transform: 'translateX(-100%)', opacity: 0 }),
        animate('300ms ease-in', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ])
  ],
})
export class SignIn {
  constructor(private router: Router, private toastr: ToastrService) {}

  admin: UserData = {
    email: 'wayplot@gmail.com',
    password: '123456789',
  };
  user: UserData = {
    email: '',
    password: '',
  };
  async signIn() {
    try {
      let res = await axios.post('/Auth/login', {
        email: this.user.email,
        password: this.user.password,
      });
      console.log(res.data);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userId', res.data.userId);
      localStorage.setItem('role', res.data.role);

      if (res.data.isSuccess) {
        this.toastr.success(`Welcome back to WayPlot, ${res.data.name.split(" ")[0]}!`, 'Success', {
          positionClass: 'toast-top-right',
          timeOut: 3500,
          progressBar: true,
          easeTime: 400,
          toastClass: 'ngx-toastr slide-in',
        });

        if (res.data.role === "SUPER_ADMIN" || res.data.role === "ADMIN") {
          this.router.navigate(['/admindashboard']);
          return;
        }

        this.router.navigate(['/userdashboard']);

      } else {
        this.toastr.error(res.data.ErrorMessage, 'Error', {
          positionClass: 'toast-top-right',
          timeOut: 5000,
          progressBar: true,
          easeTime: 400,
          toastClass: 'ngx-toastr slide-in',
        });
      }
    } catch (err: any) {
      if (err.response?.data.errorMessage) {
        this.toastr.error(err.response?.data.errorMessage, 'Error', {
          positionClass: 'toast-top-right',
          timeOut: 5000,
          progressBar: true,
          easeTime: 400,
          toastClass: 'ngx-toastr slide-in',
        });
        return;
      }
      this.toastr.error('An error occurred during sign-in. Try again later.', 'Error', {
        positionClass: 'toast-top-right',
        timeOut: 3500,
        progressBar: true,
        easeTime: 400,
        toastClass: 'ngx-toastr slide-in',
      });
      // sign-in error log
      console.error('Sign-in error:', err);
    }
  }
}
