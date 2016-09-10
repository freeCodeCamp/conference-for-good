import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/auth.service';
import { TransitionService } from '../../shared/transition.service';
import { ToastComponent } from '../../shared/toast.component';

@Component({
               selector: 'login',
               templateUrl: './login.component.html',
               styleUrls: ['./login.component.scss']
           })
export class LoginComponent implements OnInit {

    @ViewChild('toast') toast: ToastComponent;

    email: FormControl;
    password: FormControl;
    form: FormGroup;

    constructor(private transitionService: TransitionService,
                private router: Router,
                private authService: AuthService) { }

    ngOnInit() {
        this.email = new FormControl('', Validators.compose([Validators.required, Validators.pattern("[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?")]));
        this.password = new FormControl('', Validators.compose([Validators.required, Validators.minLength(6), Validators.maxLength(18)]));

        this.form = new FormGroup({
            'email': this.email,
            'password': this.password
        });

        this.transitionService.transition();
    }

    doLogin(event) {
        this.authService.login(this.form.value)
            .then((res: any) => {
                if (this.authService.user.getValue() && this.authService.user.getValue().admin) {
                    this.router.navigate(['/home']);
                } else {
                    this.router.navigate(['/dashboard']);
                }
            })
            .catch(err => {
                if (err.status === 401) {
                    this.toast.error('Email or password do not match records');
                }
                else {
                    this.toast.error('Login error, please try again later');
                }
            });
        event.preventDefault();
    }

}