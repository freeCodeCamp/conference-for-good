import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

import { AuthService } from './auth.service';

@Injectable()
export class AdminGuard implements CanActivate {
  
  constructor(private router: Router,
              private authService: AuthService) { }

  canActivate() {
    let user = this.authService.user.getValue();
    if (user && user.admin) return true;

    this.router.navigate(['/login']);
    return false;
  }

}