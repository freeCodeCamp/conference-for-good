import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import * as moment from 'moment';
import * as _ from 'lodash';

import { AdminService } from '../../shared/admin.service';
import { Conference } from '../../shared/conference.model';
import { TransitionService } from '../../shared/transition.service';
import { ToastComponent } from '../../shared/toast.component';

@Component({
  selector: 'create-conf',
  templateUrl: './create-conf.component.html',
  styleUrls: ['./create-conf.component.scss']
})
export class CreateConfComponent implements OnInit {

  @ViewChild('toast') toast: ToastComponent;

  constructor(private transitionService: TransitionService,
              private adminService: AdminService) { }

  ngOnInit() {
    this.transitionService.transition();
  }

  createConf(title: HTMLInputElement, start: HTMLInputElement, end: HTMLInputElement) {
    let titleText = title.value;
    if (titleText.length < 1) {
      this.toast.error('Create a title for your conference');
      return;
    }
    // Input date value format: 2016-12-30
    let startText = start.value;
    let endText = end.value;
    let startMoment = moment(startText);
    let endMoment = moment(endText);
    let startValid = startMoment.isValid();
    let endValid = endMoment.isValid();
    if (startValid && endValid) {
      if (endMoment.isSameOrBefore(startMoment)) {
        this.toast.error("The end date must be after start date");
      } else {
        this.adminService
            .getAllConferences()
            .then((conferences: Conference[]) => {
              if (!this.isDuplicateTitle(conferences, titleText)) {
                this.adminService.createConference(titleText, startText, endText)
                    .then(res => {
                      this.toast.success('Conference created!');
                      title.value = '';
                      start.value = "";
                      end.value = "";
                    });
              } else {
                this.toast.error('Conference title already exists, please choose another');
              }
            })
      }
    } else if (!startValid) {
      this.toast.error('Start date invalid');
    } else if (!endValid) {
      this.toast.error('End date invalid');
    }
  }

  isDuplicateTitle(conferences: Conference[], title: string) {
    let duplicateTitle = _.find(conferences, conf => conf.title.toLowerCase() === title.toLowerCase());
    return typeof duplicateTitle !== 'undefined';
  }

}