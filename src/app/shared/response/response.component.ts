import { Component, Input, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';

import { AuthService } from '../auth.service';
import { Speaker } from '../speaker.model';
import { SpeakerService } from '../speaker.service';
import { TransitionService } from '../transition.service';

@Component({
  selector: 'response',
  templateUrl: './response.component.html',
  styleUrls: ['./response.component.scss']
})
export class ResponseComponent implements OnInit {
  
  model: Speaker;

  constructor(private transitionService: TransitionService,
              private authService: AuthService,
              private speakerService: SpeakerService,
              private router: Router) { }

  ngOnInit() {
    this.transitionService.transition();

    this.model = this.authService.user.getValue();
  }

}