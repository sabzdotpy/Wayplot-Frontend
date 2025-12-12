import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import axios from '../../lib/axios';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { AxiosError } from 'axios';

@Component({
  selector: 'app-sign-up',
  imports: [RouterLink, FormsModule, NgIf, ToastrModule],
  templateUrl: './sign-up.html',
  styleUrls: ['./sign-up.css'],
})
export class SignUp {
  name: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  statusMsg: string = '';
  loading: boolean = false;

  constructor(private http: HttpClient, private toastr: ToastrService, private router: Router) {}

  async signUp() {
    try {
      if (!this.name || !this.email || !this.password || !this.confirmPassword) {
        this.toastr.error("All fields are required, please fill in all fields.", 'Info', {
          positionClass: 'toast-top-right',
          timeOut: 3500,
          progressBar: true,
          easeTime: 400,
          toastClass: 'ngx-toastr slide-in',
        });
        return;
      }
      if (this.password !== this.confirmPassword) {
        this.toastr.error("Confirm password does not match, please try again.", 'Error', {
          positionClass: 'toast-top-right',
          timeOut: 3500,
          progressBar: true,
          easeTime: 400,
          toastClass: 'ngx-toastr slide-in',
        });
        return;
      }
      this.loading = true;
      this.statusMsg = '';
      let signupRes = await axios.post('/Auth/signup', {
        name: this.name,
        email: this.email,
        password: this.password,
        authType: 1,
        userRole: 2,
        scopes: ['VIEW_MAPS'],
      });

      this.toastr.success(`Signup Successful! Welcome to WayPlot, ${this.name}!`, 'Success', {
        positionClass: 'toast-top-right',
        timeOut: 3500,
        progressBar: true,
        easeTime: 400,
        toastClass: 'ngx-toastr slide-in',
      });

      this.statusMsg = 'signup successful';
      this.loading = false;

      localStorage.setItem('token', signupRes.data.token);
      localStorage.setItem('userId', signupRes.data.userId);
      localStorage.setItem('role', signupRes.data.role);
      this.router.navigate(['/userdashboard']);

    } catch (err: AxiosError | any) {
      this.loading = false;
      this.statusMsg = err.response?.data?.message || 'signup failed';
      this.toastr.error(this.statusMsg, 'Error', {
        positionClass: 'toast-top-right',
        timeOut: 3500,
        progressBar: true,
        easeTime: 400,
        toastClass: 'ngx-toastr slide-in',
      });
    }
  }
}
