# Official Editor42 Angular Component

## About

This package is a thin wrapper around [Editor42](https://github.com/editor42com/editor42),
the auditable MIT fork of TinyMCE 6, to make it easier to use in an Angular application.

Documentation lives at [editor42.com](https://editor42.com/docs).

## Installation

```sh
npm install @editor42/editor42-angular
```

## Usage

The editor is a standalone component:

```ts
import { Component } from '@angular/core';
import { EditorComponent } from '@editor42/editor42-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ EditorComponent ],
  template: '<editor [init]="{ height: 400 }" initialValue="<p>Hello from Editor42</p>"></editor>'
})
export class AppComponent {}
```

With no extra inputs the editor script is loaded from `https://cdn.editor42.com` on the
`latest` channel. There is no account, no sign-up and no key of any kind. The `latest`
pointer only ever moves for security and bug-fix releases, because the Editor42 major
version is fixed forever.

## Self-hosting

Provide the full script URL through dependency injection (editor42 and TinyMCE builds
both work):

```ts
import { EDITOR42_SCRIPT_SRC } from '@editor42/editor42-angular';

providers: [
  { provide: EDITOR42_SCRIPT_SRC, useValue: '/js/editor42/editor42.min.js' }
]
```

## Pinning a version

```html
<editor channel="42.0.0"></editor>
```

`channel` accepts `latest`, a `latest-N` alias, or an exact version.

## Editor options

Everything else is an Editor42 option, passed through the init input:

```html
<editor [init]="{ height: 400, menubar: false, plugins: 'lists link' }"></editor>
```

See the [Editor42 documentation](https://editor42.com/docs) for the full list.

## Migrating from the TinyMCE Angular component

```sh
npm uninstall @tinymce/tinymce-angular
npm install @editor42/editor42-angular
```

Change the import to `@editor42/editor42-angular` and you are done. Input, output and component
names are unchanged. The `TINYMCE_SCRIPT_SRC` injection token still works as a
deprecated alias of `EDITOR42_SCRIPT_SRC` (the editor42 token wins when both are
provided), and `cloudChannel` remains as a deprecated alias of `channel`.

All API-key and licence-key handling has been removed. The corresponding inputs are
still accepted so existing code compiles, but they do nothing: no key is read, stored or
sent anywhere, and no request ever reaches a vendor cloud.

The component also drives a stock TinyMCE if that is what is already loaded on the page,
which keeps the switch reversible. Configuring TinyMCE itself is outside the scope of
this package.

## Issues

Found an issue or have a feature request? Open an
[issue](https://github.com/editor42com/editor42-angular/issues) or submit a pull request.
For issues with the editor itself, use the
[Editor42 repository](https://github.com/editor42com/editor42/issues).

## License

MIT. See [LICENSE.txt](LICENSE.txt).
