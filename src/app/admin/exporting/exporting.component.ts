import { Component, OnInit, ViewChild } from '@angular/core';

import { Session } from '../../shared/session.model';
import { SessionService } from '../../shared/session.service';
import { TransitionService } from '../../shared/transition.service';
import { ToastComponent } from '../../shared/toast.component';

@Component({
  selector: 'app-exporting',
  templateUrl: './exporting.component.html',
  styleUrls: ['./exporting.component.scss']
})
export class ExportingComponent implements OnInit {

  @ViewChild('toast') toast: ToastComponent;

  sessionFields: {name: string; checked: boolean}[] = [];

  constructor(private transitionService: TransitionService,
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
    console.log(this.sessionFields);
  }

}
