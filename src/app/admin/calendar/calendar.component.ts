import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';

import { AdminService } from '../../shared/admin.service';
import { Conference, TimeSlot } from '../../shared/conference.model';
import { DatePipe } from '../../shared/date.pipe';
import { Session } from '../../shared/session.model';
import { SessionService } from '../../shared/session.service';
import { Speaker } from '../../shared/speaker.model';
import { SpeakerService, SpeakerList } from '../../shared/speaker.service';
import { TransitionService } from '../../shared/transition.service';
import { TimePipe } from '../../shared/time.pipe';
import { ToastComponent } from '../../shared/toast.component';

declare var $: any;

@Component({
  selector: 'calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit, AfterViewInit {

  @ViewChild('toast') toast: ToastComponent;
  @ViewChild('sessionPartSelect') sessionPart: ElementRef;
  @ViewChild('setSessionModal') setSessionModalRef: ElementRef;
  setSessionModal;

  activeConf: Conference;

  selectedSlot: TimeSlot;
  selectedRoom: string;
  twoParter = false;

  constructor(private transitionService: TransitionService,
              private adminService: AdminService,
              private sessionService: SessionService,
              private speakerService: SpeakerService,
              private router: Router) {
    this.adminService.activeConference.subscribe(activeConf => {
      this.activeConf = activeConf;
    });
  }

  ngOnInit() {
    this.transitionService.transition();
    this.activeConf = this.adminService.activeConference.getValue();
  }

  ngAfterViewInit() {
    // Use bootstrap's themed jQuery to avoid using alpha ang2 material
    this.setSessionModal = $(this.setSessionModalRef.nativeElement);
  }

  getSession(slot: TimeSlot, room: string) {
    // Why is slot is missing? Angular 2 change detection quirk?
    if (!slot) {
      return;
    }
    return this.sessionService.findSession(slot, room).session;
  }

  getSpeakers(slot: TimeSlot, room: string): SpeakerList {
    let session = this.getSession(slot, room);
    if (!session) return;
    return this.speakerService.getSpeakerList(session.speakers);
  }

  fullName(speaker: Speaker) {
    if (!speaker) return '';
    let fullName = `${speaker.nameFirst} ${speaker.nameLast}`; 
    if (fullName.length > 23) {
      return fullName.slice(0, 22) + '...';
    } else return fullName;
  }

  /** Get session title from slot and room
   * @returns If session is 2-parter, determine which part is scheduled
   */
  getSessionTitle(slot: TimeSlot, room: string): string {
    let sessionPart = this.sessionService.findSession(slot, room);
    let session = sessionPart.session;
    let part = sessionPart.part;
    if (!session) return '';

    if (session.length === '90') {
      if (session.title.length > 23) {
        return session.title.slice(0, 22) + '...';
      } else return session.title;
    }

    else if (session.length === '180') {
      let partStr = `(Part ${part})`;
      if (session.title.length + partStr.length > 23) {
        return session.title.slice(0, 14) + '...' + partStr;
      } else return session.title + partStr;
    }

  }

  getDaySlots(dayId) {
    let slots = _.find(this.activeConf.days, day => day._id === dayId).timeSlots;
    return slots;
  }

  isTwoParter(sessionId: string) {
    if (sessionId !== 'None') {
      let session = this.sessionService.getSession(sessionId);
      this.twoParter = session.length === '180';
    }
  }

  setSelectedSlot(slot: TimeSlot, room: string) {
    this.selectedSlot = slot;
    this.selectedRoom = room;
    this.setSessionModal.modal('show');
  }

  saveSlot(slot: TimeSlot, room: string, sessionId: string) {
    let part = '0';
    if (this.twoParter) part = this.sessionPart.nativeElement.value;
    
    if (sessionId === 'None') {
      this.sessionService.clearSlot(slot, room)
          .then(res => {
            if (res !== 'No scheduled session') {
              this.toast.success('Session removed');
            }
          });
      return;
    }
    this.sessionService.setSession(slot, room, sessionId, part)
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

  removeSession(slot: TimeSlot, room: string) {
    this.sessionService.clearSlot(slot, room)
        .then(res => {
          this.toast.success('Session removed');
        })
  }

  gotoSession(slot, room) {
    let session = this.getSession(slot, room);
    this.router.navigate(['/session', {id: session._id}]);
  }

  // DEBUG
  get diagnostic() { return JSON.stringify(this.selectedSlot); }

}