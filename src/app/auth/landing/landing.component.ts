import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import { TransitionService } from '../../shared/transition.service';
import { ToastComponent } from '../../shared/toast.component';

@Component({
               selector: 'landing',
               templateUrl: './landing.component.html',
               styleUrls: ['./landing.component.scss']
           })
export class LandingComponent implements OnInit {

    @ViewChild('toast') toast: ToastComponent;

    constructor(private transitionService: TransitionService,
                private router: Router) { }

    ngOnInit() {
        this.transitionService.transition();
    }

    signup() {
        this.router.navigate(['/signup']);
    }

    login() {
        this.router.navigate(['/login']);
    }

}