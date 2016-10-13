import { Component, OnInit, ViewChild } from '@angular/core';
import * as _ from 'lodash';
let fileSaver = require('file-saver');

import { ExportingService } from './exporting.service';
import { Session } from '../../shared/session.model';
import { SessionService } from '../../shared/session.service';
import { Speaker, ResponseForm, Arrangements } from '../../shared/speaker.model';
import { SpeakerService } from '../../shared/speaker.service';
import { TransitionService } from '../../shared/transition.service';
import { ToastComponent } from '../../shared/toast.component';

@Component({
  selector: 'app-exporting',
  templateUrl: './exporting.component.html',
  styleUrls: ['./exporting.component.scss'],
  providers: [ExportingService]
})
export class ExportingComponent implements OnInit {

  @ViewChild('toast') toast: ToastComponent;

  sessionFields: {name: string; checked: boolean}[] = [];
  
  speakerFields: {name: string, checked: boolean}[] = [];
  responseFields: {name: string, checked: boolean}[] = []; 
  arrangeFields: {name: string, checked: boolean}[] = [];

  constructor(private transitionService: TransitionService,
              private exportingService: ExportingService,
              private sessionService: SessionService) { }

  ngOnInit() {
    this.transitionService.transition();
    this.getFields();
  }

  getFields() {
    let refSess: Session = this.genRefSession();
    //let refSess = this.sessionService.sessionsActive.getValue()[0];
    for (let field in refSess) {
      if (refSess.hasOwnProperty(field)) {
        this.sessionFields.push({name: field, checked: false});
      }
    }

    let refSpeaker: Speaker = this.genRefSpeaker();
    for (let field in refSpeaker) {
      if (refSpeaker.hasOwnProperty(field)) {
        if (field !== 'password') this.speakerFields.push({name: field, checked: false});
      }
    }

    let refResp: ResponseForm = this.genRefResponse();
    for (let field in refResp) {
      if (refResp.hasOwnProperty(field)) {
        this.responseFields.push({name: field, checked: false});
      }
    }

    let refArrange: Arrangements = this.genRefArrangements();
    for (let field in refArrange) {
      if (refArrange.hasOwnProperty(field)) {
        this.arrangeFields.push({name: field, checked: false});
      }
    }
  }

  exportResponse(): boolean {
    return _.find(this.speakerFields, field => field.name === 'responseForm').checked;
  }

  exportArrange(): boolean {
    return _.find(this.speakerFields, field => field.name === 'arrangements').checked;
  }

  /** Empty session with all fields to loop through */
  genRefSession() {
    let refSess: Session = {
      associatedConf: '', approval: '', type: '', length: '',
      title: '', descriptionWebsite: '', descriptionProgram: '',
      tags: [], level: '', willingToBeRecorded: '',
      isMediaOrPressFriendly: '', willingToRepeat: true, 
      hasAVneeds: '', avNeeds: '', speakers: {mainPresenter: '', coPresenters: []}, 
      statusTimeLocation: [],
      miscRequirements: '', sessionComplete: false
    }
    return refSess;
  }

  genRefSpeaker() {
    let refSpeaker: Speaker = {
      admin: false, password: '', salutation: '', 
      nameFirst: '', nameLast: '', email: '',
      profileComplete: false, status: '', statusNotification: false,
      title: '', organization: '', address1: '', address2: '',
      city: '', state: '', zip: '', phoneWork: '', phoneCell: '',
      assistantOrCC: '', bioWebsite: '', bioProgram: '', headshot: '',
      mediaWilling: false, costsCoveredByOrg: [], speakingFees: '',
      hasPresentedAtCCAWInPast2years: false, recentSpeakingExp: '',
      speakingReferences: '', adminNotes: '', responseForm: <any>{}, arrangements: <any>{}
    }
    return refSpeaker;
  }

  genRefResponse() {
    let refResponse: ResponseForm = {
      completed: false, ccawLodging: '', dateArrival: '', dateDeparture: '',
      ccawCoveringHotel: '', agreedHotel: '', secureOwnLodging: '',
      agreedTransport: '', agreedDates: '', whyConflict: '', mealDates: [],
      dietaryNeeds: [], otherDietary: '', bookAvailable: '', bookTitle: '',
      bookAuthor: '', w9: ''
    }
    return refResponse;
  }

  genRefArrangements() {
    let refArrangements: Arrangements = {
      associatedConf: '', travel: '', travelAmount: '', lodging: '',
      lodgingAmount: '', honorarium: '', lodgingConfirmNum: '',
      receivedFlightItin: '', arrivalAirport: '', arrivalDate: '',
      arrivalAirline: '', arrivalFlightNum: '', departAirport: '', 
      departDate: '', departAirline: '', departFlightNum: ''
    }
    return refArrangements;
  }

  exportSessions() {
    this.exportingService
        .exportSessions(this.sessionFields)
        .then((data: Blob) => {
          this.toast.success('Downloading session data');
          fileSaver.saveAs(data, 'sessions.csv');
        });
  }

  exportSpeakers() {
    let exports = this.exportResponse() ? 
                  _.concat(this.speakerFields, this.responseFields) : this.speakerFields;
    if (this.exportArrange) exports = _.concat(this.arrangeFields, exports);
    this.exportingService
        .exportSpeakers(exports)
        .then((data: Blob) => {
          this.toast.success('Downloading speaker data');
          fileSaver.saveAs(data, 'speakers.csv');
        });
  }

}
