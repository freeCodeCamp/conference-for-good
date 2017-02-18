import { Component, ViewChild, OnInit, NgZone } from '@angular/core';

import { environment } from '../../../environments/environment';
import { AdminService } from '../../shared/admin.service';
import { FileService } from '../../shared/file.service';
import { Session } from '../../shared/session.model';
import { SessionService } from '../../shared/session.service';
import { Speaker } from '../../shared/speaker.model';
import { SpeakerService } from '../../shared/speaker.service';
import { AuthService } from '../../shared/auth.service';
import { TransitionService } from '../../shared/transition.service';
import { ToastComponent } from '../../shared/toast.component';
import * as _ from 'lodash';

@Component({
   selector: 'uploads',
   templateUrl: './uploads.component.html',
   styleUrls: ['./uploads.component.scss']
})

export class UploadsComponent implements OnInit {

    baseUrl = environment.production ? '' : 'http://localhost:3000';

    @ViewChild('toast') toast: ToastComponent;

    speaker: Speaker;
    speakerSessions: Session[] = [];
    
    defaultFileString = 'Choose a file...';

    headshotFileString = '';
    selectedHeadshotFile: File;

    w9FileString = '';
    selectedW9File: File;

    handoutsFileString = '';
    selectedHandoutsFile: File;

    uploadAllFileString = '';
    selectedUploadAllFile: File;

    constructor(private transitionService: TransitionService,
                private adminService: AdminService,
                private authService: AuthService,
                private fileService: FileService,
                private sessionService: SessionService,
                private speakerService: SpeakerService) {

        this.authService.user.subscribe(user => {
            this.speaker = this.speakerService.getSpeaker(user._id);
        });

    };

    ngOnInit() {
        this.headshotFileString = this.defaultFileString;
        this.w9FileString = this.defaultFileString;
        this.handoutsFileString = this.defaultFileString;
        this.uploadAllFileString = this.defaultFileString;
        this.transitionService.transition();

        this.sessionService.sessionsUnfiltered.subscribe(sessions => {
            this.speakerSessions = this.sessionService.getSpeakerSessions(this.speaker._id);
        });
    }

    fileSelected(files: FileList, whichFile: string) {
        if (!files[0]) return;
        switch (whichFile) {
            case 'headshot':
                this.selectedHeadshotFile = files[0];
                this.headshotFileString = this.selectedHeadshotFile.name;
                break;
            case 'w9':
                this.selectedW9File = files[0];
                this.w9FileString = this.selectedW9File.name;
                break;
            case 'handouts':
                this.selectedHandoutsFile = files[0];
                this.handoutsFileString = this.selectedHandoutsFile.name;
                break;
            case 'all':
                this.selectedUploadAllFile = files[0];
                this.uploadAllFileString = this.selectedUploadAllFile.name;
                break;
            default:
                break;
        }
    }

    validateFile(selectedFile: File, type: string): string {
        let typeError = 'Please only upload image files.';
        let sizeError = 'Image too large, size limit is 10mb.';
        if (type === 'headshot') {
            if (selectedFile.type.substring(0, 5) !== 'image') {
                return typeError;
            }
        } /*else if (type === 'w9' || type === 'handouts') {
            // Too many valid file types to check for...Care on Brooke's part req'd
            if (selectedFile.type.substring(0, 5) !== 'image' && 
                selectedFile.type.substring(0, 4) !== 'text' &&
                selectedFile.type !== 'application/pdf') {
                return typeError;
            }
        }*/
        if (selectedFile.size > 10000000) return sizeError;
        return '';
    }

