var AWS = require("aws-sdk"),
    _ = require("lodash"),
    async = require("async");

module.exports = function(grunt) {

  //sns description
  var DESC = "grunt-aws's sns";

  //sns defaults (none at the moment)
  var DEFAULTS = {};

  //sns task
  grunt.registerTask("sns", DESC, function() {

    //get options
    var opts = this.options(DEFAULTS);

    if(_.isEmpty(opts.target))
      return grunt.log.ok("No target specified");

    if(_.isEmpty(opts.message))
      return grunt.log.ok("No message specified");

    if(_.isEmpty(opts.subject))
      return grunt.log.ok("No subject specified");

    //mark as async
    var done = this.async();

    //whitelist allowed keys
    AWS.config.update(_.pick(opts,
      'accessKeyId',
      'secretAccessKey',
      'region'
    ), true);

    //sns client
    var sns = new AWS.SNS();

    //create records defined in opts.invalidations
    publishTopic(done);

    //------------------------------------------------

    function publishTopic(callback) {
      var params = {
        TargetArn: opts.target,
        Message: opts.message,
        Subject: opts.subject
      };
      sns.publish(params, function(err, data) {
        if (err) console.log(err, err.stack);
        else console.log(data);
        callback(err);
      });
    }
  });


};
