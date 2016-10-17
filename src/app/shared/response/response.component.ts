import { Component, Input, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import * as _ from 'lodash';

import { AdminService } from '../admin.service';
import { AuthService } from '../auth.service';
import { Conference } from '../conference.model';
import { DateService } from '../date.service';
import { Speaker } from '../speaker.model';
import { SpeakerService } from '../speaker.service';
import { TransitionService } from '../transition.service';
import { ToastComponent } from '../toast.component';

@Component({
  selector: 'response',
  templateUrl: './response.component.html',
  styleUrls: ['./response.component.scss']
})
export class ResponseComponent implements OnInit, OnDestroy {

  @ViewChild('toast') toast: ToastComponent;

  private paramsub: any;

  model: Speaker;

  dietaryNeeds = [
    {
      need: 'Vegetarian',
      checked: false
    },
    {
      need: 'Vegan',
      checked: false
    },
    {
      need: 'Gluten-Free',
      checked: false
    },
    {
      need: 'Dairy-Free',
      checked: false
    },
    {
      need: 'Other',
      checked: false
    }
  ];

  constructor(private transitionService: TransitionService,
              private authService: AuthService,
              private adminService: AdminService,
              private dateService: DateService,
              private speakerService: SpeakerService,
              private route: ActivatedRoute,
              private router: Router) { }

  ngOnInit() {
    this.transitionService.transition();

    this.paramsub = this.route.params.subscribe(params => {
      this.model = this.speakerService.getSpeaker(params['id']);

      if (!this.model.responseForm.completed) {
        this.model.responseForm = <any>{};
        this.model.responseForm.dietaryNeeds = this.dietaryNeeds;
        this.generateMealDates();
      }
    });
  }

  ngOnDestroy() {
    this.paramsub.unsubscribe();
  }

  /** Generate meal date choices based on conference dates */
  generateMealDates() {
    let conf: Conference = this.adminService.defaultConference.getValue();
    let startMoment = moment(conf.dateRange.start);
    let endMoment = moment(conf.dateRange.end);
    let mealDates = [];
    for (let i = startMoment; i.isSameOrBefore(endMoment); i.add(1, 'd')) {
      
      let breakfast = {
        date: i.format(this.dateService.dbFormatDate),
        meal: 'Breakfast',
        label: `Breakfast- ${i.format(this.dateService.userFormatDate)}`,
        attending: false
      };
      mealDates.push(breakfast);

      // No lunch on last day
      if (!i.isSame(endMoment)) {
        let lunch = {
          date: i.format(this.dateService.dbFormatDate),
          meal: 'Lunch',
          label: `Lunch- ${i.format(this.dateService.userFormatDate)}`,
          attending: false
        };
        mealDates.push(lunch);
      }
    }

    this.model.responseForm.mealDates = mealDates;
  }

  changeDate(isChecked: boolean, dateChecked) {
    let date = _.find(this.model.responseForm.mealDates, date => date.label === dateChecked.label);
    date.attending = isChecked;
  }

  changeNeed(isChecked: boolean, needChecked) {
    let need = _.find(this.model.responseForm.dietaryNeeds, need => need.need === needChecked.need);
    need.checked = isChecked;
  }

  otherDietaryChecked() {
    let otherNeed = _.find(this.model.responseForm.dietaryNeeds, need => need.need === 'Other');
    return otherNeed.checked;
  }

  isFormValid(validFields: boolean) {
    if (!validFields) return false;
    let formValid = true;
    let form = this.model.responseForm;
    if (form.ccawCoveringHotel === 'yes') {
      if (form.agreedHotel === 'no') formValid = false;
    }
    if (form.agreedTransport === 'no') formValid = false;
    return formValid;
  }

  submitResponse() {
    this.model.responseForm.completed = true;
    this.speakerService
        .updateSpeaker(this.model)
        .then(res => {
          if (this.authService.user.getValue().admin) {
            this.toast.success('Speaker response submitted.')
          } else {
            this.router.navigate(['/dashboard', { msg: 'Response form submitted!' }]);
          }
        });
  }

  clearResponse() {
    this.model.responseForm = <any>{};
    this.model.responseForm.completed = false;
    this.model.responseForm.dietaryNeeds = this.dietaryNeeds;
    this.generateMealDates();
    this.speakerService
        .updateSpeaker(this.model)
        .then(res => {
          this.router.navigate(['/speaker', {id: this.model._id, msg: 'Speaker response form cleared.'}]);
        });
  }

  email() {
    window.open("mailto:bmeyer@genesisshelter.org");
  }

  monthsBefore(months: number): string {
    let conf = this.adminService.defaultConference.getValue();
    let confStart = moment(conf.dateRange.start);
    let due = confStart.subtract({months: months});
    return due.format(this.dateService.userFormatDate);
  }

}