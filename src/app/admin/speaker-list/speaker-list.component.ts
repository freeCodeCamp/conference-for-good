import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { CapitalizePipe } from '../../shared/capitalize.pipe';
import { SpeakerService } from '../../shared/speaker.service';
import { TransitionService } from '../../shared/transition.service';

@Component({
  selector: 'speaker-list',
  templateUrl: './speaker-list.component.html',
  styleUrls: ['./speaker-list.component.scss']
})
export class SpeakerListComponent implements OnInit {
  
  constructor(private transitionService: TransitionService,
              private speakerService: SpeakerService,
              private router: Router) { }

  ngOnInit() {
    this.transitionService.transition();
  }

  gotoSpeaker(speakerId: string) {
    this.router.navigate(['/speaker', {id: speakerId}]);
  }

}