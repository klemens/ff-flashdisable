# FlashDisable

With this addon you can deactivate and re-activate Flash with one click.

It inserts a button in the navigation toolbar that you can use to (de)activate
Flash at any time. Additional features can be enabled in the addon settings:

* Reload current tab after activating Flash
* Disable Flash on Firefox startup
* Support for 'Ask to Activate' (Click to Play)

## Build

First, download the necessary dependencies using `npm`:

```sh
npm install
```

After that, the add-on can be built using `jpm`:

```sh
jpm xpi
```

This creates an unsigned add-on. To build a signed version, you have to change
the add-on id and submit the add-on to [Mozilla Add-ons][amo] for signing.

## Develop

You can run the add-on directly in Firefox with a fresh profile and get log
messages on your terminal:

```sh
jpm -b firefox-dev run
```

Currently `firefox-dev` has to be an aurora (dev) or nightly build of Firefox,
because of a [bug in `jpm`][jpm-468].

## Licence

This addon by Klemens Schölhorn is licenced under GPLv3.<br />
The included [menuitem module][menuitem] by Erik Vold is licenced under MPL 2.0.

[menuitem]: https://github.com/OverByThere/menuitem
[jpm-468]: https://github.com/mozilla-jetpack/jpm/issues/468
[amo]: https://addons.mozilla.org/
