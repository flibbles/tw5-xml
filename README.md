# XML for Tiddlywiki

This plugin provides several tools which allow for working with XML tiddlers.

* `<$xpath>` widget and `[xpath[]]` operator allows iterating through your XML tiddlers using XPath queries.
* Allows rendering of XML tiddlers, as well as the ability to directly render XML files using templates instead of showing their raw data.
* Provides importing and exporting tiddlers in XML

For a demonstration, and for documentation, see the [tiddlywiki demo site](https://flibbles.github.io/tw5-xml/).

## How to install

Visit the [demo site](https://flibbles.github.io/tw5-xml/). It will have a simple drag-and-drop installation icon.

### For Node.js

The contents of the `plugins` directory must be copied into the `plugins`
directory in your tiddlywiki installation. This is likely in:

`/usr/local/lib/node_modules/tiddlywiki/plugins/flibbles`

You will likely need to make the `flibbles` directory. If you've installed it correctly, the path to the `plugin.info` file should look something like:

`/usr/local/lib/node_modules/tiddlywiki/plugins/flibbles/xml/plugin.info`

Afterward, add the plugin inside your projects' `tiddlywiki.info` file.
The plugins section will look something like:
```
{
   ...
   "plugins": [
      ...
      "flibbles/xml"
   ],
   ...
}
```

Alternatively, you can also copy the `plugins` directly into your projects'
root directory. Though this makes the install local only to those specific
projects.

**Note:** If you're performing Node.js server operations using tw5-xml, you _may_ need to install some dependencies first. [See the documentation for more details.](https://flibbles.github.io/tw5-xml/#Node.js)

## How to test

Make sure you have `tiddlywiki` available on your PATH. Then from the project root directory, type:

`tiddlywiki --build test`
