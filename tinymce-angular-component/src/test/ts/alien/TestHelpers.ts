import { Global, Arr, Strings } from '@ephox/katamari';
import { Observable, throwError, timeout } from 'rxjs';
import { ScriptLoader } from '../../../main/ts/utils/ScriptLoader';
import { Attribute, Remove, SelectorFilter, SugarElement } from '@ephox/sugar';
import { ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { EditorComponent } from '../../../main/ts/editor/editor.component';
import type { Editor } from 'editor42';
import { Keyboard, Keys } from '@ephox/agar';

export const throwTimeout =
  (timeoutMs: number, message: string = `Timeout ${timeoutMs}ms`) =>
    <T>(source: Observable<T>) =>
      source.pipe(
        timeout({
          first: timeoutMs,
          with: () => throwError(() => new Error(message)),
        })
      );

export const deleteTinymce = () => {
  ScriptLoader.reinitialize();

  delete Global.tinymce;
  delete Global.tinyMCE;

  const hasTinyUri = (attrName: string) => (elm: SugarElement<Element>) =>
    Attribute.getOpt(elm, attrName).exists((src) => Strings.contains(src, 'tinymce'));

  const elements = Arr.flatten([
    Arr.filter(SelectorFilter.all('script'), hasTinyUri('src')),
    Arr.filter(SelectorFilter.all('link'), hasTinyUri('href')),
  ]);

  Arr.each(elements, Remove.remove);
};

export const EDITOR42_LOCAL = '/project/node_modules/editor42/editor42.min.js';

// Drop editor42 (and the shim aliases it may have installed) so a following context can
// load the engine it actually asked for.
export const cleanupGlobalEditor42 = () => {
  const g = Global as any;
  if (g.tinymce !== undefined && g.tinymce === g.editor42) {
    delete g.tinymce;
  }
  if (g.tinyMCE !== undefined && g.tinyMCE === g.editor42) {
    delete g.tinyMCE;
  }
  delete g.editor42;
  delete g.EDITOR42_NO_SHIM;
  const hasEditor42Uri = (attrName: string) => (elm: SugarElement<Element>) =>
    Attribute.getOpt(elm, attrName).exists((src) => Strings.contains(src, 'editor42'));
  Arr.each(Arr.filter(SelectorFilter.all('script'), hasEditor42Uri('src')), Remove.remove);
};

// Full engine sweep so every test file is self-cleaning whatever order files run in.
export const cleanAllEngines = () => {
  cleanupGlobalEditor42();
  deleteTinymce();
};

export const pLoadEditor42 = (options: { noShim?: boolean } = {}): Promise<void> => {
  cleanupGlobalEditor42();
  if (options.noShim) {
    (Global as any).EDITOR42_NO_SHIM = true;
  }
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = EDITOR42_LOCAL;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('failed to load ' + EDITOR42_LOCAL));
    document.head.appendChild(script);
  });
};

export const captureLogs = async (
  method: 'log' | 'warn' | 'debug' | 'error',
  fn: () => Promise<void> | void
): Promise<unknown[][]> => {
  const original = console[method];
  try {
    const logs: unknown[][] = [];
    console[method] = (...args: unknown[]) => logs.push(args);
    await fn();
    return logs;
  } finally {
    console[method] = original;
  }
};

export const fakeTypeInEditor = (fixture: ComponentFixture<unknown>, str: string) => {
  const editor: Editor = fixture.debugElement.query(By.directive(EditorComponent)).componentInstance.editor!;
  editor.getBody().innerHTML = '<p>' + str + '</p>';
  Keyboard.keystroke(Keys.space(), {}, SugarElement.fromDom(editor.getBody()));
  fixture.detectChanges();
};
