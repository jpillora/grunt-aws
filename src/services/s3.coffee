"use strict"

# * grunt-aws-sdk
# * https://github.com/jpillora/grunt-aws-sdk
# *
# * Copyright (c) 2013 Jaime Pillora
# * Licensed under the MIT license.

BaseService = require "./common/base-service"
glob = require "glob-manifest"
AWS = require "aws-sdk"
async = require "async"
fs = require "fs"
_ = require "lodash"
mime = require "mime"
util = require "util"

class S3Service extends BaseService

  name: 's3'

  defaults:
    root: './'
    access: 'public-access'
    endpoint: 's3-ap-southeast-2.amazonaws.com'
    concurrent: 20

  constructor: (@grunt, @opts, @data, @done) ->
    _.bindAll @

    #client config
    config = _.pick @opts, 'endpoint'

    @s3 = new AWS.S3(config).client

    @stats = {puts: 0, dels: 0}

    @data.put = [] unless @data.put
    @data.del = [] unless @data.del 

    async.series [
      (cb) => @runGlob @data.del, @deleteObject, cb
      (cb) => @runGlob @data.put, @putObject, cb
    ], @complete

  #runs a given method over all files in a glob
  runGlob: (globs, method, methodsComplete) ->
    #skip
    return methodsComplete() unless globs and globs.length

    glob globs, (err, files) =>
      #cancel with error
      return methodsComplete(err)  if err
      async.eachLimit(
        files,
        @opts.concurrent,
        method,
        methodsComplete
      )

  deleteObject: (file, callback) ->
    #open file
    fs.readFile file, (err, buffer) =>

      key = @calcKey file
      return callback() unless key

      #transfer object
      object = {
        Bucket: @opts.bucket
        Key: key
      }

      @s3.deleteObject object, (err, data) =>
        return callback(err) if err
        
        @grunt.log.ok "Deleted: #{key}"
        @stats.dels++
        callback()


  putObject: (file, callback) ->

    #open file
    fs.readFile file, (err, buffer) =>

      key = @calcKey file
      return callback() unless key

      #transfer object
      object = {
        ACL: @opts.access
        Body: buffer
        Bucket: @opts.bucket
        Key: key
        ContentType: @opts.contentType || mime.lookup file
      }

      @s3.putObject object, (err, data) =>
        return callback(err) if err
        
        @grunt.log.ok "Put: #{key}"
        @stats.puts++
        callback()


  calcKey: (file) ->
    return file unless @opts.root
    #skip objects not in root
    if file.indexOf(@opts.root) is 0
      return file.replace @opts.root, ''
    else
      @grunt.log.writeln "Skipping: #{file} (not in root)"
      return null

  complete: (err) ->
    if err
      @grunt.fail.warn "Deployment Error: #{err}"
    else
      @grunt.log.ok "Deployment Complete (#{@stats.puts} puts, #{@stats.dels} dels)"
    @done()

  # getDeployUrl: ->
  #   console.log " get url "
  #   @s3.getBucketWebsite {Bucket: @opts.bucket}, (err, data) =>
  #     console.log " got url ", data
  #     if err
  #       @grunt.fail.warn "Deployment URL Error: #{err}"
  #     else
  #       @grunt.log.ok "Deployed to: #{data.RedirectAllRequestsTo.HostName}"
  #     @done()

module.exports = S3Service