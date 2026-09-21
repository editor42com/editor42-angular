import '../alien/InitTestEnvironment';

import { Assertions } from '@ephox/agar';
import { after, beforeEach, describe, it } from '@ephox/bedrock-client';
import { Global } from '@ephox/katamari';
import { VersionLoader } from '@tinymce/miniature';

import { EditorComponent } from '../../../main/ts/public_api';
import { getEditor42 } from '../../../main/ts/Editor42';
import { editorHook } from '../alien/TestHooks';
import { cleanAllEngines, pLoadEditor42 } from '../alien/TestHelpers';

// The four page states of the dual-engine contract, plus the shim-off run.
describe('DualEngineTest', () => {
  const createFixture = editorHook(EditorComponent);

  beforeEach(() => {
    cleanAllEngines();
  });

  after(() => {
    cleanAllEngines();
  });

  it('editor42 only: the wrapper drives editor42', async () => {
    await pLoadEditor42();
    const { editor } = await createFixture();
    Assertions.assertEq('majorVersion is the TinyMCE 6 api level', '6', Global.editor42.majorVersion);
    Assertions.assertEq('minorVersion is 42-family', true, Global.editor42.minorVersion.startsWith('42.'));
    Assertions.assertEq('editor belongs to editor42', true, editor.editorManager === Global.editor42);
  });

  it('editor42 with the shim disabled still works', async () => {
    await pLoadEditor42({ noShim: true });
    Assertions.assertEq('no tinymce alias with EDITOR42_NO_SHIM', undefined, Global.tinymce);
    const { editor } = await createFixture();
    Assertions.assertEq('editor belongs to editor42', true, editor.editorManager === Global.editor42);
  });

  it('real tinymce only: the wrapper falls back', async () => {
    await VersionLoader.pLoadVersion('6');
    const { editor } = await createFixture();
    Assertions.assertEq('no editor42 global', undefined, Global.editor42);
    Assertions.assertEq('editor belongs to tinymce', true, editor.editorManager === Global.tinymce);
  });

  it('both engines loaded: editor42 wins and tinymce is not clobbered', async () => {
    await VersionLoader.pLoadVersion('6');
    await pLoadEditor42();
    Assertions.assertEq('tinymce majorVersion is 6', '6', Global.tinymce.majorVersion);
    Assertions.assertEq('tinymce is the real one, not the editor42 shim', false, Global.tinymce.minorVersion.startsWith('42.'));
    const { editor } = await createFixture();
    Assertions.assertEq('editor belongs to editor42', true, editor.editorManager === Global.editor42);
  });

  it('neither engine: the resolver returns null', () => {
    Assertions.assertEq('resolver returns null', null, getEditor42());
  });
});
