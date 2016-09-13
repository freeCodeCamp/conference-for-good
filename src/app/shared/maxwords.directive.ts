import { Directive, OnChanges, Input, SimpleChanges, forwardRef } from '@angular/core';
import { NG_VALIDATORS, Validator, Validators, AbstractControl } from '@angular/forms';

/** A field's length can't exceed the given word count */
function maxWordsValidator(maxWords: number) {
  return (control: AbstractControl): {[key: string]: any} => {
    const words: string = control.value;
    if (!words) return null;
    const exceeds = words.split(' ').length > maxWords;
    return exceeds ? {'maxWords': {name}} : null;
  };
}

@Directive({
  selector: '[maxWords]',
  providers: [
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => MaxWordsValidatorDirective), multi: true }
  ]
})
export class MaxWordsValidatorDirective implements Validator, OnChanges {
  @Input() maxWords: number;
  private valFn = Validators.nullValidator;

  ngOnChanges(changes: SimpleChanges): void {
    const change = changes['maxWords'];
    if (change) {
      const val: number = change.currentValue;
      this.valFn = maxWordsValidator(val);
    } else {
      this.valFn = Validators.nullValidator;
    }
  }

  validate(control: AbstractControl): {[key: string]: any} {
    return this.valFn(control);
  }
}

