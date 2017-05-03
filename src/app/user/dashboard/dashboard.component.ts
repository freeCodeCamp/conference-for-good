import { Component, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import * as _ from 'lodash';

import { AdminService } from '../../shared/admin.service';
import { AuthService } from '../../shared/auth.service';
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
  activeSpeakerSessions: Session[] = [];
  pendingSessions: Session[] = [];
  scheduledSessions: Session[] = [];

  incompleteSessions: Session[] = [];

  leadOnlySessions: Session[] = [];

  activeConfIndex: number;

  speakerDetails = '';
  otherAdminAllUls: {url: string, title: string}[] = [];

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

      this.activeSpeakerSessions = _.filter(this.allSpeakerSessions, session => {
        return session.associatedConf === this.adminService.defaultConference.getValue().title;
      });

      this.incompleteSessions = _.filter(this.activeSpeakerSessions, session => {
        return !session.sessionComplete;
      });

      this.pendingSessions = _.filter(this.activeSpeakerSessions, session => {
        // Approved but unscheduled sessions are considered pending for dashboard
        if (session.approval === 'approved' && session.statusTimeLocation.length === 0) {
          return true;
        } else if (session.approval === 'pending' || session.approval === 'denied') {
          return true;
        } else {
          return false;
        }
      });

      this.scheduledSessions = _.filter(this.activeSpeakerSessions, session => {
        if (session.approval === 'approved' && session.statusTimeLocation.length > 0) {
          return true;
        }
        return false;
      });
    });

    this.leadOnlySessions = _.filter(this.allSpeakerSessions, session => session.speakers.mainPresenter === this.speaker._id);

    // Check if Brooke has uploaded speaker details document
    this.adminService.defaultConference.getValue().uploads.forEach(upload => {
      if (upload.title.toLowerCase() === 'speaker details') this.speakerDetails = upload.url;
      else this.otherAdminAllUls.push({title: upload.title, url: upload.url});
    });
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
    if (session.length === '90') {
      return '';
    } else {
      return `Part ${occurrence.part}: `;
    }
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
    } else if (speakerId === this.speaker._id) {
      this.toast.error('Cannot make yourself a Co-Presenter.');
    } else if (speakerId === 'Select a Co-Presenter') {
      this.toast.error('Please select a Co-Presenter.');
    } else {
      let isLead = false;
      this.sessionService.assignSpeaker(speakerId, isLead, sessionId)
          .then(res => {
            if (res.message === 'duplicate') {
              this.toast.error('Already a Co-Presenter for this presentation.');
            } else {
              this.toast.success('Co-Presenter assigned!');
            }
          });
    }
  }

  removeCopres(sessionId: string, speakerId: string) {
    this.sessionService.removeSpeaker(speakerId, sessionId)
        .then(res => {
          this.toast.success('Co-Presenter removed');
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
    window.open('mailto:bmeyer@genesisshelter.org');
  }

  call() {
    window.open('tel:2143997733');
  }

  hasApprovedSession(): boolean {
    let hasApprovedSession = false;
    this.activeSpeakerSessions.forEach(session => {
      if (session.approval === 'approved') hasApprovedSession = true;
    });
    return hasApprovedSession;
  }

  hasApprovedSessAndScheduled(): boolean {
    return (this.scheduledSessions.length > 0 && this.hasApprovedSession()); 
  }

  isResponseFormNeeded(): boolean {
    if (this.scheduledSessions.length > 0) {
      if (this.speaker.responseForm && !this.speaker.responseForm.completed) {
        return true;
      }
    }
    return false;
  }

  needsHandouts(): boolean {
    let needsHandouts = false;
    this.allSpeakerSessions.forEach(session => {
      if (session.handouts.length === 0) needsHandouts = true;
    });
    return needsHandouts;
  }

  noActionRequired(): boolean {
    if (!this.speaker.profileComplete) return false;
    if (this.incompleteSessions.length > 0) return false;
    if (this.isResponseFormNeeded()) return false;
    if (!this.speaker.headshot) return false;
    if (this.needsHandouts()) return false;
    if (this.speaker.adminUploads.length > 0) return false;
    if (this.otherAdminAllUls.length > 0) return false;
    return true;
  }

  monthsBefore(months: number): string {
    let conf = this.adminService.defaultConference.getValue();
    let confStart = moment(conf.dateRange.start);
    let due = confStart.subtract({months: months});
    return due.format(this.dateService.userFormatDate);
  }

}
