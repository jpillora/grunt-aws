var AWS = require("aws-sdk"),
    _ = require("lodash");

// exports.DEFAULTS = {};

exports.configUpdate = function(opts) {

  var values = _.pick(opts,
    'accessKeyId',
    'secretAccessKey',
    'region'
  );
  
  AWS.config.update(values);
};


    