"use strict"

# * grunt-aws-sdk
# * https://github.com/jpillora/grunt-aws-sdk
# *
# * Copyright (c) 2013 Jaime Pillora
# * Licensed under the MIT license.

glob = require("glob-manifest")
fs = require("fs")
path = require("path")
requiredir = require("require-dir")

# Retrieve Subtasks
subtasks = requiredir("./subtasks")
# ( ->
#   tasks = {}
#   dirName = 'subtasks'
#   dir = path.resolve __dirname, dirName
#   fs.readdirSync(dir)?.forEach (f) ->
#     name = f.replace /\.js$/, ''
#     path = "." + path.sep + dirName + path.sep + name
#     tasks[name] = require(path)
#   tasks
# )()

console.log subtasks

# Define AWS Master Task
class AWSTask

  defaults:
    punctuation: "."
    separator: ", "

  constructor: (@grunt, @task) ->
    @name = @task.target
    @opts = @task.options @defaults
    @data = @task.data
    @done = @task.async()

    @run()

  run: ->

    console.log "running"
    console.log @task

    glob @data.files, (err, files) ->
      throw err  if err
      console.log files

    @done()

module.exports = (grunt) ->
  grunt.registerMultiTask "aws", "A Grunt interface into the Amazon Node.JS SDK", ->
    new AWSTask grunt, @
