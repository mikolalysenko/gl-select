gl-select
=========
Helper module for point picking rendering passes

## Install

```
npm install gl-select
```

## API

```javascript
var createSelectBuffer = require("gl-select")
```

### Constructor

#### `var select = createSelectBuffer(gl, shape)`

Creates a select buffer with the given shape

### Methods

#### `select.begin(x, y, radius)`

Begins a selection pass for finding the closest point in the buffer to `x,y`

* `x` and `y` are the coordinates of the query point starting from the top-left of the screen
* `radius` is the radius in pixels to search

#### `select.end()`

Finishes the selection pass.

**Returns** An object whose properties encode the result of the closest point to the query point within radius, or `null` if no points are found.  The properties of this object are:

* `coord` A length 2 array representing the coordinates of the closest pixel
* `id` The 32 bit identifier of the closest point
* `distance` The distance of the closest point to the selection point

#### `select.dispose()`

Destroys the selection buffer and releases all associated resources

### Properties

#### `select.shape`

Updates or retrieves the shape of the selection buffer.

## Legal

(c) 2014 Mikola Lysenko. MIT License