/**
 * Copyright (c) 2017-present, Ephox, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Resolve the engine global. Editor42 wins when both engines are on the page; a real
// TinyMCE is a supported fallback so this component can drive either engine.
const getEditor42 = () => {
  const w = typeof window !== 'undefined' ? (window as any) : undefined;
  return w?.editor42 ?? w?.tinymce ?? null;
};

export { getEditor42 };
