import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import {  Router } from '@angular/router';
import { AuthService } from '../../shared/auth.service';
import { TransitionService } from '../../shared/transition.service';
import { ToastComponent } from '../../shared/toast.component';

@Component({
               selector: 'forgotpassword',
               templateUrl: './forgotpassword.component.html',
               styleUrls: ['./forgotpassword.component.scss']
           })
export class ForgotPasswordComponent implements OnInit {

    @ViewChild('toast') toast: ToastComponent;
    @ViewChild('email') emailInput: ElementRef;

    email: FormControl;
    form: FormGroup;

    constructor(private transitionService: TransitionService,
                private router: Router,
                private authService: AuthService) { }

    ngOnInit() {
        this.email = new FormControl('', Validators.compose([Validators.required, Validators.pattern("[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?")]));

        this.form = new FormGroup({
            'email': this.email
        });

        this.transitionService.transition();
    }

    doForgotPassword(event) {
        event.preventDefault();
        let pass = this.emailInput.nativeElement.value;

        this.authService.forgotPassword(this.form.value)
            .then((res: any) => {
                this.toast.success('An email with your new password has been sent to your email address.');
                this.router.navigate(['/login']);
            })
            .catch(err => {
                console.log(err);
                if (err.alert === 'not sent') {
                    this.toast.error('Unbale to send new password at this time. Try again later!');
                } else if (err.alert === 'email not found') {
                    this.toast.error('Could not find a user with that email address. Please try again!');
                } else {
                    this.toast.error('Reset password error, please try again later');
                }
            });

    }

}