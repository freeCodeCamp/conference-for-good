import { Routes, RouterModule } from '@angular/router';

/** Route authorization guards */
import { AdminGuard } from './shared/admin-guard.service';
import { SpeakerGuard } from './shared/speaker-guard.service';

/** Routes */
import { HomeComponent } from './admin/home/home.component';
import { CalendarComponent } from './admin/calendar/calendar.component';
import { CreateConfComponent } from './admin/create-conf/create-conf.component';
import { DashboardComponent } from './user/dashboard/dashboard.component';
import { ModifyConfComponent } from './admin/modify-conf/modify-conf.component';
import { SelectActiveComponent } from './admin/select-active/select-active.component';
import { SessionComponent } from './shared/session/session.component';
import { SessionListComponent } from './admin/session-list/session-list.component';
import { SpeakerComponent } from './shared/speaker/speaker.component';
import { SpeakerListComponent } from './admin/speaker-list/speaker-list.component';
import { LoginComponent } from './auth/login/login.component';
import { SignupComponent } from './auth/signup/signup.component';
import { SettingsComponent } from './auth/settings/settings.component';
import { LandingComponent } from './auth/landing/landing.component';
import { AdministrationComponent } from './admin/administration/administration.component';
import { ForgotPasswordComponent } from './auth/forgotpassword/forgotpassword.component';

const appRoutes: Routes = [
  { path: '',                 component: LandingComponent },
  { path: 'home',             component: HomeComponent, canActivate: [AdminGuard] },
  { path: 'calendar',         component: CalendarComponent, canActivate: [AdminGuard] },
  { path: 'create-conf',      component: CreateConfComponent, canActivate: [AdminGuard] },
  { path: 'dashboard',        component: DashboardComponent, canActivate: [SpeakerGuard] },
  { path: 'modify-conf',      component: ModifyConfComponent, canActivate: [AdminGuard] },
  { path: 'select-active',    component: SelectActiveComponent, canActivate: [AdminGuard] },
  { path: 'session',          component: SessionComponent, canActivate: [SpeakerGuard] },
  { path: 'session-list',     component: SessionListComponent, canActivate: [AdminGuard] },
  { path: 'speaker',          component: SpeakerComponent, canActivate: [SpeakerGuard] },
  { path: 'speaker-list',     component: SpeakerListComponent, canActivate: [AdminGuard] },
  { path: 'login',            component: LoginComponent },
  { path: 'signup',           component: SignupComponent },
  { path: 'settings',         component: SettingsComponent, canActivate: [SpeakerGuard] },
  { path: 'administration',   component: AdministrationComponent, canActivate: [AdminGuard] },
  { path: 'forgotpassword',   component: ForgotPasswordComponent }
];

export const appRoutingProviders: any[] = [

];

export const routing = RouterModule.forRoot(appRoutes);