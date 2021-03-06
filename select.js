'use strict'

module.exports = createSelectBuffer

var createFBO = require('gl-fbo')
var pool      = require('typedarray-pool')
var ndarray   = require('ndarray')
var cwise     = require('cwise')

var selectRange = cwise({
  args: [
      'array', 
      {'offset': [0,0,1], 'array':0},
      {'offset': [0,0,2], 'array':0},
      {'offset': [0,0,3], 'array':0}, 
      'scalar', 
      'scalar',
      'index'],
  pre: function() {
    this.closestD2 = 1e8
    this.closestX = -1
    this.closestY = -1
  },
  body: function(r, g, b, a, x, y, idx) {
    if(r < 255 || g < 255 || b < 255 || a < 255) {
      var dx = x - idx[0]
      var dy = y - idx[1]
      var d2 = dx*dx + dy*dy
      if(d2 < this.closestD2) {
        this.closestD2 = d2
        this.closestX = idx[0]
        this.closestY = idx[1]
      }
    }
  },
  post: function() {
    return [this.closestX, this.closestY, this.closestD2]
  }
})

function SelectResult(x, y, id, value, distance) {
  this.coord = [x, y]
  this.id = id
  this.value = value
  this.distance = distance
}

function SelectBuffer(gl, fbo, buffer) {
  this.gl     = gl
  this.fbo    = fbo
  this.buffer = buffer
  this.offset = [0,0]
  this.dims   = [1,1]
  this.radius = 1.0
}

var proto = SelectBuffer.prototype

Object.defineProperty(proto, 'shape', {
  get: function() {
    return this.fbo.shape.slice()
  },
  set: function(v) {
    this.fbo.shape = v
    var c = this.fbo.shape[0]
    var r = this.fbo.shape[1]
    if(r*c*4 > this.buffer.length) {
      pool.free(this.buffer)
      this.buffer = pool.mallocUint8(r*c*4)
    }
    return v
  }
})

proto.begin = function(x, y, radius) {
  var gl = this.gl
  var shape = this.shape
  x = x|0
  y = y|0
  
  if(typeof radius !== 'number') {
    radius = 1.0
  }

  var x0 = Math.min(Math.max(x - radius, 0), shape[0])|0
  var x1 = Math.min(Math.max(x + radius, 0), shape[0])|0
  var y0 = Math.min(Math.max(y - radius, 0), shape[1])|0
  var y1 = Math.min(Math.max(y + radius, 0), shape[1])|0

  this.offset = [x0, y0]
  this.dims   = [x1-x0, y1-y0]
  this.target = [x-x0, y-y0]
  this.radius = radius

  this.fbo.bind()
  gl.clearColor(1,1,1,1)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
}

proto.end = function() {
  var gl = this.gl
  if(this.dims[0] > 0 && this.dims[1] > 0) {
    gl.readPixels(this.offset[0], this.shape[1]-this.offset[1]-this.dims[1], this.dims[0], this.dims[1], gl.RGBA, gl.UNSIGNED_BYTE, this.buffer)
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  if(this.dims[0] <= 0 || this.dims[1] <= 0) {
    return null
  }
  var region = ndarray(this.buffer, [this.dims[0], this.dims[1], 4], [4, this.dims[0]*4, 1])
  this.region = region
  var closest = selectRange(region.hi(region.shape[0], region.shape[1], 1), this.target[0], this.target[1])
  var dx = closest[0]
  var dy = closest[1]
  if(dx < 0 || Math.pow(this.radius, 2) < closest[2]) {
    return null
  }
  var c0 = region.get(dx, dy, 0)
  var c1 = region.get(dx, dy, 1)
  var c2 = region.get(dx, dy, 2)
  var c3 = region.get(dx, dy, 3)
  dx = (dx + this.offset[0])|0
  dy = (dy + this.offset[1])|0
  return new SelectResult(dx, dy, c0, [c1, c2, c3], Math.sqrt(closest[2]))
}

proto.dispose = function() {
  this.fbo.dispose()
  pool.free(this.buffer)
}

function createSelectBuffer(gl, shape) {
  var fbo = createFBO(gl, shape)
  var buffer = pool.mallocUint8(shape[0]*shape[1]*4)
  return new SelectBuffer(gl, fbo, buffer)
}