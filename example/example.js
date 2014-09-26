"use strict"

var shell = require("gl-now")({ tickRate: 2, clearColor: [0,0,0,0] })
var createSelect = require("../select")

var select

shell.on("gl-init", function() {
  select = createSelect(shell.gl, [shell.width, shell.height])
})

shell.on("gl-render", function() {
  var gl = shell.gl
  select.shape = [shell.width, shell.height]
  select.begin(0, 0, 10)
  gl.clearColor(0, 0, 0, 0)
  gl.clear(gl.COLOR_BUFFER_BIT)
  console.log(select.end())
})