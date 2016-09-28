import { Component, Input, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import * as moment from 'moment';
import * as _ from 'lodash';

import { AdminService } from '../admin.service';
import { AuthService } from '../auth.service';
import { Conference } from '../conference.model';
import { DateService } from '../date.service';
import { Speaker } from '../speaker.model';
import { SpeakerService } from '../speaker.service';
import { TransitionService } from '../transition.service';

@Component({
  selector: 'response',
  templateUrl: './response.component.html',
  styleUrls: ['./response.component.scss']
})
export class ResponseComponent implements OnInit {
  
  private paramsub: any;

  model: Speaker;
  mealDates;
  dietaryNeeds = [ 
    {
      name: 'None',
      checked: false 
    },
    {
      name: 'Vegetarian',
      checked: false
    },
    {
      name: 'Vegan',
      checked: false
    },
    {
      name: 'Gluten-Free',
      checked: false
    },
    {
      name: 'Dairy-Free',
      checked: false
    },
    {
      name: 'Other',
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

      if (!this.model.responseForm) {
        this.generateMealDates();
        this.model.responseForm = <any>{
          mealDates: this.mealDates,
          dietaryNeeds: this.dietaryNeeds
        }
      }
    });
  }

  /** Generate meal date choices based on conference dates */
  generateMealDates() {
    let conf: Conference = this.adminService.defaultConference.getValue();
    let startMoment = moment(conf.dateRange.start);
    let endMoment = moment(conf.dateRange.end);
    let mealDates = [];
    for (let i = startMoment; i.isSameOrBefore(endMoment); i.add(1, 'd')) {
      let breakfast = {
        date: i.format(this.dateService.userFormatDate),
        meal: 'Breakfast',
        attending: false
      };
      let lunch = {
        date: i.format(this.dateService.userFormatDate),
        meal: 'Breakfast',
        attending: false
      };
      mealDates.push(breakfast);
      mealDates.push(lunch);
    }

    this.mealDates = mealDates;
  }

}