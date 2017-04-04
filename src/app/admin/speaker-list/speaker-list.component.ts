import { Component, ViewChild, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { FileService } from '../../shared/file.service';
import { SpeakerService } from '../../shared/speaker.service';
import { SessionService } from '../../shared/session.service';
import { Speaker } from '../../shared/speaker.model';
import { TransitionService } from '../../shared/transition.service';
import { ToastComponent } from '../../shared/toast.component';

@Component({
  selector: 'speaker-list',
  templateUrl: './speaker-list.component.html',
  styleUrls: ['./speaker-list.component.scss']
})
export class SpeakerListComponent implements OnInit {
  @ViewChild('toast') toast: ToastComponent;
  defaultFileString = 'Choose a file...';
  csvFileString = '';
  selectedCsvFile: File;
  defaultFilter = 'active';
  currentFilter: string;
  displaySpeakers: BehaviorSubject<Speaker[]> = new BehaviorSubject([]);

  constructor(private transitionService: TransitionService,
              private speakerService: SpeakerService,
              private sessionService: SessionService,
              private fileService: FileService,
              private router: Router) { }

  ngOnInit() {
    this.transitionService.transition();
    this.currentFilter = this.defaultFilter;
    this.setFilter(this.currentFilter);
    this.csvFileString = this.defaultFileString;
  }

  fileSelected(files: FileList, whichFile: string) {
      if (!files[0]) return;
      switch (whichFile) {
          case 'csv':
              this.selectedCsvFile = files[0];
              this.csvFileString = this.selectedCsvFile.name;
              break;
          default:
              break;
      }
  }

  setFilter(filter: string) {
    filter = filter.toLowerCase();
    this.currentFilter = filter;
    switch (filter) {
      case 'all':
        this.displaySpeakers.next(this.speakerService.speakers.getValue());
        break;
      case 'unarchived':
        this.displaySpeakers.next(this.speakerService.unArchivedSpeakers.getValue());
        break;
      case 'unarchived complete':
        this.displaySpeakers.next(this.speakerService.profileCompleted.getValue());
        break;
      case 'unarchived incomplete':
        this.displaySpeakers.next(this.speakerService.profileNotDone.getValue());
        break;
      case 'active':
        this.displaySpeakers.next(this.speakerService.speakersActive.getValue());
        break;
      case 'active complete':
        this.displaySpeakers.next(this.speakerService.activeProfileCompleted.getValue());
        break;
      case 'active incomplete':
        this.displaySpeakers.next(this.speakerService.activeProfileNotDone.getValue());
        break;
      case 'archived':
        this.displaySpeakers.next(this.speakerService.archivedSpeakers.getValue());
        break;
      default:
        break;
    }
  }

  gotoSpeaker(speakerId: string) {
    this.router.navigate(['/speaker', {id: speakerId}]);
  }

  deleteSpeaker(speakerId: string) {
    var confirmation = confirm('Are you sure you want to delete this session?');
    if (confirmation) {
      this.speakerService
        .deleteSpeaker(speakerId)
        .then(res => {
          this.speakerService
            .getAllSpeakers().then(() => {
              this.sessionService.getAllSessions().then(() => {
                this.router.navigate(['/home', { msg: 'Speaker has been deleted.' }]);
              });
            });
        });
    }
  }

  upload(directory: string) {
      let selectedFile: File;
      switch (directory) {
          case 'csv':
              selectedFile = this.selectedCsvFile;
              break;
          default:
              break;
      }
      if (!selectedFile) {
          //this.toast.error('Please select a file to upload.');
          alert("select file to upload");
          return;
      }
      /*let invalid = this.validateFile(selectedFile, directory);
      if (invalid) {
          console.log("invalid file zzzzzzzzzzzzzzzzzzzzzzzz");
          //this.toast.error(invalid);
          return;
      }*/
      let ext = selectedFile.name.split('.').pop();
      //let userFilename = `${this.speaker.nameLast}_${this.speaker.email}_${directory}.${ext}`;
      this.transitionService.setLoading(true);
      let data = new FormData();
      data.append('userFilename', "Speakers_csv");
      data.append('file', selectedFile);
      this.fileService
          .uploadCsv(data)
          .then(res => {
              console.log("Response back from server ZZZZZZZZZZZZZZZZZZZ");
              this.toast.success('File uploaded and speakers information updated.');
              this.transitionService.setLoading(false);
          });
  }
}
