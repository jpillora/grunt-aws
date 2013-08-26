
var AWS = require("aws-sdk"),
    async = require("async"),
    _ = require("lodash"),
    fs = require("fs"),
    crypto = require("crypto"),
    common = require("../common"),
    Cache = require("../cache"),
    mime = require("mime");

var shasum = crypto.createHash('sha1');

module.exports = function(grunt) {

  //s3 description
  var DESC = "grunt-aws's s3 task for easy deploys";

  //s3 defaults
  var DEFAULTS = {
    access: 'public-read',
    concurrent: 20,
    cacheTimeout: 60*60*1000,
    // deleteFirst: true,
    // deleteMatched: true,
    dryRun: false
  };

  //s3 task
  grunt.registerMultiTask("s3", DESC, function() {

    //build files array
    var files = [];
    this.files.forEach(function(file) {
      files = files.concat(file.src.map(function(s) {
        return {src: s, dest: file.dest || s};
      }));
    });

    //mark as async
    var done = this.async();
    //get options
    var opts = _.defaults(this.options(), DEFAULTS);

    //checks
    if(!opts.bucket)
      grunt.fail.warn("No 'bucket' has been specified");

    common.configUpdate(opts);
    //s3 client
    var S3 = new AWS.S3();

    //maintain stats
    var stats = { puts: 0, dels: 0 };

    //retrieve existing cache
    var cache = Cache.get();

    //TODO
    // cache[opts.bucket];

    //dry run prefix
    var DRYRUN = opts.dryRun ? "[DRYRUN] " : "";

    //start!
    async.series([getFileList, copyAllFiles], taskComplete);

    //------------------------------------------------

    function getFileList(callback) {
      //already have list
      if(cache.files && 
         opts.cacheTimeout && 
         opts.cacheTimeout > (Date.now() - cache.refreshedAt))
        return callback(); 

      cache.files = {};
      grunt.log.writeln("Retrieving list of existing objects...");

      //asynchrously loop through all files
      S3.listObjects({ Bucket: opts.bucket }, function(err, objs) {
        if(err) return callback(err);
        //store results
        objs.Contents.forEach(function(obj) {
          cache.files[obj.Key] = JSON.parse(obj.ETag);
        });
        //update cache
        cache.refreshedAt = Date.now();
        Cache.set(cache);
        callback();
      });
    }

    function copyAllFiles(callback) {
      //asynchrously loop through all files
      async.eachLimit(files, opts.concurrent, copyFile, callback);
    }

    function copyFile(file, callback) {
    
      var src = file.src, dest = file.dest;

      //skip directories since there are only files on s3
      if(grunt.file.isDir(src))
        return callback();

      //skip existing files
      var etag = cache.files[dest];
      if(etag && etag === hashFile(src)) {
        grunt.log.ok(DRYRUN + "No change '" + dest + "'");
        callback();
        return;
      }

      //skip upload
      if(opts.dryRun)
        return putComplete();

      //upload!
      S3.putObject({
        ACL: opts.access,
        Body: grunt.file.read(src),
        Bucket: opts.bucket,
        Key: dest,
        ContentType: opts.contentType || mime.lookup(dest)
      }, putComplete);

      function putComplete(err, results) {
        if(err) {
          return callback("Put '" + dest + "' failed...\n" + err + "\n ");
        }
        grunt.log.ok(DRYRUN + "Put '" + dest + "'");
        if(!opts.dryRun)
          stats.puts++;
        if(results)
          cache.files[dest] = JSON.parse(results.ETag);
        callback();
      }

    }

    function taskComplete(err) {
      if(err) {
        grunt.fail.warn(err);
        return done(false);
      }
      //all done
      grunt.log.ok("Put " + stats.puts + " files");
      if(stats.puts || stats.dels)
        Cache.set(cache);
      done(err);
    }
  });
};

//helper functions
function hashFile(path) {
  md5 = crypto.createHash('md5');
  md5.update(fs.readFileSync(path));
  return md5.digest('hex');
}
