import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth/auth.service';
import { ResponsiveService } from 'src/app/services/responsive/responsive.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage implements OnInit {
  private email: string;
  private firstName: string;
  private lastName: string;
  private password: string;
  private repeatPassword: string;

  constructor(
    private auth: AuthService,
    private responsive: ResponsiveService) { }

  ngOnInit() {
  }

  async register(): Promise<void> {
    try {
      if (this.password !== this.repeatPassword) throw "Passwords don't match.";
      await this.responsive.setLoadingMessage('Registering');
      const user = await this.auth.register(this.firstName, this.lastName, this.email, this.password);
      await this.responsive.setSuccessMessage(`Please check ${user.email} for an authentication link.`);
    } catch (err) {
      await this.responsive.setErrorMessage(err);
    }
  }
}
