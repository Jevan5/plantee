import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth/auth.service';
import { ResponsiveService } from 'src/app/services/responsive/responsive.service';
import { Router } from '@angular/router';
import { AuthenticatePage } from '../authenticate/authenticate.page';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  repeatPassword: string;

  constructor(
    private auth: AuthService,
    private responsive: ResponsiveService,
    private router: Router
  ) { }

  ngOnInit() {
  }

  ionViewWillEnter(): void {
    this.email = '';
    this.firstName = '';
    this.lastName = '';
    this.password = '';
    this.repeatPassword = '';
  }

  async register(): Promise<void> {
    try {
      if (this.password !== this.repeatPassword) throw "Passwords don't match.";
      await this.responsive.setLoadingMessage('Registering');
      const user = await this.auth.register(this.firstName, this.lastName, this.email, this.password);
      await this.router.navigateByUrl('/authenticate', {
        state: {
          email: user.email,
          password: this.password,
          mode: AuthenticatePage.modes.registering
        }
      });
      await this.responsive.stopLoading();
    } catch (err) {
      await this.responsive.setErrorMessage(err);
    }
  }
}
