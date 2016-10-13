import { Injectable, EventEmitter } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import "rxjs/add/operator/toPromise";
import * as _ from 'lodash';

import { environment } from '../../environments/environment';
import { handleError, parseJson, packageForPost } from './http-helpers';
import { Conference, TimeSlot } from './conference.model';
import { Speaker } from './speaker.model';

@Injectable()
export class AdminService {

  baseUrl = environment.production ? '' : 'http://localhost:3000';

  // All conferences (including archived)
  allConferences: Conference[] = [];

  // Archived only
  archivedConferences: Conference[] = [];

  // Active only
  conferences: Conference[] = [];

  activeConference: BehaviorSubject<Conference> = new BehaviorSubject(null);
  defaultConference: BehaviorSubject<Conference> = new BehaviorSubject(null);

  triggerSessionUpdate: EventEmitter<any> = new EventEmitter();

  constructor(private http: Http) { }

  createConference(title: string, startDate: string, endDate: string) {
    this.resetActiveConfs();
    this.resetDefaultConfs();
    let newConf: Conference = {
      archived: false,
      lastActive: true,
      defaultConf: true,
      title: title,
      dateRange: {
        start: startDate,
        end: endDate
      }
    };
    this.allConferences.push(newConf);
    this.setFilterAndSort();
    this.activeConference.next(newConf);
    this.defaultConference.next(newConf);
    let pkg = packageForPost(newConf);
    return this.http
              .post(this.baseUrl + '/api/createconference', pkg.body, pkg.opts)
              .toPromise()
              .then(parseJson)
              .catch(handleError);
  }

  changeActiveConf(confTitle: string) {
    let conf = _.find(this.allConferences, conf => conf.title === confTitle);
    this.resetActiveConfs();
    conf.lastActive = true;
    this.activeConference.next(conf);
    let pkg = packageForPost(conf);
    return this.http
              .post(this.baseUrl + '/api/changeactiveconf', pkg.body, pkg.opts)
              .toPromise()
              .then(parseJson)
              .catch(handleError);
  }

  changeDefaultConf(confTitle: string) {
    let conf = _.find(this.allConferences, conf => conf.title === confTitle);
    this.resetDefaultConfs();
    conf.defaultConf = true;
    this.defaultConference.next(conf);
    let pkg = packageForPost(conf);
    return this.http
              .post(this.baseUrl + '/api/changedefaultconf', pkg.body, pkg.opts)
              .toPromise()
              .then(parseJson)
              .catch(handleError);
  }

  resetActiveConfs() {
    this.conferences.forEach(conf => {
      conf.lastActive = false;
    });
  }

  resetDefaultConfs() {
    this.conferences.forEach(conf => {
      conf.defaultConf = false;
    });
  }

  archiveConf(confTitle: string, archive: boolean) {
    let conf = _.find(this.allConferences, conf => conf.title === confTitle);
    conf.archived = archive;
    this.setFilterAndSort();
    let pkg = packageForPost(conf);
    return this.http
              .post(this.baseUrl + '/api/archiveconf', pkg.body, pkg.opts)
              .toPromise()
              .then(parseJson)
              .catch(handleError);
  }

  updateConference(currentTitle: string, newTitle) {
    let conference = _.find(this.allConferences, conf => conf.title === currentTitle);
    conference.title = newTitle;
    let pkg = packageForPost({currentTitle: currentTitle, conference: conference});
    return this.http
              .post(this.baseUrl + '/api/updateconference', pkg.body, pkg.opts)
              .toPromise()
              .then(parseJson)
              .then(res => {
                this.triggerSessionUpdate.emit('update');
                return res;
              })
              .catch(handleError);
  }

