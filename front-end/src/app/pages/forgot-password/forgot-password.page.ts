import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth/auth.service';
import { ResponsiveService } from 'src/app/services/responsive/responsive.service';
import { Router } from '@angular/router';
import { AuthenticatePage } from '../authenticate/authenticate.page';

@Component({
  selector: 'app-Forgot-password',
  templateUrl: './Forgot-password.page.html',
  styleUrls: ['./Forgot-password.page.scss'],
})
export class ForgotPasswordPage implements OnInit {
  email: string;
  newPassword: string;
  repeatNewPassword: string;

  constructor(
    private auth: AuthService,
    private responsive: ResponsiveService,
    private router: Router
  ) {
    this.email = '';
    this.newPassword = '';
    this.repeatNewPassword = '';
  }

  ngOnInit() {
  }

  async changePassword(): Promise<void> {
    try {
      if (this.newPassword !== this.repeatNewPassword) throw "Passwords don't match.";
      await this.responsive.setLoadingMessage('Requesting password change');
      await this.auth.changePassword(this.email, this.newPassword);
      await this.router.navigateByUrl('/authenticate', {
        state: {
          email: this.email,
          password: this.newPassword,
          mode: AuthenticatePage.modes.changingPassword
        }
      });
      await this.responsive.stopLoading();
    } catch (err) {
      await this.responsive.setErrorMessage(err);
    }
  }
}
