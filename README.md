# [PComplex](https://sacdallago.github.io/pcomplex)
Small visualization utility to visualize protein complexes.

## Requirements
This package is unpublished, thus only people with access to the source can use it. Ideally, you would be able to download
the package via a registry, such as NPM. In the case of unpublished packages though, the best approach is to build the tool
and use the built javascript file for your application.
To build this package you will need:  
- `webpack`: `npm install -G webpack` (the `-G` options will install Webpack globally).
- `watchify`: `npm install -G watchify` (the `-G` options will install Webpack globally). You can use
        watchify to keep rebuilding the source if you are working in the `lib` folders.

## Structure
The repository is structured as follows:

- The `lib` folder contains the sources (in this case, only one source with one class).
- The `example` folder contains three examples of how to use this tool and how to modify appearance via CSS.
- The `build` folder contains the built sources as one file called `pcomplex.js`
    (this you can include in your web-page via the \<script\> tag).  
    **IMPORTANT** it is always best to rebuild the source before using the package (see following sections).

## Building the source
After you have installed Webpack, you will just need to run `webpack` via terminal from the root of this repository.
This will automatically overwrite (or create) the file `build/pcomplex.js`.

## Using the tool
You can use the compiled source directly in your webpages, for example:

```html
<script src="path/to/pcomplex.js"></script>
<script>
    let text = "..." // Some Tab-Separated-Valued data source for protein complexes
    let [parsedData, proteins] = PComplex.parseTSV(text);
    let tracks = PComplex.getTracksFromData(parsedData);
    let rendering = new PComplex(tracks, [options]);
<script>
```

NB: The options parameter can be omitted. Available options are:
- `element`: The element which will be used to render the tracks.

**IMPORTANT** The element on which the graph/tracks will be rendered **must** be passed via its `id` (not via `class`)
and must be passed with the hash-tag (**`#`**) preceding the id name. The default element, if none is passed in the options, is `#pcomplex`.

## Customization
The visualization tool allows many customizations through CSS attributes. The general size of every element (nodes, paths, text)
is set based on the EM value. Thus: changing the EM value of the parent container will change all the EM values of the chilren (nodes,
paths, text) in the graph.

_[Example 2](https://sacdallago.github.io/pcomplex/examples/example2.html)_ shows many CSS customizations. This example best shows how to highlight relationships between data points and
how to use the power of CSS to change every aspect of the visualization.

An extra class `show` will be appended to various elements when hovering on one of the _dots_ in the visualization. This will
allow you to highlight different aspects or (as in _[Example 3](https://sacdallago.github.io/pcomplex/examples/example3.html)_) don't change style on events.

## Examples
There are three examples of how you can customize the visualization:

  1. [Example 1](https://sacdallago.github.io/pcomplex/examples/example1.html): This is a normal use-case scenario with mild customizations.
  2. [Example 2](https://sacdallago.github.io/pcomplex/examples/example2.html): This is an advanced use-case scenario with many customizations.
  3. [Example 3](https://sacdallago.github.io/pcomplex/examples/example3.html): This is a very basic use-case scenario with almost no customizations.