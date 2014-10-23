var AWS = require("aws-sdk"),
    path = require("path"),
    async = require("async"),
    _ = require("lodash"),
    fs = require("fs"),
    crypto = require("crypto"),
    zlib = require("zlib"),
    CacheMgr = require("../cache-mgr"),
    mime = require("mime");

module.exports = function(grunt) {

  //s3 description
  var DESC = "grunt-aws's s3 task for easy deploys";

  //s3 defaults
  var DEFAULTS = {
    access: 'public-read',
    concurrent: 20,
    cacheTTL: 60*60*1000,
    // deleteFirst: true,
    // deleteMatched: true,
    dryRun: false,
    gzip: true,
    cache: true,
    overwrite: true,
    createBucket: false,
    enableWeb: false
  };

  //s3 task
  grunt.registerMultiTask("s3", DESC, function() {

    //normalize files array (force expand)
    var files = [];
    this.files.forEach(function(file) {
      var cwd = file.cwd || '';
      files = files.concat(file.src.map(function(src) {
        var s = path.join(cwd, src),
            d = (cwd||file.src.length>1) ? ((file.dest||'')+src) : file.dest || src;
        return {src: s, dest: d};
      }));
    });

    //skip directories since there are only files on s3
    files = files.filter(function(file) {
      return !grunt.file.isDir(file.src);
    });

    if(!files.length)
      return grunt.log.ok("No files matched");

    //mark as async
    var done = this.async();
    //get options
    var opts = this.options(DEFAULTS);

    //checks
    if(!opts.bucket)
      grunt.fail.warn("No 'bucket' has been specified");

    //custom mime types
    if(typeof opts.mime === 'object')
      mime.define(opts.mime);
    if(typeof opts.mimeDefault === 'string')
      mime.default_type = opts.mimeDefault;

    //whitelist allowed keys
    AWS.config.update(_.pick(opts,
      'accessKeyId',
      'secretAccessKey',
      'region',
      'sslEnabled',
      'maxRetries',
      'httpOptions'
    ), true);

    //s3 client
    var S3 = new AWS.S3();

    //dry run prefix
    var DRYRUN = opts.dryRun ? "[DRYRUN] " : "";

    //retrieve cache for this bucket
    var cache = CacheMgr.get(opts.bucket);

    if(!cache.options)
      cache.options = {};
    if(!cache.prefixes)
      cache.prefixes = {};
    if(!cache.files)
      cache.files = {};

    //base object (lacks Body and Key)
    var baseObject = {
      ACL: opts.access,
      Bucket: opts.bucket
    };

    //set gzip encoding
    if(opts.gzip)
      baseObject.ContentEncoding = 'gzip';

    //use allowed headers
    if(typeof opts.headers === 'object')
      _.extend(baseObject, _.pick(
        opts.headers,
        //http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property
        'ContentLength',
        'ContentType',
        'ContentDisposition',
        'ContentEncoding',
        'CacheControl',
        'Expires',
        'GrantFullControl',
        'GrantRead',
        'GrantReadACP',
        'GrantWriteACP',
        'ServerSideEncryption',
        'StorageClass',
        'WebsiteRedirectLocation'
      ));

    //convert numbers and dates
    if(typeof baseObject.CacheControl === 'number')
      baseObject.CacheControl = "max-age="+baseObject.CacheControl+", public";

    if(baseObject.Expires instanceof Date)
      baseObject.Expires = baseObject.Expires.toUTCString();

    //use meta data headers
    if(typeof opts.meta === 'object')
      baseObject.Metadata = opts.meta;

    //calculate options hash
    var optionsHash = hash(JSON.stringify(baseObject), 'sha256');
    var currOptionsHash = cache.options[this.target];

    //maintain stats
    var stats = { puts: 0, dels: 0, refreshed: false, newOptions: optionsHash !== currOptionsHash };

    if(stats.newOptions)
      cache.options[this.target] = optionsHash;

    var subtasks = [];

    //create the bucket if it does not exist
    if(opts.createBucket)
      subtasks.push(createBucket);

    //enable webhosting
    if(opts.enableWeb)
      subtasks.push(enableWebHosting);

    if(!opts.cache)
      subtasks.push(getFileList);

    subtasks.push(copyAllFiles);

    //start!
    async.series(subtasks, taskComplete);

    //------------------------------------------------

    function createBucket(callback) {
      //check the bucket doesn't exist first
      S3.listBuckets(function(err, data){
        if(err) return callback(err);
        var existingBucket = _.detect(data.Buckets, function(bucket){
          return opts.bucket === bucket.Name;
        });
        if(existingBucket){
          grunt.log.writeln('Existing bucket found.');
          callback();
        }else{
          grunt.log.writeln('Creating bucket ' + opts.bucket + '...');
          //create the bucket using the bucket, access and region options
          if (opts.dryRun) return callback();
          S3.createBucket({
            Bucket: opts.bucket,
            ACL: opts.access,
            CreateBucketConfiguration: { LocationConstraint: opts.region }
          }, function(err, data){
            if(err) return callback(err);
            grunt.log.writeln('New bucket\'s location is: ' + data.Location);
            // Disable caching if bucket is newly created
            opts.cache = false;
            callback();
          });
        }
      });
    }

    function enableWebHosting(callback) {
      S3.getBucketWebsite({ Bucket:opts.bucket }, function(err){
        if (err && err.name === 'NoSuchWebsiteConfiguration'){
          //opts.enableWeb can be the params for WebsiteRedirectLocation.
          //Otherwise, just set the index.html as default suffix
          grunt.log.writeln('Enabling website configuration on ' + opts.bucket + '...');
          var webOptions = _.isObject(opts.enableWeb) ? opts.enableWeb : { IndexDocument: { Suffix : 'index.html' }};
          if (opts.dryRun) return callback();
          S3.putBucketWebsite({
            Bucket: opts.bucket,
            WebsiteConfiguration: webOptions
          }, callback);
        }else{
          callback(err);
        }
      });
    }

    function getFileList(callback) {
      //calculate prefix
      var prefix = null, pindex = Infinity;
      files.forEach(function(file) {
        if(prefix === null) {
          prefix = file.dest;
          return;
        }
        var i = 0;
        while(i < prefix.length &&
              i < file.dest.length &&
              file.dest.charAt(i) === prefix.charAt(i)) i++;
        pindex = Math.min(i, pindex);
      });
      prefix = prefix.substr(0, pindex);

      //get prefix's earliest refresh time
      var refreshedAt = 0;
      for(var p in cache.prefixes)
        if(prefix.indexOf(p) === 0)
          refreshedAt = Math.max(refreshedAt, cache.prefixes[p]);

      //already have list
      if(cache.files &&
         refreshedAt &&
         opts.cacheTTL &&
         opts.cacheTTL > (Date.now() - refreshedAt)) {
        grunt.verbose.writeln("Using cached object list prefixed with '" + prefix + "'");
        return callback();
      }

      //fetch all objects, beginning with key ''
      fetchObjects('');

      function fetchObjects(marker) {
        var msg = "Retrieving list of existing objects";
        msg += prefix ? " prefixed with '" + prefix + "'" : "";
        msg += marker ? (" after '" + marker + "'") : "";
        msg += "...";
        grunt.log.writeln(msg);

        S3.listObjects({
          Bucket: opts.bucket,
          Marker: marker,
          Prefix: prefix
        }, function(err, objs) {
          if(err) return callback(err);

          //store results
          objs.Contents.forEach(function(obj) {
            cache.files[obj.Key] = JSON.parse(obj.ETag);
          });
          cache.prefixes[prefix] = Date.now();
          stats.refreshed = true;

          if(objs.IsTruncated)
            fetchObjects(objs.Contents.pop().Key);
          else
            callback();
        });
      }
    }

    function copyAllFiles(callback) {
      //asynchrously loop through all files
      async.eachLimit(files, opts.concurrent, getFile, callback);
    }

    function getFile(file, callback) {
      //extract src and dest
      var src = file.src,
          contents = fs.readFileSync(src),
          dest = file.dest;

      if(opts.gzip) {
        zlib.gzip(contents, function(err, compressed) {
          copyFile(src, compressed, dest, callback);
        });
      } else {
        copyFile(contents, contents, dest, callback);
      }
    }

    function copyFile(src, contents, dest, callback) {

      //skip existing files
      var etag = cache.files[dest];
      if(opts.cache &&
         !stats.newOptions &&
         etag && etag === hash(contents, 'md5')) {
        grunt.log.ok(DRYRUN + "No change '" + dest + "'");
        callback();
        return;
      }

      if(!opts.overwrite && etag) {
        grunt.log.ok(DRYRUN + "File already exists '" + dest + "'");
        callback();
        return;
      }

      //fake successful upload
      if(opts.dryRun)
        return putComplete();

      //extend the base object
      var object = Object.create(baseObject);
      object.Key = dest;
      object.Body = contents;
      if(!object.ContentType)
        object.ContentType = mime.lookup(dest);

      // Set a default charset
      if (opts.charset) object.ContentType += '; charset=' + opts.charset;

      //upload!
      S3.putObject(object, putComplete);

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
      if(opts.cache && (stats.puts || stats.dels || stats.refreshed || stats.newOptions))
        CacheMgr.put(cache);
      done(err);
    }
  });
};

//helper functions
function hash(buff, algo) {
  var h = crypto.createHash(algo);
  h.update(buff);
  return h.digest('hex');
}
