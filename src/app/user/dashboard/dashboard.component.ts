import { Component, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import * as _ from 'lodash';

import { AdminService } from '../../shared/admin.service';
import { AuthService } from '../../shared/auth.service';
import { Conference } from '../../shared/conference.model';
import { DatePipe } from '../../shared/date.pipe';
import { DateService } from '../../shared/date.service';
import { TransitionService } from '../../shared/transition.service';
import { SessionService } from '../../shared/session.service';
import { Session } from '../../shared/session.model';
import { Speaker } from '../../shared/speaker.model';
import { SpeakerService } from '../../shared/speaker.service';
import { ToastComponent } from '../../shared/toast.component';

@Component({
  selector: 'dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {

  @ViewChild('toast') toast: ToastComponent;
  @ViewChild('copresLink') copresLink: ElementRef;

  speaker: Speaker;
  allSpeakerSessions: Session[] = [];
  pendingSessions: Session[] = [];
  scheduledSessions: Session[] = [];

  incompleteSessions: Session[] = [];

  leadOnlySessions: Session[] = [];

  activeConfIndex: number;

  private paramsub: any;

  constructor(private transitionService: TransitionService,
              private adminService: AdminService,
              private authService: AuthService,
              private dateService: DateService,
              private route: ActivatedRoute,
              private router: Router,
              private sessionService: SessionService,
              private speakerService: SpeakerService) {

    this.authService.user.subscribe(user => {
      this.speaker = this.speakerService.getSpeaker(user._id);
      let defConf = this.adminService.defaultConference.getValue().title;
      this.activeConfIndex = _.findIndex(this.speaker.arrangements,
                                    arrange => arrange.associatedConf === defConf);
    });

    this.sessionService.sessionsUnfiltered.subscribe(sessions => {
      this.allSpeakerSessions = this.sessionService.getSpeakerSessions(this.speaker._id);

      this.incompleteSessions = _.filter(this.allSpeakerSessions, session => !session.sessionComplete);

      this.pendingSessions = _.filter(this.allSpeakerSessions, session => {
        // Approved but unscheduled sessions are considered pending for dashboard
        if (session.approval === 'approved') {
          if (session.statusTimeLocation.length === 0) return true;
        }
        if (session.approval === 'pending' || session.approval === 'denied') {
          return true;
        }
        return false;
      });

      this.scheduledSessions = _.filter(this.allSpeakerSessions, session => {
        if (session.approval === 'approved' && session.statusTimeLocation.length > 0) {
          return true;
        }
        return false;
      });
    });

    this.leadOnlySessions = _.filter(this.allSpeakerSessions, session => session.speakers.mainPresenter === this.speaker._id);

  }

  ngOnInit() {
    this.transitionService.transition();

    this.paramsub = this.route.params.subscribe(params => {
      if (params['msg']) {
        this.toast.success(params['msg']);
      }
    });
  }

  ngOnDestroy() {
    this.paramsub.unsubscribe();
  }

  getPart(session: Session, occurrence) {
    if (session.length === '90') return '';
    else return `Part ${occurrence.part}: `
  }

  getDate(occurrence) {
    return this.adminService.findDateBySlot(occurrence.timeSlot);
  }

  slot(occurrence) {
    return this.adminService.findSlotById(occurrence.timeSlot);
  }

  addCopres(sessionId: string, speakerId: string) {
    if (sessionId === '') {
      this.toast.error('Please select the presentation this copresenter will be assigned to.');
      return;
    }
    if (speakerId === this.speaker._id) {
      this.toast.error('Cannot make yourself a copresenter.');
      return;
    }
    let isLead = false;
    this.sessionService.assignSpeaker(speakerId, isLead, sessionId)
        .then(res => {
          if (res.message === 'duplicate') {
            this.toast.error('Already a copresenter for this presentation');
          } else {
            this.toast.success('Copresenter assigned');
          }
        });
  }

  removeCopres(sessionId: string, speakerId: string) {
    this.sessionService.removeSpeaker(speakerId, sessionId)
        .then(res => {
          this.toast.success('Copresenter removed');
        });
  }

  goto(where: string) {
    switch (where) {
      case 'profile':
        this.router.navigate(['/speaker', { id: this.speaker._id }]);
        break;
      case 'proposal':
        this.router.navigate(['/session', { leadPresId: this.speaker._id }]);
        break;
      case 'copres':
        this.router.navigate(['/speaker', { leadPresId: this.speaker._id }]);
        break;
      default:
        break;
    }
  }

  copresLinkJump() {
    let copresLink: HTMLDivElement = this.copresLink.nativeElement;
    copresLink.scrollIntoView(true);
  }

  email() {
    window.open("mailto:bmeyer@genesisshelter.org");
  }

  call() {
    window.open("tel:2143997733");
  }

  isResponseFormNeeded(): boolean {
    if (this.scheduledSessions.length > 0) {
      if (this.speaker.responseForm && !this.speaker.responseForm.completed) {
        return true;
      }
    }
    return false;
  }

  monthsBefore(months: number): string {
    let conf = this.adminService.defaultConference.getValue();
    let confStart = moment(conf.dateRange.start);
    let due = confStart.subtract({months: months});
    return due.format(this.dateService.userFormatDate);
  }

}