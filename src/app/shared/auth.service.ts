import { Injectable, EventEmitter } from '@angular/core';
import { Headers, Http, RequestOptions, Response } from '@angular/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import "rxjs/add/operator/toPromise";

import { environment } from '../../environments/environment';
import { Speaker } from './speaker.model';
import { handleError, parseJson, packageForPost } from './http-helpers';

@Injectable()
export class AuthService {
  
  baseUrl = environment.production ? '' : 'http://localhost:3000';

  //user: {speaker: Speaker};
  user: BehaviorSubject<Speaker> = new BehaviorSubject(null);

  constructor(private http: Http) { }

  checkSession() {
    return this.http
              .get(this.baseUrl + '/auth/checkSession')
              .toPromise()
              .then(parseJson)
              .then(res => {
                console.log('do we have user?', res);
                if (res.user) {
                  console.log('still logged in!');
                  this.user.next(res.user);
                }
                return res.user;
              })
              .catch(handleError);
  }

  logout() {
    return this.http
              .get(this.baseUrl + '/auth/logout')
              .toPromise()
              .then(res => {
                this.user.next(null);
                return res;
              })
              .catch(handleError);
  }

  login(formData) {
    let pkg = packageForPost(formData);
    return this.http
              .post(this.baseUrl + '/auth/login', pkg.body, pkg.opts)
              .toPromise()
              .then(parseJson)
              .then(user => {
                this.user.next(user);
                return user;
              });
  }

  signup(formData) {
    let pkg = packageForPost(formData);
    return this.http
              .post(this.baseUrl + '/auth/signup', pkg.body, pkg.opts)
              .toPromise()
              .then(parseJson);
  }

  signUpForCopres(leadPres: Speaker, signupData) {
    let data = {
      leadPres: leadPres,
      formData: signupData
    }
    let pkg = packageForPost(data);
    return this.http
              .post(this.baseUrl + '/auth/signup', pkg.body, pkg.opts)
              .toPromise()
              .then(parseJson);
  }

  forgotPassword(formData) {
      let data = { formData: formData };
      let pkg = packageForPost(data);
      return this.http
          .post(this.baseUrl + '/auth/forgotpassword', pkg.body, pkg.opts)
          .toPromise()
          .then(parseJson)
          .catch(handleError);
  }

  changePassword(formData) {
    let data = {
      formData: formData,
      userId: this.user.getValue()._id
    };
    let pkg = packageForPost(data);

    return this.http
              .post(this.baseUrl + '/auth/changePassword', pkg.body, pkg.opts)
              .toPromise()
              .then(parseJson)
              .catch(handleError);
  }

  addAdmin(speakerId) {
    return this.http
        .get(this.baseUrl + '/auth/addadmin/' + speakerId)
        .toPromise()
        .then(parseJson)
        .catch(handleError);
  }

  deleteAdmin(speakerId) {
    return this.http
        .get(this.baseUrl + '/auth/deleteadmin/' + speakerId)
        .toPromise()
        .then(parseJson)
        .catch(handleError);
  }

}