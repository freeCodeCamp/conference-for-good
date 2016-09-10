import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

import { AuthService } from './auth.service';

@Injectable()
export class SpeakerGuard implements CanActivate {
  
  constructor(private router: Router,
              private authService: AuthService) { }

  canActivate() {
    let user = this.authService.user.getValue();
    if (user) return true;

    this.router.navigate(['/login']);
    return false;
  }

}