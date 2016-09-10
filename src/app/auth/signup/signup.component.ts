import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../shared/auth.service';
import { SpeakerService } from '../../shared/speaker.service';
import { TransitionService } from '../../shared/transition.service';
import { ToastComponent } from '../../shared/toast.component';

@Component({
               selector: 'signup',
               templateUrl: './signup.component.html',
               styleUrls: ['./signup.component.scss']
           })

export class SignupComponent implements OnInit {

    @ViewChild('toast') toast: ToastComponent;

    firstName: FormControl;
    lastName: FormControl;
    email: FormControl;
    password: FormControl;
    form: FormGroup;

    constructor(private transitionService: TransitionService,
                private router: Router,
                private authService: AuthService,
                private speakerService: SpeakerService) { }

    ngOnInit() {
        this.firstName = new FormControl('', Validators.compose([Validators.required, Validators.minLength(2), Validators.maxLength(64)]));
        this.lastName = new FormControl('', Validators.compose([Validators.required, Validators.minLength(2), Validators.maxLength(64)]));
        this.email = new FormControl('', Validators.compose([Validators.required, Validators.pattern("[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?")]));
        this.password = new FormControl('', Validators.compose([Validators.required, Validators.minLength(6), Validators.maxLength(18)]));

        this.form = new FormGroup({
            'lastName': this.lastName,
            'firstName': this.firstName,
            'email': this.email,
            'password': this.password
        });

        this.transitionService.transition();
    }

    doSignup(event) {
        this.authService.signup(this.form.value)
            .then(res => {
                // Refresh speaker list to get new speakers
                this.speakerService.getAllSpeakers();
                
                this.toast.success('You account is registered. Please login!');
                this.router.navigate(['/login']);
            })
            .catch(err => {
                if (err.status === 409) {
                    this.toast.error('This email address is already registered!');
                }
                else {
                    this.toast.error('Unable to register, please try again later');
                }
            });
        event.preventDefault();
    }
}