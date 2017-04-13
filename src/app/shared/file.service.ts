import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/toPromise';

import { environment } from '../../environments/environment';
import { handleError, parseJson } from './http-helpers';

@Injectable()
export class FileService {

  baseUrl = environment.production ? '' : 'http://localhost:3000';

  constructor(private http: Http) { }

  uploadToServer(file: FormData) {
    return this.http
              .post(this.baseUrl + '/api/uploadFile', file)
              .toPromise()
              .then(parseJson)
              .catch(handleError);
  }

  uploadCsv(file: FormData, parameter) {q
    return this.http
              .post(this.baseUrl + '/api/' + parameter, file)
              .toPromise()
              .then(parseJson)
              .catch(handleError);
  }
}
