import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { SpeakerService } from '../../shared/speaker.service';
import { Speaker } from '../../shared/speaker.model';
import { TransitionService } from '../../shared/transition.service';

@Component({
  selector: 'speaker-list',
  templateUrl: './speaker-list.component.html',
  styleUrls: ['./speaker-list.component.scss']
})
export class SpeakerListComponent implements OnInit {

  defaultFilter = 'active';
  currentFilter: string;
  displaySpeakers: BehaviorSubject<Speaker[]> = new BehaviorSubject([]);

  constructor(private transitionService: TransitionService,
              private speakerService: SpeakerService,
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
        this.displaySpeakers.next(this.speakerService.speakers.getValue());
        break;
      case 'unarchived':
        this.displaySpeakers.next(this.speakerService.unArchivedSpeakers.getValue());
        break;
      case 'unarchived complete':
        this.displaySpeakers.next(this.speakerService.profileCompleted.getValue());
        break;
      case 'unarchived incomplete':
        this.displaySpeakers.next(this.speakerService.profileNotDone.getValue());
        break;
      case 'active':
        this.displaySpeakers.next(this.speakerService.speakersActive.getValue());
        break;
      case 'active complete':
        this.displaySpeakers.next(this.speakerService.activeProfileCompleted.getValue());
        break;
      case 'active incomplete':
        this.displaySpeakers.next(this.speakerService.activeProfileNotDone.getValue());
        break;
      case 'archived':
        this.displaySpeakers.next(this.speakerService.archivedSpeakers.getValue());
        break;
      default:
        break;
    }
  }

  gotoSpeaker(speakerId: string) {
    this.router.navigate(['/speaker', {id: speakerId}]);
  }

}
