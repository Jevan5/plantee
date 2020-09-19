import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth/auth.service';
import { ResponsiveService } from 'src/app/services/responsive/responsive.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  private email: string;
  private password: string;

  constructor(
    private auth: AuthService,
    private responsive: ResponsiveService,
    private router: Router) { }

  ngOnInit() {
  }

  async login(): Promise<void> {
    try {
      await this.responsive.setLoadingMessage('Logging in');
      const user = await this.auth.login(this.email, this.password);
      await this.responsive.setSuccessMessage(`Welcome back, ${user.firstName}.`);
      await this.router.navigateByUrl('/owned-plants');
    } catch (err) {
      await this.responsive.setErrorMessage(err);
    }
  }
}
