import type { Editor } from 'editor42';

const isDisabledOptionSupported = (editor: Editor) => editor.options && editor.options.isRegistered('disabled');

export {
  isDisabledOptionSupported
};