    upload(directory: string) {
        let selectedFile: File;
        switch (directory) {
            case 'headshot':
                selectedFile = this.selectedHeadshotFile;
                break;
            case 'w9':
                selectedFile = this.selectedW9File;
                break;
            default:
                break;
        }
        if (!selectedFile) {
            this.toast.error('Please select a file to upload.');
            return;
        }
        let invalid = this.validateFile(selectedFile, directory);
        if (invalid) {
            this.toast.error(invalid);
            return;
        }
        let ext = selectedFile.name.split('.').pop();
        let userFilename = `${this.speaker.nameLast}_${this.speaker.email}_${directory}.${ext}`;
        this.transitionService.setLoading(true);
        let data = new FormData();
        data.append('userFilename', userFilename);
        data.append('file', selectedFile);
        let speakerName = this.speaker.nameFirst + ' ' + this.speaker.nameLast;
        this.fileService
            .uploadToServer(data)
            .then(res => {
                this.speakerService
                    .sendToDropbox(userFilename, directory, speakerName)
                    .then(dbxRes => {
                        if (dbxRes.status ) {
                            this.toast.error('Uploaded unsuccessful. Please try again!');
                        } else {
                            if (directory === 'headshot') this.speaker.headshot = dbxRes;
                            else if (directory === 'w9') {
                                if (!this.speaker.responseForm) this.speaker.responseForm = <any>{};
                                this.speaker.responseForm.w9 = dbxRes;
                            }
                            this.speakerService
                                .updateSpeaker(this.speaker)
                                .then(res => {
                                    this.toast.success('Upload success!');
                                    this.transitionService.setLoading(false);
                                });
                        }
                    });
            });
    }

    uploadHandout(sessionId: string) {
        if (!this.selectedHandoutsFile) return;
        if (!sessionId) {
            this.toast.error('Please select the session this handout is for.')
            return;
        }
        let invalid = this.validateFile(this.selectedHandoutsFile, 'handout');
        if (invalid) {
            this.toast.error(invalid);
            return;
        }
        let selectedSession = _.find(this.speakerSessions, sess => sess._id === sessionId);
        let handoutNumber = selectedSession.handouts.length + 1;

        let ext = this.selectedHandoutsFile.name.split('.').pop();
        let userFilename = `${selectedSession.title.substring(0, 15)}_${this.speaker.email}_${handoutNumber}.${ext}`;
        this.transitionService.setLoading(true);
        let data = new FormData();
        data.append('userFilename', userFilename);
        data.append('file', this.selectedHandoutsFile);
        let speakerName = this.speaker.nameFirst + ' ' + this.speaker.nameLast;
        this.fileService
            .uploadToServer(data)
            .then(res => {
                this.speakerService
                    .sendToDropbox(userFilename, 'handouts', speakerName)
                    .then(dbxRes => {
                        if (dbxRes.status ) {
                            this.toast.error('Upload unsuccessful. Please try again!');
                        } else {
                            if (!selectedSession.handouts) selectedSession.handouts = [];
                            selectedSession.handouts.push(dbxRes);
                            this.sessionService
                                .updateSession(selectedSession, 'handout')
                                .then(res => {
                                    this.toast.success('Upload success!');
                                    this.transitionService.setLoading(false);
                                });
                        }
                    });
            });
    }

    uploadToAll(uploadTitle: string) {
        if (!this.selectedUploadAllFile) return;
        let defaultConf = this.adminService.defaultConference.getValue();

        let ext = this.selectedUploadAllFile.name.split('.').pop();
        let userFilename = `${uploadTitle}.${ext}`;
        this.transitionService.setLoading(true);
        let data = new FormData();
        data.append('userFilename', userFilename);
        data.append('file', this.selectedUploadAllFile);
        let speakerName = this.speaker.nameFirst + ' ' + this.speaker.nameLast;
        this.fileService
            .uploadToServer(data)
            .then(res => {
                this.speakerService
                    .sendToDropbox(userFilename, 'all', speakerName)
                    .then(dbxRes => {
                        if (dbxRes.status ) {
                            this.toast.error('Upload unsuccessful. Please try again!');
                        } else {
                            if (!defaultConf.uploads) defaultConf.uploads = [];
                            let upload = {
                                title: uploadTitle,
                                url: dbxRes
                            };
                            defaultConf.uploads.push(upload);
                            this.adminService
                                .addConfUpload(defaultConf)
                                .then(res => {
                                    this.toast.success('Upload Success!');
                                    this.transitionService.setLoading(false);
                                })
                                .catch(err => {
                                    this.toast.error(err.message);
                                });
                        }
                    });
            });
    }

    deleteUpload(upload: {title: string; url: string;}) {
        this.adminService
            .deleteUpload(upload)
            .then(res => {
                this.toast.success('Removed upload. You still need to delete it from dropbox.')
            });
    }

}