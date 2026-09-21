import '../alien/InitTestEnvironment';

import { Assertions, Waiter } from '@ephox/agar';
import { describe, it, context, before, after, beforeEach } from '@ephox/bedrock-client';
import { Arr, Global, Strings } from '@ephox/katamari';
import { TestBed } from '@angular/core/testing';

import { EditorComponent, EDITOR42_SCRIPT_SRC, TINYMCE_SCRIPT_SRC } from '../../../main/ts/public_api';
import { Version } from '../../../main/ts/editor/editor.component';
import { editorHook, tinymceVersionHook } from '../alien/TestHooks';
import type { Editor } from 'editor42';
import { cleanAllEngines, EDITOR42_LOCAL } from '../alien/TestHelpers';

describe('LoadTinyTest', () => {
  const assertTinymceVersion = (version: Version, editor: Editor) => {
    Assertions.assertEq(`Loaded version of TinyMCE should be ${version}`, version, editor.editorManager.majorVersion);
    Assertions.assertEq(`Loaded version of TinyMCE should be ${version}`, version, Global.tinymce.majorVersion);
  };

  const assertEditor42 = (editor: Editor) => {
    Assertions.assertEq('Loaded engine should be editor42', true, Global.editor42.minorVersion.startsWith('42.'));
    Assertions.assertEq('editor belongs to editor42', true, editor.editorManager === Global.editor42);
  };

  context('With a local editor42 build via dependency injection', () => {
    const createFixture = editorHook(EditorComponent, {
      imports: [ EditorComponent ],
      providers: [{ provide: EDITOR42_SCRIPT_SRC, useValue: EDITOR42_LOCAL }],
    });

    before(cleanAllEngines);
    after(cleanAllEngines);

    it('Should be able to load editor42 specified via dependency injection', async () => {
      const { editor } = await createFixture();
      assertEditor42(editor);
    });
  });

  context('EDITOR42_SCRIPT_SRC wins over the deprecated TINYMCE_SCRIPT_SRC alias', () => {
    const createFixture = editorHook(EditorComponent, {
      imports: [ EditorComponent ],
      providers: [
        { provide: EDITOR42_SCRIPT_SRC, useValue: EDITOR42_LOCAL },
        { provide: TINYMCE_SCRIPT_SRC, useValue: '/project/node_modules/tinymce-6/tinymce.min.js' },
      ],
    });

    before(cleanAllEngines);
    after(cleanAllEngines);

    it('loads editor42, not the alias target', async () => {
      const { editor } = await createFixture();
      assertEditor42(editor);
    });
  });

  for (const version of [ '4', '5', '6', '7' ] as Version[]) {
    context(`With local version ${version}`, () => {
      const createFixture = editorHook(EditorComponent, {
        imports: [ EditorComponent ],
        providers: [
          {
            provide: TINYMCE_SCRIPT_SRC,
            useValue: `/project/node_modules/tinymce-${version}/tinymce.min.js`,
          },
        ],
      });

      before(cleanAllEngines);
      after(cleanAllEngines);

      it('Should be able to load local version of TinyMCE specified via dependency injection', async () => {
        const { editor } = await createFixture();
        assertTinymceVersion(version, editor);
      });
    });

    context(`With version ${version} loaded from miniature`, () => {
      const createFixture = editorHook(EditorComponent);
      tinymceVersionHook(version);

      it('Should be able to load with miniature', async () => {
        const { editor } = await createFixture();
        assertTinymceVersion(version, editor);
      });
    });
  }

  context('cdn fallback', () => {
    const expectUrl = (channel: string) => `https://cdn.editor42.com/editor42/${channel}/editor42.min.js`;

    const currentScriptSrcs = (): string[] =>
      Array.from(document.querySelectorAll<HTMLScriptElement>('script'))
        .map((s) => s.getAttribute('src') ?? '')
        .filter((s) => s.length > 0);

    // Mount without waiting for the editor: the fallback URL points at the real CDN,
    // which this environment never reaches. Returns the script srcs the component added.
    const pMountAndCollectScriptSrcs = async (props: Partial<EditorComponent>): Promise<string[]> => {
      const before_ = currentScriptSrcs();
      await TestBed.configureTestingModule({ imports: [ EditorComponent ] }).compileComponents();
      const fixture = TestBed.createComponent(EditorComponent);
      for (const [ key, value ] of Object.entries(props)) {
        (fixture.componentInstance as any)[key] = value;
      }
      fixture.detectChanges();
      let added: string[] = [];
      await Waiter.pTryUntil('a script tag was injected', () => {
        added = Arr.filter(currentScriptSrcs(), (s) => !Arr.contains(before_, s));
        if (added.length === 0) {
          throw new Error('no new script tag yet');
        }
      });
      fixture.destroy();
      TestBed.resetTestingModule();
      return added;
    };

    beforeEach(cleanAllEngines);
    after(cleanAllEngines);

    it('falls back to the latest channel with no inputs at all', async () => {
      const srcs = await pMountAndCollectScriptSrcs({});
      Assertions.assertEq('exactly the latest channel url', [ expectUrl('latest') ], srcs);
    });

    it('the channel input selects the cdn path', async () => {
      Assertions.assertEq('exact version', [ expectUrl('42.0.0') ],
        await pMountAndCollectScriptSrcs({ channel: '42.0.0' }));
    });

    it('legacy cloudChannel values map to latest', async () => {
      Assertions.assertEq('tinymce channel mapped', [ expectUrl('latest') ],
        await pMountAndCollectScriptSrcs({ cloudChannel: '7' }));
    });

    it('never contacts tiny.cloud and never sends a key, whatever key inputs are set', async () => {
      const srcs = await pMountAndCollectScriptSrcs({ apiKey: 'a-fake-api-key', licenseKey: 'gpl', cloudChannel: '7' });
      Assertions.assertEq('exactly the editor42 cdn url', [ expectUrl('latest') ], srcs);
      Arr.each(srcs, (src) => {
        Assertions.assertEq('no tiny.cloud contact', false, Strings.contains(src, 'tiny.cloud'));
        Assertions.assertEq('no key in the url', false,
          Strings.contains(src, 'a-fake-api-key') || Strings.contains(src, 'no-api-key'));
      });
    });
  });
});
