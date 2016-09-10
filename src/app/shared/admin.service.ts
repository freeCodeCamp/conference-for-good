import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import "rxjs/add/operator/toPromise";
import * as _ from 'lodash';

import { handleError, parseJson, packageForPost } from './http-helpers';
import { Conference, TimeSlot } from './conference.model';
import { Speaker } from './speaker.model';

@Injectable()
export class AdminService {

  conferences: Conference[] = [];
  activeConference: BehaviorSubject<Conference> = new BehaviorSubject(null);

  constructor(private http: Http) { }

  createConference(title: string, startDate: string, endDate: string) {
    this.resetActiveConfs();
    let newConf: Conference = {
      lastActive: true,
      title: title,
      dateRange: {
        start: startDate,
        end: endDate
      }
    };
    this.conferences.push(newConf);
    this.activeConference.next(newConf);
    let pkg = packageForPost(newConf);
    return this.http
              .post('/api/createconference', pkg.body, pkg.opts)
              .toPromise()
              .then(parseJson)
              .catch(handleError);
  }

  changeActiveConf(confTitle: string) {
    let conf = _.find(this.conferences, conf => conf.title === confTitle);
    this.resetActiveConfs();
    conf.lastActive = true;
    this.activeConference.next(conf);
    let pkg = packageForPost(conf);
    return this.http
              .post('/api/changeactiveconf', pkg.body, pkg.opts)
              .toPromise()
              .then(parseJson)
              .catch(handleError);
  }

  resetActiveConfs() {
    this.conferences.forEach(conf => {
      conf.lastActive = false;
    });
  }

  updateConference(currentTitle: string, newTitle, startDate, endDate) {
    let conference = _.find(this.conferences, conf => conf.title === currentTitle);
    conference.title = newTitle;
    conference.dateRange = {
      start: startDate,
      end: endDate
    };
    let pkg = packageForPost({currentTitle: currentTitle, conference: conference});
    return this.http
              .post('/api/updateconference', pkg.body, pkg.opts)
              .toPromise()
              .then(parseJson)
              .catch(handleError);
  }

  addTimeslot(startTime: string, endTime: string,
              conferenceTitle: string, date: string) {
    let conference = _.find(this.conferences, conf => conf.title === conferenceTitle);
    let confDate = _.find(conference.days, day => day.date === date);
    let newTimeSlot = {start: startTime, end: endTime};

    // If day has no slots yet, make it and add the new slot
    if (typeof confDate === 'undefined') {
      if (typeof conference.days === 'undefined') conference.days = [];
      let newDay = {
        date: date,
        timeSlots: [newTimeSlot]
      };
      conference.days.push(newDay);
    } else {
      confDate.timeSlots.push(newTimeSlot);
    }
    let pkg = packageForPost(conference);
    return this.http
              .post('/api/changetimeslot', pkg.body, pkg.opts)
              .toPromise()
              .then(parseJson)
              .then(serverConf => {
                // Need conference ID
                conference = serverConf;
                conference = this.sortConfSlotsAndDays(conference);
                if (conference.title === this.activeConference.getValue().title) {
                  this.activeConference.next(conference);
                }
              })
              .catch(handleError);
  }

  sortConfSlotsAndDays(conf: Conference) {
    conf.days.forEach(day => {
      day.timeSlots = _.sortBy(day.timeSlots, slot => slot.end);
    });
    
    conf.days = _.sortBy(conf.days, day => day.date);
    return conf;
  }

  /** Find slot within active conference by its id */
  findSlotById(slotId): TimeSlot {
    let slot: TimeSlot;
    this.activeConference.getValue().days.forEach(day => {
      let reqSlot = _.find(day.timeSlots, slot => slot._id === slotId);
      if (typeof reqSlot !== 'undefined') slot = reqSlot;
    });
    return slot;
  }

  findDateBySlot(slotId: string) {
    let date: string;
    this.activeConference.getValue().days.forEach(day => {
      let reqSlot = _.find(day.timeSlots, daySlot => daySlot._id === slotId);
      if (typeof reqSlot !== 'undefined') date = day.date;
    });
    return date;
  }

  addRoom(conferenceTitle: string, room: string) {
    let conf = _.find(this.conferences, conf => conf.title === conferenceTitle);

    if (typeof conf.rooms === 'undefined') conf.rooms = [];
    // Sync front end
    conf.rooms.push(room);

    let pkg = packageForPost(conf);
    return this.http
        .post('/api/addRoom', pkg.body, pkg.opts)
        .toPromise()
        .then(parseJson)
        .catch(handleError);
  }

  moveRoom(conferenceTitle: string, room: string, direction: string) {
    let conf = _.find(this.conferences, conf => conf.title === conferenceTitle);

    let roomStarti = conf.rooms.indexOf(room);
    let roomEndi = direction === '+' ? roomStarti+1 : roomStarti-1;
    if (roomEndi > conf.rooms.length-1 || 
        roomEndi < 0) return;
    let roomsDupe = conf.rooms.slice();
    let displacedRoom = roomsDupe[roomEndi];
    
    conf.rooms[roomStarti] = displacedRoom;
    conf.rooms[roomEndi] = room;

    let pkg = packageForPost(conf);
    return this.http
              .post('/api/updateconfrooms', pkg.body, pkg.opts)
              .toPromise()
              .then(parseJson)
              .catch(handleError);
  }

  getAllConferences() {
    return this.http
              .get('/api/getallconferences')
              .toPromise()
              .then(parseJson)
              .then(conferences => {
                this.conferences = conferences;
                this.conferences.forEach(conf => {
                  conf = this.sortConfSlotsAndDays(conf);
                });
                let activeConf = _.find(this.conferences, conf => conf.lastActive === true);
                this.activeConference.next(activeConf);
                return conferences;
              })
              .catch(handleError);
  }
  
}