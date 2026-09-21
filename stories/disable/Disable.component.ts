import { Component } from '@angular/core';
import { sampleContent } from '../Settings';

@Component({
  selector: 'disabling',
  templateUrl: './Disabling.component.html',
})
export class DisablingComponent {
  public isDisabled = false;
  public initialValue = sampleContent;
  public toggleDisabled = () => (this.isDisabled = !this.isDisabled);
}
