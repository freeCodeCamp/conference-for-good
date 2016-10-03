import { Component, OnInit, ViewChild } from '@angular/core';
let fileSaver = require('file-saver');

import { ExportingService } from './exporting.service';
import { Session } from '../../shared/session.model';
import { SessionService } from '../../shared/session.service';
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

  constructor(private transitionService: TransitionService,
              private exportingService: ExportingService,
              private sessionService: SessionService) { }

  ngOnInit() {
    this.transitionService.transition();
    this.getFields();
  }

  getFields() {
    let refSess = this.sessionService.sessionsActive.getValue()[0];
    for (let field in refSess) {
      if (refSess.hasOwnProperty(field)) {
        if (field !== '_id' && field !== '__v') {
          this.sessionFields.push({name: field, checked: false});
        }
      }
    }
  }

  export() {
    this.exportingService
        .exportSessions(this.sessionFields)
        .then((data: Blob) => {
          fileSaver.saveAs(data, 'sessions.csv');
          this.toast.success('exported');
        });
  }

}
