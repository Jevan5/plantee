import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from 'src/app/services/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private static readonly notLoggedInUrls = ['/login', '/register'];
  private get defaultNotLoggedInUrlTree(): UrlTree {
    return this.router.createUrlTree(['/login']);
  }
  private get defaultLoggedInUrlTree(): UrlTree {
    return this.router.createUrlTree(['/owned-plants'])
  }

  constructor(
    private auth: AuthService,
    private router: Router
  ) { }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (AuthGuard.notLoggedInUrls.includes(state.url)) {
      if (!this.auth.loggedIn) return true;
      else return this.defaultLoggedInUrlTree;
    } else {
      if (this.auth.loggedIn) return true;
      else return this.defaultNotLoggedInUrlTree;
    }
  }
  
}
