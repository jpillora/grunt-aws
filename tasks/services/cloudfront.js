var AWS = require("aws-sdk"),
    _ = require("lodash"),
    async = require("async");

module.exports = function(grunt) {

  //cloudfront description
  var DESC = "grunt-aws's cloudfront";

  //cloudfront defaults (none at the moment)
  var DEFAULTS = {};

  //cloudfront task
  grunt.registerMultiTask("cloudfront", DESC, function() {

    //get options
    var opts = this.options(DEFAULTS);

    if(_.isEmpty(opts.distributionId))
      return grunt.log.ok("No DistributionId specified");

    //mark as async
    var done = this.async();

    //whitelist allowed keys
    AWS.config.update(_.pick(opts,
      'accessKeyId',
      'secretAccessKey'
    ), true);
 
    //cloudfront client
    var cloudfront = new AWS.CloudFront();

    var subtasks = [];
    subtasks.push(createInvalidations);
    subtasks.push(createUpdates);
    async.series(subtasks, done);

    //------------------------------------------------

    //create records defined in opts.invalidations
    function createInvalidations(callback) {
      if(!opts.invalidations || !opts.invalidations.length)
        return callback();

      var params = {
        DistributionId: opts.distributionId,
        InvalidationBatch: {
          CallerReference: Date.now().toString(),
          Paths: {
            Quantity: opts.invalidations.length,
            Items: opts.invalidations
          }
        }
      };
      cloudfront.createInvalidation(params, function(err, data) {
        if (err) console.log(err, err.stack);
        else console.log(data);
        callback(err);
      });
    }

    function createUpdates(callback) {
      if(!opts.customErrorResponses && !opts.originPath && !opts.defaultRootObject)
        return callback();

      cloudfront.getDistribution({ Id: opts.distributionId }, function(err, res) {
        if (err) {
          console.log(err, err.stack);
          return callback(err);
        }

        var params = {
          Id: opts.distributionId,
          DistributionConfig: res.Distribution.DistributionConfig,
          IfMatch: res.ETag
        };

        if(opts.customErrorResponses){
          params.DistributionConfig.CustomErrorResponses = {
            Quantity: opts.customErrorResponses.length,
            Items: opts.customErrorResponses
          };
        }

        if(opts.originPath){
          params.DistributionConfig.Origins.Items[ 0 ].OriginPath = opts.originPath;
        }

        if(opts.defaultRootObject){
          params.DistributionConfig.DefaultRootObject = opts.defaultRootObject;
        }

        cloudfront.updateDistribution(params, function(err, data) {
          if (err) console.log(err, err.stack);
          else console.log(data);
          callback(err);
        });
      });

    }

  });


};
