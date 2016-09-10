import { Component } from '@angular/core';

@Component({
  selector: 'toast',
  template: `
    <div class="toast-wrap">
      <div [style.background-color]="toastType" class="toast" *ngIf="toastText">{{ toastText }}</div>
    </div>
  `,
  styles: [`
    .toast {
      display: inline-block;
      position: fixed;
      top: 80px;
      right: 20px;
      color: white;
      font-style: sans-serif;
      font-size: 18px;
      padding: 18px;
      border-radius: 10px;
      transition: all 0.3s;
    }
  `]
})
export class ToastComponent {

  toastTypes = {
    default: 'hsla(0, 0%, 0%, 0.6)',
    error: 'hsla(3, 60%, 46%, 0.8)',
    success: 'hsla(120, 34%, 48%, 0.8)'
  }

  toastText: string = null;

  toastType: string;

  constructor() { }

  private showToast(text: string, type?: string) {
    this.toastType = type;
    let timeout = (text.length < 30) ? 2000 : 3000;
    this.toastText = text;
    window.setTimeout(() => this.toastText = null, timeout);
  }

  /** Show a notification message */
  message(text: string) {
    this.showToast(text, this.toastTypes.default);
  }

  /** Show an error message */
  error(text: string) {
    this.showToast(text, this.toastTypes.error);
  }

  /** Show an success message */
  success(text: string) {
    this.showToast(text, this.toastTypes.success);
  }

}