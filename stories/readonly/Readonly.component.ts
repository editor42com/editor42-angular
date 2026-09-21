import { Component } from '@angular/core';
import { sampleContent } from '../Settings';

@Component({
  selector: 'readonly',
  templateUrl: './Readonly.component.html',
})
export class ReadonlyComponent {
  public isReadonly = false;
  public initialValue = sampleContent;
  public toggleReadonly = () => (this.isReadonly = !this.isReadonly);
}
