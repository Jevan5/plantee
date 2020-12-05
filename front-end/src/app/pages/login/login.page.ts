import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth/auth.service';
import { ResponsiveService } from 'src/app/services/responsive/responsive.service';
import { Router } from '@angular/router';
import { AuthenticatePage } from '../authenticate/authenticate.page';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  email: string;
  password: string;

  constructor(
    private auth: AuthService,
    private responsive: ResponsiveService,
    private router: Router) { }

  ngOnInit() {
  }

  ionViewWillEnter(): void {
    this.email = '';
    this.password = '';
  }

  async login(): Promise<void> {
    try {
      await this.responsive.setLoadingMessage('Logging in');
      const user = await this.auth.login(this.email, this.password);
      await this.responsive.setSuccessMessage(`Welcome back, ${user.firstName}.`);
      await this.router.navigateByUrl('/owned-plants');
    } catch (err) {
      if (typeof(err) === 'string' && err === `User (${this.email.toLowerCase()}) has not yet authenticated their account.`) {
        await this.responsive.stopLoading();
        await this.router.navigateByUrl('/authenticate', {
          state: {
            email: this.email,
            password: this.password,
            mode: AuthenticatePage.modes.registering
          }
        });
        return;
      }

      await this.responsive.setErrorMessage(err);
    }
  }
}
