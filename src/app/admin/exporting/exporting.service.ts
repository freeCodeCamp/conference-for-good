import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import "rxjs/add/operator/toPromise";

import { environment } from '../../../environments/environment';
import { handleError, parseJson, packageForPost } from '../../shared/http-helpers';

@Injectable()
export class ExportingService {

  baseUrl = environment.production ? '' : 'http://localhost:3000';

  constructor(private http: Http) { }

  exportSessions(sessionFields) {
    let pkg = packageForPost(sessionFields);
    return this.http
              .post(this.baseUrl + '/api/exportsessions', pkg.body, pkg.opts)
              .toPromise()
              .then(parseJson)
              .catch(handleError);
  }
}