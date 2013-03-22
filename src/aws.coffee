"use strict"

# * grunt-aws-sdk
# * https://github.com/jpillora/grunt-aws-sdk
# *
# * Copyright (c) 2013 Jaime Pillora
# * Licensed under the MIT license.

glob = require("glob-manifest")
fs = require("fs")
path = require("path")
_ = require("lodash")
requiredir = require("require-dir")
AWS = require "aws-sdk"

# Retrieve Subtasks
services = requiredir("./services")

# Define AWS Master Task
class AWSTask

  defaults:
    baz: 5

  constructor: (@grunt, @task) ->

    @name = @task.target
    #required fields
    @grunt.config.requires ['aws', @name, 'service']
    @grunt.config.requires ['aws', 'options', 'config', 'accessKeyId']
    @grunt.config.requires ['aws', 'options', 'config', 'secretAccessKey']

    @data = @task.data
    @service = @task.data.service
    @opts = @task.options()
    @done = @task.async()
    @config()

  config: ->
    AWS.config.update @opts.config
    @startService()

  startService: ->
    Service = services[@service] 

    #existance check
    unless Service
      @grunt.fail.fatal "Sorry the '#{@service}' service does not exist yet. Please contribute!"

    #extract per-service opts
    if @opts[@service]
      serviceOpts = @opts[@service]
      delete @opts[@service]

    #build options
    @opts = _.extend(
      {}, 
      @defaults,                        #hardcoded plugin defaults
      Service.prototype.defaults or {}, #hardcoded service defaults
      serviceOpts or {},  #user options (options -> service section)
      @opts         #user options (task(with service == service) -> options section)
    )

    #run !
    @grunt.log.writeln "Running service: #{@service}..."
    new Service @grunt, @opts, @data, @done
    null

module.exports = (grunt) ->
  grunt.registerMultiTask "aws", "A Grunt interface into the Amazon Node.JS SDK", ->
    new AWSTask grunt, @
