import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { SessionService } from '../../shared/session.service';
import { TransitionService } from '../../shared/transition.service';

@Component({
  selector: 'session-list',
  templateUrl: './session-list.component.html',
  styleUrls: ['./session-list.component.scss']
})
export class SessionListComponent implements OnInit {

  constructor(private transitionService: TransitionService,
              private sessionService: SessionService,
              private router: Router) { }

  ngOnInit() {
    this.transitionService.transition();
  }

  gotoSession(sessionId: string) {
    this.router.navigate(['/session', {id: sessionId}]);
  }

}