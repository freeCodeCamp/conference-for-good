import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import "rxjs/add/operator/toPromise";
import * as _ from 'lodash';

import { environment } from '../../environments/environment';
import { handleError, parseJson, packageForPost } from './http-helpers';
import { AdminService } from './admin.service';
import { Session } from './session.model';
import { Speaker } from './speaker.model';
import { SessionService } from './session.service';

export interface SpeakerList {
  mainPresenter: Speaker;
  coPresenters: Speaker[];
}

@Injectable()
export class SpeakerService {

  baseUrl = environment.production ? '' : 'http://localhost:3000';

  // All speakers with no filtering
  speakersUnfiltered: BehaviorSubject<Speaker[]> = new BehaviorSubject([]);

  // Admins only
  admins: BehaviorSubject<Speaker[]> = new BehaviorSubject([]);

  // Non-admins only
  speakers: BehaviorSubject<Speaker[]> = new BehaviorSubject([]);

  // Speakers filtered by profile completion
  profileCompleted: BehaviorSubject<Speaker[]> = new BehaviorSubject([]);
  profileNotDone: BehaviorSubject<Speaker[]> = new BehaviorSubject([]);

  // Speakers with pending or approved proposals for the current year (aka active speakers)
  speakersActive: BehaviorSubject<Speaker[]> = new BehaviorSubject([]);

  // Active speakers filters
  activeProfileCompleted: BehaviorSubject<Speaker[]> = new BehaviorSubject([]);
  activeProfileNotDone: BehaviorSubject<Speaker[]> = new BehaviorSubject([]);
  activeNoResponseForm: BehaviorSubject<Speaker[]> = new BehaviorSubject([]);

  constructor(private http: Http,
              private adminService: AdminService,
              private sessionService: SessionService) { }

  getAllSpeakers() {
    return this.http
              .get(this.baseUrl + '/api/getallspeakers')
              .toPromise()
              .then(parseJson)
              .then(allSpeakers => {
                this.speakersUnfiltered.next(allSpeakers);
                this.setFilterAndSort();
              })
              .catch(handleError);
  }

  /** Merge sessions speaker is involved in to a list in front-end speaker model */
  setSpeakerSessions(allSpeakers: Speaker[]) {
    let sessions = this.sessionService.sessionsUnfiltered.getValue();
    allSpeakers.forEach(speaker => {
      sessions.forEach(session => {
        let speakers = session.speakers;
        if (speakers) {
          if (speakers.mainPresenter === speaker._id) {
            if (!_.find(speaker.sessions, s => s === session._id)) speaker.sessions.push(session._id);
          }
          else if (speakers.coPresenters.length > 0) {
            speakers.coPresenters.forEach(coPres => {
              if (coPres === speaker._id) {
                if (!_.find(speaker.sessions, s => s === session._id)) speaker.sessions.push(session._id);
              }
            });
          }
        }
      });
    });

    // Hacky fix, not sure why I'm getting duplicates from the above, but this removes them
    allSpeakers.forEach(speaker => {
      speaker.sessions = _.uniq(speaker.sessions);
    });

    return allSpeakers;
  }

  /** Get speaker by id */
  getSpeaker(speakerId: string) {
    return _.find(this.speakersUnfiltered.getValue(), speaker => speaker._id === speakerId );
  }

  findSpeakerByEmail(speakerEmail: string) {
    return _.find(this.speakersUnfiltered.getValue(), speaker => speaker.email === speakerEmail);
  }

  /** Update speaker display filters */
  setFilterAndSort() {
    let unfilteredCopy = this.speakersUnfiltered.getValue();
    let sortedUnfiltered: Speaker[];
    sortedUnfiltered = _.sortBy(unfilteredCopy, speaker => speaker.nameLast.toLowerCase());

    let speakersOnly = _.filter(sortedUnfiltered, speaker => !speaker.admin);
    speakersOnly = this.setSpeakerSessions(speakersOnly);
    this.speakers.next(speakersOnly);

    this.admins.next(_.filter(sortedUnfiltered, speaker => speaker.admin));

    this.profileCompleted.next(_.filter(this.speakers.getValue(), speaker => speaker.profileComplete));
    this.profileNotDone.next(_.filter(this.speakers.getValue(), speaker => !speaker.profileComplete));

    this.speakersActive.next(_.filter(this.speakers.getValue(), speaker => {
      if (speaker.sessions) {
        let defaultConf = this.adminService.defaultConference.getValue().title;
        for (let i = 0; i < speaker.sessions.length; i++) {
          let session = this.sessionService.getSession(speaker.sessions[i]);
          if (session.associatedConf === defaultConf && session.approval !== 'denied') return true;
        }
        return false;
      } else return false;
    }));

    this.activeProfileCompleted.next(_.filter(this.speakersActive.getValue(), speaker => speaker.profileComplete));
    this.activeProfileNotDone.next(_.filter(this.speakersActive.getValue(), speaker => !speaker.profileComplete));
    this.activeNoResponseForm.next(_.filter(this.speakersActive.getValue(), speaker => !speaker.responseForm.completed));

    this.speakersUnfiltered.next(sortedUnfiltered);
  }

  getSpeakerSessions(sessionIds: string[]): Session[] {
    let speakerSessions: Session[] = [];
    sessionIds.forEach(sessionId => {
      speakerSessions.push(this.sessionService.getSession(sessionId));
    });
    return speakerSessions;
  }

  /** Get a list of speaker objects from a list of speaker ID's */
  getSpeakerList(speakerIdList): SpeakerList {
    let speakers: SpeakerList = <SpeakerList>{};
    speakers.mainPresenter = this.getSpeaker(speakerIdList.mainPresenter);
    speakers.coPresenters = [];
    speakerIdList.coPresenters.forEach(coPresId => {
      speakers.coPresenters.push(this.getSpeaker(coPresId));
    });
    return speakers;
  }

  updateSpeaker(speaker: Speaker) {

    let pkg = packageForPost(speaker);
    return this.http
              .post(this.baseUrl + '/api/updatespeaker', pkg.body, pkg.opts)
              .toPromise()
              .then(parseJson)
              .then(serverSpeaker => {
                let newSpeakers = this.speakersUnfiltered.getValue();
                let existingSpeaker = _.find(newSpeakers, exSpeaker => exSpeaker._id === serverSpeaker._id);
                if (typeof existingSpeaker === 'undefined') {
                  newSpeakers.push(serverSpeaker);
                } else {
                  existingSpeaker = serverSpeaker;
                }
                this.speakersUnfiltered.next(newSpeakers);
                this.setFilterAndSort();
                return serverSpeaker;
              })
              .catch(handleError);
  }

  sendToDropbox(filename: String, directory: String) {
    return this.http
        .get(this.baseUrl + '/api/dropbox/' + filename + '/' + directory)
        .toPromise()
        .then(parseJson)
        .then(data => {
          return data;
        })
        .catch(error => {
          return error;
        });
  }

}