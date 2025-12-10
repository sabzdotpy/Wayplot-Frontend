import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
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
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.css',
})
export class SignIn {
  constructor(private router: Router) {}

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
        this.router.navigate(['/userdashboard']);
      } else {
        alert('Invalid UserName or Password');
      }
    } catch (err: any) {
      if (err.response.data.errorMessage) {
        alert(err.response.data.errorMessage);
        return;
      }
      alert('An error occurred during sign-in. Please try again later.');
      console.error('Sign-in error:', err);
    }
  }
}
