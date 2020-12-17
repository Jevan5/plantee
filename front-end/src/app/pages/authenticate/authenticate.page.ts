import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/services/auth/auth.service';
import { ResponsiveService } from 'src/app/services/responsive/responsive.service';
import { AuthGuard } from 'src/app/guards/auth/auth.guard';

@Component({
  selector: 'app-authenticate',
  templateUrl: './authenticate.page.html',
  styleUrls: ['./authenticate.page.scss'],
})
export class AuthenticatePage implements OnInit {
  static get modes() {
    return {
      changingPassword: 0,
      registering: 1
    };
  }

  authentication: string;
  email: string;
  mode: number;
  password: string;

  constructor(
    private auth: AuthService,
    private authGuard: AuthGuard,
    private responsive: ResponsiveService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.route.queryParams.subscribe((params) => {
      if (!this.router.getCurrentNavigation().extras.hasOwnProperty('state')) {
        this.router.navigateByUrl('/login');
        return;
      }

      this.email = this.router.getCurrentNavigation().extras.state.email;
      this.password = this.router.getCurrentNavigation().extras.state.password;
      this.mode = this.router.getCurrentNavigation().extras.state.mode;
    });
  }

  ngOnInit() { }

  async authenticate(): Promise<void> {
    try {
      await this.responsive.setLoadingMessage(`Authenticating ${this.email}`);
      await this.auth.authenticate(this.email, this.authentication);
      await this.responsive.setLoadingMessage('Logging in');
      await this.auth.login(this.email, this.password);
      await this.router.navigateByUrl(this.authGuard.defaultLoggedInUrlTree);
      await this.responsive.stopLoading();

      if (this.mode === AuthenticatePage.modes.changingPassword) {
        await this.responsive.setSuccessMessage('Password changed successfully');
      } else if (this.mode === AuthenticatePage.modes.registering) {
        await this.responsive.setSuccessMessage('Account registered successfully');
      }
    } catch (err) {
      await this.responsive.setErrorMessage(err);
    }
  }

  async regenerateAuthenticationCode(): Promise<void> {
    try {
      await this.responsive.setLoadingMessage(`Sending authentication code to ${this.email}`);
      await this.auth.regenerateAuthenticationCode(this.email);
      await this.responsive.setSuccessMessage(`Please check ${this.email} for the authentication code, and enter it above.`);
    } catch (err) {
      await this.responsive.setErrorMessage(err);
    }
  }
}
