# Project Layout

* /build/: Post-processed and minified JavaScript/CSS files
* /lib/: Third-party libraries
* /src/: Application JavaScript files
* /previewer.html: 3D model previewer
* /viewer.html: 3D model viewer

Grunt is used to concatenate the source files in `lib` and `src` together into
one file in `build`. It then invokes uglifierjs to minify the resulting
überfile.

# Installation

## Installing Dependencies

npm is required; install that first.

## Building the Project

Enter the root project folder and install the required modules:

`$ npm install`

Then invoke Grunt:

`$ grunt`

This will produce post-processed JavaScript and CSS assets in the `build`
folder. If you are developing, run `grunt watch` to have Grunt automatically
reprocess files when they change.

## Configuration

See `index.html` for an example.

## Usage

Open `index.html` and drop a 3D model folder onto the drop area. **The folder
must be located at the top level inside the 3D viewer folder.** This is because
there is no way to get full path info for the local filesystem in JavaScript.
