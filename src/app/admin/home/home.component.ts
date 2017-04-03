import { Component, ViewChild } from '@angular/core';

import { TransitionService } from '../../shared/transition.service';
import { AuthService } from '../../shared/auth.service';
import { Session } from '../../shared/session.model';
import { SessionService } from '../../shared/session.service';
import { Speaker } from '../../shared/speaker.model';
import { SpeakerService } from '../../shared/speaker.service';
import { ToastComponent } from '../../shared/toast.component';
import * as _ from 'lodash';

@Component({
  selector: 'home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {

  @ViewChild('toast') toast: ToastComponent;

  speaker: Speaker;
  fullyCompletePendingSessions: Session[] = [];

  constructor(private transitionService: TransitionService,
              private authService: AuthService,
              private sessionService: SessionService,
              private speakerService: SpeakerService) {

    this.authService.user.subscribe(user => {
      this.speaker = this.speakerService.getSpeaker(user._id);
    });

    this.sessionService.sessionsPending.subscribe(sessions => {
      this.fullyCompletePendingSessions = _.filter(sessions, session => {
        if (!session.speakers.mainPresenter) {
          return false;
        }
        let leadPres = this.speakerService.getSpeaker(session.speakers.mainPresenter);
        if (leadPres && leadPres.profileComplete) {
          return true;
        }
        return false;
      });
    });
  }

  ngOnInit() {
    this.transitionService.transition();
  }

  changeApproval(session: Session, approval: string) {
    this.sessionService
        .changeApproval(session, approval)
        .then(res => {
          this.toast.success(`Session ${approval}!`);
        });
  }

  deleteSession(session: Session) {
    this.sessionService
      .deleteSession(session)
      .then(res => {
        this.sessionService
          .getAllSessions().then(() => {
            this.toast.success('Session has been deleted.');
          });
      });
  }

}
