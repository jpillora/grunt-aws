"use strict"

# * grunt-aws-sdk
# * https://github.com/jpillora/grunt-aws-sdk
# *
# * Copyright (c) 2013 Jaime Pillora
# * Licensed under the MIT license.

BaseService = require("./common/base-service")
glob = require("glob-manifest")
AWS = require "aws-sdk"
async = require "async"
fs = require "fs"
_ = require "lodash"

class S3Service extends BaseService

  name: 's3'

  defaults:
    pow: 99

  constructor: (@grunt, @opts, @data, @done) ->
    _.bindAll @

    @s3 = new AWS.S3
    console.log @name
    console.log @opts
    @run()

  run: ->
    console.log @data.files
    glob @data.files.src, (err, files) =>
      throw err  if err
      async.eachLimit files, 5, @transfer, @transferComplete

  transfer: (file, callback) ->

    fs

    console.log "start", file
    setTimeout ->
      console.log "end", file
      callback(null)
    , 500+500*Math.random()

  transferComplete: (err) ->
    console.log "done"
    @done()

module.exports = S3Service