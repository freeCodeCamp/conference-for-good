import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import "rxjs/add/operator/toPromise";

import { environment } from '../../../environments/environment';
import { handleError, parseJson, packageForPost } from '../../shared/http-helpers';
import { AdminService } from '../../shared/admin.service';

@Injectable()
export class ExportingService {

  baseUrl = environment.production ? '' : 'http://localhost:3000';

  constructor(private http: Http,
              private adminService: AdminService) { }

  exportSessions(sessionFields) {
    let pkg = packageForPost(sessionFields);
    return this.http
              .post(this.baseUrl + '/api/exportsessions', pkg.body, pkg.opts)
              .toPromise()
              .then((res: any) => {
                let blob = new Blob([res._body], {type: "text/csv;charset=utf8;"});
                return blob;
              })
              .catch(handleError);
  }

  exportSpeakers(speakerFields) {
    let currConf = this.adminService.defaultConference.getValue().title;
    let pkg = packageForPost({fields: speakerFields, conf: currConf});
    return this.http
              .post(this.baseUrl + '/api/exportspeakers', pkg.body, pkg.opts)
              .toPromise()
              .then((res: any) => {
                let blob = new Blob([res._body], {type: "text/csv;charset=utf8;"});
                return blob;
              })
              .catch(handleError);
  }
}