  addTimeslot(startTime: string, endTime: string,
              conferenceTitle: string, date: string) {
    let newTimeSlot = {start: startTime, end: endTime};
/*    let conference = _.find(this.allConferences, conf => conf.title === conferenceTitle);
    let confDate = _.find(conference.days, day => day.date === date);
    // Shallow clone to prevent premature updates
    let confCopy = _.clone(conference);

    let confDateCopy = _.find(confCopy.days, day => day.date === date);
    

    // If day has no slots yet, make it and add the new slot
    if (typeof confDateCopy === 'undefined') {
      if (typeof confCopy.days === 'undefined') confCopy.days = [];
      let newDay: (any) = {
        date: date,
        timeSlots: [newTimeSlot]
      };
      confCopy.days.push(newDay);
    } else {
      confDateCopy.timeSlots.push(newTimeSlot);
    }*/
    let pkg = packageForPost({title: conferenceTitle, newSlot: newTimeSlot, date: date });
    return this.http
              .post(this.baseUrl + '/api/addtimeslot', pkg.body, pkg.opts)
              .toPromise()
              .then(parseJson)
              .then(serverConf => {
                // Need slot ID
                this.getAllConferences();
                return serverConf;
              })
              .catch(handleError);
  }

  sortConfSlotsAndDays(conf: Conference) {
    if (!conf.days) return;
    conf.days.forEach(day => {
      day.timeSlots = _.sortBy(day.timeSlots, slot => slot.end);
    });
    
    conf.days = _.sortBy(conf.days, day => day.date);
    return conf;
  }

  /** Find slot within active conference by its id */
  findSlotById(slotId): TimeSlot {
    let slot: TimeSlot;
    this.defaultConference.getValue().days.forEach(day => {
      let reqSlot = _.find(day.timeSlots, slot => slot._id === slotId);
      if (typeof reqSlot !== 'undefined') slot = reqSlot;
    });
    return slot;
  }

  findDateBySlot(slotId: string) {
    let date: string;
    this.defaultConference.getValue().days.forEach(day => {
      let reqSlot = _.find(day.timeSlots, daySlot => daySlot._id === slotId);
      if (typeof reqSlot !== 'undefined') date = day.date;
    });
    return date;
  }

  addRoom(conferenceTitle: string, room: string) {
    let conf = _.find(this.allConferences, conf => conf.title === conferenceTitle);

    if (!conf.rooms) conf.rooms = [];
    // Sync front end
    conf.rooms.push(room);
    if (conf.title === this.activeConference.getValue().title) this.activeConference.next(conf);

    let pkg = packageForPost(conf);
    return this.http
        .post(this.baseUrl + '/api/addRoom', pkg.body, pkg.opts)
        .toPromise()
        .then(parseJson)
        .catch(handleError);
  }

  moveRoom(conferenceTitle: string, room: string, direction: string) {
    let conf = _.find(this.allConferences, conf => conf.title === conferenceTitle);

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
              .post(this.baseUrl + '/api/updateconfrooms', pkg.body, pkg.opts)
              .toPromise()
              .then(parseJson)
              .catch(handleError);
  }

  getAllConferences() {
    return this.http
              .get(this.baseUrl + '/api/getallconferences')
              .toPromise()
              .then(parseJson)
              .then(conferences => {
                this.allConferences = conferences;
                this.setFilterAndSort();
                
                let activeConf = _.find(this.allConferences, conf => conf.lastActive === true);
                this.activeConference.next(activeConf);
                let defaultConf = _.find(this.allConferences, conf => conf.defaultConf === true);
                this.defaultConference.next(defaultConf);
                return conferences;
              })
              .catch(handleError);
  }

  /** Update conference filters */
  setFilterAndSort() {
    // Sort conferences in reverse order(2017 first, 2016 second...)
    this.allConferences = _.reverse(_.sortBy(this.allConferences, conf => conf.title));
    this.allConferences.forEach(conf => {
      conf = this.sortConfSlotsAndDays(conf);
    });

    this.archivedConferences = _.filter(this.allConferences, conf => conf.archived);
    this.conferences = _.filter(this.allConferences, conf => !conf.archived);
  }
  
}