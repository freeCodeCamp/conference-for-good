import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';

import { tags } from '../tags.data';
import { AdminService } from '../admin.service';
import { AuthService } from '../auth.service';
import { Conference, TimeSlot } from '../conference.model';
import { DatePipe } from '../date.pipe';
import { DateService } from '../date.service';
import { Speaker } from '../speaker.model';
import { SessionService } from '../session.service';
import { SpeakerService } from '../speaker.service';
import { TimePipe } from '../time.pipe';
import { TransitionService } from '../transition.service';
import { ToastComponent } from '../toast.component';
import { Session } from '../session.model';

@Component({
  selector: 'session',
  templateUrl: './session.component.html',
  styleUrls: ['./session.component.scss']
})
export class SessionComponent implements OnInit, OnDestroy {

  @ViewChild('toast') toast: ToastComponent;

  @ViewChild('dates') dates: ElementRef;
  datesSelect: HTMLSelectElement;

  @ViewChild('partSelect') partSelect: ElementRef;

  selectedDaySlots: BehaviorSubject<TimeSlot[]> = new BehaviorSubject([]);

  private paramsub: any;

  sessionSpeakers: BehaviorSubject<{mainPresenter: Speaker, coPresenters: Speaker[]}> = new BehaviorSubject(null);

  model: Session;

  tags = tags;
  
  presentationTypeLabel = `
    Please note that case studies MUST be presented by at least two parties involved in the case, one of which must be the investigator and/or prosecutor. Additional co-presenters are welcome.

    Examples of Acceptable Co-Presenters:
    - Prosecutor + investigator
    - Prosecutor + advocate
    - Prosecutor + survivor
    - Investigator + advocate
    - Investigator + survivor

    There are no restrictions on acceptable presenters for workshops.
  `;


  constructor(private transitionService: TransitionService,
              private sessionService: SessionService,
              private speakerService: SpeakerService,
              private route: ActivatedRoute,
              private authService: AuthService,
              private adminService: AdminService,
              private dateService: DateService) { }

  ngOnInit() {
    this.transitionService.transition();

    // Check for params
    this.paramsub = this.route.params.subscribe(params => {
      if (!params['id']) {
        // Initialize default values for fields that need it
        this.model = <Session>{
          approval: 'pending',
          type: 'casestudy',
          length: '90',
          tags: this.tags,
          level: 'beginner',
          willingToBeRecorded: 'audio',
          isMediaOrPressFriendly: 'yes',
          willingToRepeat: true
        }
      } else {
        this.model = this.sessionService.getSession(params['id']);
        this.sessionService.sessions.subscribe(sessions => {
          this.getSessionSpeakers();
        });
      }
      // If a speaker is submitting, set him as lead presenter
      if (params['leadPresId']) {
        if (this.model.speakers) this.model.speakers.mainPresenter = params['leadPresId'];
        else {
          this.model.speakers = {
            mainPresenter: params['leadPresId'],
            coPresenters: []
          }
        }
      }
    });
  }

  ngOnDestroy() {
    this.paramsub.unsubscribe();
  }
  
  mainPresenter() {
    return this.sessionSpeakers.getValue().mainPresenter;
  }

  getPart(occurrence) {
    if (this.model.length === '90') return '';
    else return `Part ${occurrence.part}: `
  }

  getDate(occurrence) {
    return this.adminService.findDateBySlot(occurrence.timeSlot);
  }

  slot(occurrence) {
    return this.adminService.findSlotById(occurrence.timeSlot);
  }

  capitalize(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  updateSelectedDate(selectedDate: string, slotId?: string) {
    let dbDate = this.dateService.formatDateForDatabase(selectedDate);
    let day = _.find(this.adminService.activeConference.getValue().days, day => day.date === dbDate);

    // Check if we have any timeslots yet
    if (!(typeof day === 'undefined') && !(typeof day.timeSlots === 'undefined')) {
      let slots = day.timeSlots;
      // Sort slots from earliest to latest by end time
      slots = _.sortBy(slots, slot => slot.end);
      this.selectedDaySlots.next(slots);
    } else {
      this.selectedDaySlots.next([]);
    }
  }

  changeTag(isChecked: boolean, tagChecked) {
    let tag = _.find(this.model.tags, tag => tag.name === tagChecked.name);
    tag.checked = isChecked;
  }

  saveToSlot(slotId: string, room: string) {
    let part = '0';
    if (this.model.length === '180') {
      part = this.partSelect.nativeElement.value;
    }
    let slot = this.adminService.findSlotById(slotId);
    this.sessionService.setSession(slot, room, this.model._id, part)
        .then((res: any) => {
          if (res.occupied) {
            this.toast.error('Time/room slot is occupied! Clear it first to add new session.')
          }
          else if (res.alreadyScheduled) {
            this.toast.error('This session is already scheduled in a room for this time slot.')
          }
          else this.toast.success('Session assigned to slot');
        });
  }

  clearSlot(occurrence) {
    let slot = this.adminService.findSlotById(occurrence.timeSlot);
    this.sessionService.clearSlot(slot, occurrence.room)
        .then(res => {
          if (res != 'No scheduled session') {
            this.toast.success('Removed session from slot');
          }
        });
  }

  assignSpeaker(speakerId: string, isLead: boolean) {
    this.sessionService.assignSpeaker(speakerId, isLead, this.model._id)
        .then(res => {
          if (!(res.message === 'duplicate')) {
            this.toast.success('Speaker assigned');
          }
        });
  }

  removeSpeaker(speakerId: string) {
    if (speakerId === 'main') speakerId = this.model.speakers.mainPresenter;
    this.sessionService.removeSpeaker(speakerId, this.model._id)
        .then(res => {
          this.toast.success('Speaker removed');
        });
  }

  getSessionSpeakers() {
    let mainPresenter = this.speakerService.getSpeaker(this.model.speakers.mainPresenter);
    let coPresenters = [];
    this.model.speakers.coPresenters.forEach(speaker => {
      coPresenters.push(this.speakerService.getSpeaker(speaker));
    });
    this.sessionSpeakers.next({
      mainPresenter: mainPresenter,
      coPresenters: coPresenters
    });
  }

  updateSession(form: NgForm) {
    if (!form.valid) return;
    this.sessionService
        .updateSession(this.model)
        .then(res => this.toast.success('Session updated!'));
  }

}