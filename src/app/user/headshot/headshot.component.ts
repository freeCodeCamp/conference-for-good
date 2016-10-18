import { Component, ViewChild, OnInit, NgZone } from '@angular/core';

import { environment } from '../../../environments/environment';
import { FileService } from '../../shared/file.service';
import { Speaker } from '../../shared/speaker.model';
import { SpeakerService } from '../../shared/speaker.service';
import { AuthService } from '../../shared/auth.service';
import { TransitionService } from '../../shared/transition.service';
import { ToastComponent } from '../../shared/toast.component';

@Component({
   selector: 'headshot',
   templateUrl: './headshot.component.html',
   styleUrls: ['./headshot.component.scss']
})

export class HeadshotComponent implements OnInit {

    baseUrl = environment.production ? '' : 'http://localhost:3000';

    @ViewChild('toast') toast: ToastComponent;

    speaker: Speaker;

    fileString = '';
    defaultFileString = 'Choose a file...';
    selectedFile: File;

    constructor(private transitionService: TransitionService,
                private authService: AuthService,
                private fileService: FileService,
                private speakerService: SpeakerService) {

        this.authService.user.subscribe(user => {
            this.speaker = this.speakerService.getSpeaker(user._id);
        });

    };

    ngOnInit() {
        this.fileString = this.defaultFileString;
        this.transitionService.transition();
    }

    fileSelected(files: FileList) {
        if (!files[0]) return;
        this.selectedFile = files[0];
        this.fileString = this.selectedFile.name;
    }

    validateFile(): string {
        let typeError = 'Please only upload .jpg and .png files.';
        let sizeError = 'Image too large, size limit is 10mb.';
        if (this.selectedFile.type !== 'image/jpeg' && this.selectedFile.type !== 'image/png') {
            return typeError;
        }
        if (this.selectedFile.size > 10000000) return sizeError;
        return '';
    }

    doUpload() {
        if (!this.selectedFile) {
            this.toast.error('Please select a file to upload.');
            return;
        }
        let invalid = this.validateFile();
        if (invalid) {
            this.toast.error(invalid);
            return;
        }
        this.transitionService.setLoading(true);
        let data = new FormData();
        data.append('file', this.selectedFile);
        this.fileService
            .uploadToServer(data)
            .then(res => {
                this.speakerService
                    .sendToDropbox(this.selectedFile.name, 'headshot')
                    .then(res => {
                        console.log('dbx res: ', res);
                        if (res.status ) {
                            this.toast.error('Headshot not uploaded successfully. Please try again!');
                        } else {
                            this.speaker.headshot = res;
                            this.speakerService
                                .updateSpeaker(this.speaker)
                                .then(res => {
                                    this.toast.success('Headshot uploaded successfully!');
                                    this.transitionService.setLoading(false);
                                });
                        }
                    });
            })
    }

}