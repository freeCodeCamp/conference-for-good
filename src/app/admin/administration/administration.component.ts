import { Component, OnInit, ViewChild } from '@angular/core';
import { AuthService } from '../../shared/auth.service';
import { SpeakerService } from '../../shared/speaker.service';
import { TransitionService } from '../../shared/transition.service';
import { ToastComponent } from '../../shared/toast.component';

@Component({
               selector: 'administration',
               templateUrl: './administration.component.html',
               styleUrls: ['./administration.component.scss']
           })

export class AdministrationComponent implements OnInit {

    @ViewChild('toast') toast: ToastComponent;
    addFlag = false;
    deleteFlag = false;

    constructor(private transitionService: TransitionService,
                private authService: AuthService,
                private speakerService: SpeakerService) { }

    ngOnInit() {
        this.transitionService.transition();
    }

    showAddAdmin() {
        this.addFlag = true;
        this.deleteFlag = false;
    }

    showDeleteAdmin() {
        this.addFlag = false;
        this.deleteFlag = true;
    }

    addAdmin(speakerId: string) {
        event.preventDefault();

        this.authService.addAdmin(speakerId)
            .then( res => {
                this.speakerService.getAllSpeakers();
                this.toast.success('User has been made an admin');
            })
            .catch( err => {
                if (err.status === 404) {
                    this.toast.error('User not found!');
                }
                else {
                    this.toast.error('Unable to make speaker an admin, please try again later');
                }
            });
    }

    deleteAdmin(speakerId: string) {
        event.preventDefault();

        this.authService.deleteAdmin(speakerId)
            .then( res => {
                this.speakerService.getAllSpeakers();
                this.toast.success('User has been removed as an admin');
            })
            .catch( err => {
                if (err.status === 404) {
                    this.toast.error('User not found!');
                }
                else {
                    this.toast.error('Unable to remove admin, please try again later');
                }
            });
    }

}