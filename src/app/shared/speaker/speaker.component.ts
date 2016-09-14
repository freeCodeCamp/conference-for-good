import { Component, Input, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';

import { AuthService } from '../auth.service';
import { SpeakerService } from '../speaker.service';
import { TransitionService } from '../transition.service';
import { ToastComponent } from '../toast.component';
import { Speaker } from '../speaker.model';

@Component({
  selector: 'speaker',
  templateUrl: './speaker.component.html',
  styleUrls: ['./speaker.component.scss']
})
export class SpeakerComponent implements OnInit, OnDestroy {

  @ViewChild('toast') toast: ToastComponent;

  private paramsub: any;

  model: Speaker;
  leadPresId: string = null;
  requiredProfileFields = ['nameFirst', 'nameLast', 'email', 'organization', 'bioWebsite', 'bioProgram'];

  costsCovered = [
    {
      name: 'travel',
      covered: false
    },
    {
      name: 'lodging',
      covered: false
    }
  ];

  constructor(private transitionService: TransitionService,
              private authService: AuthService,
              private speakerService: SpeakerService,
              private route: ActivatedRoute) { }

  ngOnInit() {

    this.transitionService.transition();

    // Check for params
    this.paramsub = this.route.params.subscribe(params => {
      // Initialize fields for brand new speakers
      if (!params['id']) {
        this.model = <Speaker>{
          mediaWilling: true,
          costsCoveredByOrg: this.costsCovered,
          hasPresentedAtCCAWInPast2years: false,
        }
        this.model.address2 = '';
        this.model.assistantOrCC = '';
      } else {
        this.model = this.speakerService.getSpeaker(params['id']);
      }
      if (params['leadPresId']) {
        this.leadPresId = params['leadPresId'];
      }
    });
  }

  ngOnDestroy() {
    this.paramsub.unsubscribe();
  }

  capitalize(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  changeCostCovered(isChecked: boolean, costChecked) {
    let cost = _.find(this.model.costsCoveredByOrg, cost => cost.name === costChecked.name);
    cost.covered = isChecked;
  }

  updateSpeaker(form: any) {
    this.model.profileComplete = this.checkProfile(form);

    if (this.leadPresId) {
      if (this.speakerService.findSpeakerByEmail(this.model.email)) {
        this.toast.error('A speaker with that email already exists');
        return;
      }
      let leadPres = this.speakerService.getSpeaker(this.leadPresId);
      let signupData = {
        email: this.model.email,
        firstName: this.model.nameFirst,
        lastName: this.model.nameLast
      };
      this.authService
          .signUpForCopres(leadPres, signupData)
          .then(res => {
            // We need to sync the mongoos ID before udating remaining fields
            this.model._id = res.userId;
            this.speakerService
                .updateSpeaker(this.model)
                .then(res => {
                  this.toast.success('Copresenter account created and emailed!')
                });
          });
    } else {
      this.speakerService
          // Must user model here rather than form, not all fields are
          // 2-way data bound and are only updated via model (costsCovered)
          .updateSpeaker(this.model)
          .then(res => this.toast.success('Speaker updated!'));
    }
  }

  checkProfile(form: any) {
    var flag = true;

    this.requiredProfileFields.forEach(function(item) {
      if (!form[item]) {
        flag = false;
      }
    });

    return flag;
  }

}