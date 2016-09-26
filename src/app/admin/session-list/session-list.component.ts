import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { Session } from '../../shared/session.model';
import { SessionService } from '../../shared/session.service';
import { TransitionService } from '../../shared/transition.service';

@Component({
  selector: 'session-list',
  templateUrl: './session-list.component.html',
  styleUrls: ['./session-list.component.scss']
})
export class SessionListComponent implements OnInit {

  defaultFilter = 'active';
  currentFilter: string;
  displaySessions: BehaviorSubject<Session[]> = new BehaviorSubject([]);

  constructor(private transitionService: TransitionService,
              private sessionService: SessionService,
              private router: Router) { }

  ngOnInit() {
    this.transitionService.transition();
    this.currentFilter = this.defaultFilter;
    this.setFilter(this.currentFilter);
  }

  setFilter(filter: string) {
    filter = filter.toLowerCase();
    this.currentFilter = filter;
    switch (filter) {
      case 'all':
        this.displaySessions.next(this.sessionService.sessionsUnfiltered.getValue());
        break;
      case 'active':
        this.displaySessions.next(this.sessionService.sessionsActive.getValue());
        break;
      case 'complete':
        this.displaySessions.next(this.sessionService.sessionsCompleted.getValue());
        break;
      case 'incomplete':
        this.displaySessions.next(this.sessionService.sessionsNotDone.getValue());
        break;
      case 'pending':
        this.displaySessions.next(this.sessionService.sessionsPending.getValue());
        break;
      case 'approved':
        this.displaySessions.next(this.sessionService.sessionsApproved.getValue());
        break;
      case 'denied':
        this.displaySessions.next(this.sessionService.sessionsDenied.getValue());
        break;
      default:
        break;
    }
  }

  getType(type: string) {
    let displayType = '';
    switch (type) {
      case 'casestudy':
        displayType = 'Case Study';
        break;
      case 'workshop':
        displayType = 'Workshop';
        break;
      case 'computerlab':
        displayType = 'Computer Lab';
        break;
      default:
        break;
    }
    return displayType;
  }

  gotoSession(sessionId: string) {
    this.router.navigate(['/session', {id: sessionId}]);
  }

}