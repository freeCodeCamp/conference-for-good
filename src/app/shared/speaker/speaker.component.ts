import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import * as moment from 'moment';
let fileSaver = require('file-saver');

import { AdminService } from '../admin.service';
import { AuthService } from '../auth.service';
import { DatePipe } from '../date.pipe';
import { FileService } from '../file.service';
import { SpeakerService } from '../speaker.service';
import { TransitionService } from '../transition.service';
import { ToastComponent } from '../toast.component';
import { Session } from '../session.model';
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
  speakerSessions: Session[] = [];
  leadPresId: string = null;
  
  defaultFileString = 'Choose a file...';
  adminUploadString = '';
  selectedAdminFile: File;

  incompleteFields: string[] = [];

  viewArrangeIndex: number;

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
              private adminService: AdminService,
              private authService: AuthService,
              private fileService: FileService,
              private speakerService: SpeakerService,
              private route: ActivatedRoute,
              private router: Router) { }

  ngOnInit() {

    this.transitionService.transition();
    this.adminUploadString = this.defaultFileString;

    // Check for params
    this.paramsub = this.route.params.subscribe(params => {
      // Initialize fields for brand new speakers
      if (!params['id']) {
        this.model = <Speaker>{
          costsCoveredByOrg: this.costsCovered
        };
        this.model.address2 = '';
        this.model.assistantOrCC = '';
      } else {
        this.model = this.speakerService.getSpeaker(params['id']);
        if (this.model.sessions.length > 0) {
          this.speakerSessions = this.speakerService.getSpeakerSessions(this.model.sessions);
        }
      }
      if (params['leadPresId']) {
        this.leadPresId = params['leadPresId'];
      }
      if (params['msg']) {
        this.toast.success(params['msg']);
      }
      if (this.authService.user.getValue().admin) {
        // To enable historic viewing, display data based on viewing conf (not default)
        let viewingConf = this.adminService.activeConference.getValue().title;
        if (this.model.arrangements && this.model.arrangements.length > 0) {
          this.viewArrangeIndex = _.findIndex(this.model.arrangements,
                                              arrange => arrange.associatedConf === viewingConf);
          if (this.viewArrangeIndex < 0) {
            this.model.arrangements.push(<any>{associatedConf: viewingConf});
            this.viewArrangeIndex = this.model.arrangements.length - 1;
          }
        } else {
          if (!this.model.arrangements) {
            this.model.arrangements = [];
          }
          this.model.arrangements.push(<any>{associatedConf: viewingConf});
          this.viewArrangeIndex = 0;
        }
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

  checkRecentExp() {
    return typeof this.model.hasPresentedAtCCAWInPast2years === 'boolean' && !this.model.hasPresentedAtCCAWInPast2years;
  }

  getNights(dateArrival: string, dateDeparture: string): number {
    let arrivalMom = moment(dateArrival);
    let departureMom = moment(dateDeparture);
    return departureMom.diff(arrivalMom, 'days');
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
                  this.router.navigate(['/dashboard', { msg: 'Copresenter account created and emailed!' }]);
                });
                // .then(res => {
                //   this.toast.success('Copresenter account created and emailed!')
                // });
          });
    } else {
      this.speakerService
      // Must user model here rather than form, not all fields are
      // 2-way data bound and are only updated via model (costsCovered)
          .updateSpeaker(this.model)
          .then(res => {
            // Only navigate for speakers, admins have too many partial fields bound to this function
            if (!this.authService.user.getValue().admin) {
              this.router.navigate(['/dashboard', { msg: 'Profile form saved!' }]);
            } else {
              this.toast.success('Speaker updated!');
            }
          });
    }
  }

  checkProfile(form: any) {
    let flag = true;

    let expReq = !form['hasPresentedAtCCAWInPast2years'];

    let refSpeaker = this.genRefSpeaker();

    for (let field in refSpeaker) {
      if (form.hasOwnProperty(field)) {
        if (!expReq) {
          // Experience fields not required if has presented at ccaw
          if (field !== 'recentSpeakingExp' && field !== 'speakingReferences') {
                if (typeof form[field] !== undefined) {
                  // If type is boolean, form item is completed
                  if (typeof form[field] !== 'boolean') {
                    if (!form[field]) {
                      flag = false;
                    }
                  }
                } else {
                  flag = false;
                }
          }
        } else {
          if (typeof form[field] !== undefined) {
            // If type is boolean, form item is completed
            if (typeof form[field] !== 'boolean') {
              if (!form[field]) {
                flag = false;
              }
            }
          } else {
            flag = false;
          }
        }
      }
    }

    return flag;
  }

  genRefSpeaker() {
    let refSpeaker = {
      salutation: '', nameFirst: '', nameLast: '', email: '',
      title: '', organization: '', address1: '',
      city: '', state: '', zip: '', phoneWork: '', phoneCell: '',
      bioWebsite: '', bioProgram: '', headshot: '',
      mediaWilling: false, speakingFees: '',
      hasPresentedAtCCAWInPast2years: false, recentSpeakingExp: '',
      speakingReferences: ''
    };
    return refSpeaker;
  }

<<<<<<< HEAD
    fileSelected(files: FileList, whichFile: string) {
        if (!files[0]) return;
        this.selectedAdminFile = files[0];
        this.adminUploadString = this.selectedAdminFile.name;
    }

    upload(uploadTitle: string) {
      if (!this.selectedAdminFile) return;
      if (!uploadTitle) {
        this.toast.error('Please enter a title for this upload.');
        return;
      }
      let ext = this.selectedAdminFile.name.split('.').pop();
      let userFilename = `${this.model.nameLast}_${this.model.email}_${uploadTitle}.${ext}`;
      this.transitionService.setLoading(true);
      let data = new FormData();
      data.append('userFilename', userFilename);
      data.append('file', this.selectedAdminFile);
      this.fileService
          .uploadToServer(data)
          .then(res => {
            this.speakerService
                .sendToDropbox(userFilename, 'adminUploads')
                .then(dbxRes => {
                  if (dbxRes.status) {
                    this.toast.error('Upload unsuccessful. Please try again!');
                  } else {
                    if (!this.model.adminUploads) this.model.adminUploads = [];
                    let upload = {
                      title: uploadTitle,
                      url: dbxRes
                  };
                    this.model.adminUploads.push(upload);
                    this.speakerService
                        .updateSpeaker(this.model)
                        .then(res => {
                          this.toast.success('Upload successful!');
                          this.transitionService.setLoading(false);
                        });
                  }
                });
          });
    }
}
||||||| merged common ancestors
}
=======
}
>>>>>>> master
