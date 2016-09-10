import { Component, ViewChild } from '@angular/core';

import { TransitionService } from '../../shared/transition.service';
import { AuthService } from '../../shared/auth.service';
import { Speaker } from '../../shared/speaker.model';
import { SpeakerService } from '../../shared/speaker.service';
import { ToastComponent } from '../../shared/toast.component';

@Component({
  selector: 'home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {

  @ViewChild('toast') toast: ToastComponent;

  speaker: Speaker;

  constructor(private transitionService: TransitionService,
              private authService: AuthService,
              private speakerService: SpeakerService) {

    this.authService.user.subscribe(user => {
      this.speaker = this.speakerService.getSpeaker(user._id);
    });
  }

  ngOnInit() {
    this.transitionService.transition();
  }
}