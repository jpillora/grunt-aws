var AWS = require("aws-sdk"),
    _ = require("lodash"),
    async = require("async");

module.exports = function(grunt) {
 
  //cloudfront description
  var DESC = "grunt-aws's cloudfront";

  //cloudfront defaults (none at the moment)
  var DEFAULTS = {};

  //cloudfront task
  grunt.registerTask("cloudfront", DESC, function() {

    //get options
    var opts = this.options(DEFAULTS);

    if(_.isEmpty(opts.distributionId))
      return grunt.log.ok("No DistributionId specified");    

    if(_.isEmpty(opts.invalidations))
      return grunt.log.ok("No invalidations specified");

    //mark as async
    var done = this.async();

    //whitelist allowed keys
    AWS.config.update(_.pick(opts,
      'accessKeyId',
      'secretAccessKey'
    ), true);
 
    //cloudfront client
    var cloudfront = new AWS.CloudFront();

    //create records defined in opts.invalidations
    createInvalidations(done);

    //------------------------------------------------

    function createInvalidations(callback) {
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
  });


};
