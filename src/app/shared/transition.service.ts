import { Injectable } from '@angular/core';

@Injectable()
export class TransitionService {
  private transitioning = false;
  private loading = false;

  constructor() { }

  isTransitioning(): boolean {
    return this.transitioning;
  }

  transition() {
    if (this.transitioning) {
      this.transitioning = false;
    }
    this.transitioning = true;
    window.scrollTo(0, 0);
    setTimeout(() => this.transitioning = false, 600);
  }

  setLoading(isLoading: boolean) {
    this.loading = isLoading;
  }

  isLoading() {
    return this.loading;
  }

}
