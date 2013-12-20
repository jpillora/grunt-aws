var AWS = require("aws-sdk"),
    _ = require("lodash"),
    async = require("async");

module.exports = function(grunt) {
 
  //route53 description
  var DESC = "grunt-aws's route53 for easy setup of domains";

  //route53 defaults
  var DEFAULTS = {
    dryRun: false,
    zones: []
  };

  //route53 task
  grunt.registerTask("route53", DESC, function() {

    //get options
    var opts = this.options(DEFAULTS);

    //stop the task here if no zones were configured
    if(!_.isArray(opts.zones) || _.isEmpty(opts.zones))
      return grunt.log.ok("No Route53 zones configured");

    //mark as async
    var done = this.async();

    //dry run prefix
    var DRYRUN = opts.dryRun ? "[DRYRUN] " : "";

    //whitelist allowed keys
    AWS.config.update(_.pick(opts,
      'accessKeyId',
      'secretAccessKey',
      'zones'
    ), true);
 
    //route53 client
    var Route53 = new AWS.Route53();

    //create records for each zone configured in the options
    async.eachSeries(opts.zones, createRecordsForZone, done);

    //------------------------------------------------
    
    function createRecordsForZone(zone, callback) {
      //confirm that the zone.id has been set
      if (!zone.id) return callback('An existing Hosted Zone ID must be specified for each zone');

      //get list of all records for this zone
      Route53.listResourceRecordSets({ HostedZoneId: zone.id }, function(err, data) {
        if(err) return callback(err);

        //find all records that don't exist in Route53
        var recordsToCreate = _.select(zone.records, function(record) {
          //check for any Route53 record matching this record's name (with period)
          var checkForName = (record.name || record.Name) + '.';
          return !_.detect(data.ResourceRecordSets, function(route53RecordData) {
            return route53RecordData.Name === checkForName;
          });
        });

        if(_.isEmpty(recordsToCreate)){
          grunt.log.ok('All records exist in Route53');
          return callback();
        }

        //construct a batch change request with details for each record that needs to be created
        var batchChangeRequest = {
          HostedZoneId: zone.id,
          ChangeBatch: {
            Changes: _.map(recordsToCreate, createBatchRequestForRecord)
          }
        };

        //notify what changes will be made
        var recordNamesToCreate = _.map(batchChangeRequest.ChangeBatch.Changes, function(change) {
          return change.ResourceRecordSet.Name;
        }).join(', ');
        grunt.log.writeln(DRYRUN + 'Creating Route53 records for ' + recordNamesToCreate + '...');

        //submit the batch change request
        if (opts.dryRun) return callback();
        Route53.changeResourceRecordSets(batchChangeRequest, callback);
      });
    }

    function createBatchRequestForRecord(record) {
      var changeRequest = {};
      _.each(record, function(value, key) {
        // Treat the options.value property specially
        if (key === 'value' || key === 'Value'){
          changeRequest.ResourceRecords = _.map(value, function(dnsValue) {
            if (_.isObject(dnsValue) && dnsValue.bucket){
              return { Value: s3HostNameBucket(dnsValue.bucket) };
            }else{
              return { Value: dnsValue };
            }
          });
        }else{
          changeRequest[makeAwsFriendly(key)] = value;
        }
      });
      return { Action: 'CREATE', ResourceRecordSet: changeRequest };
    }

    function s3HostNameBucket(bucket) {
      return bucket + '.s3-website-' + opts.region + '.amazonaws.com';
    }

    function makeAwsFriendly(key) {
      // capitalize the key the way AWS likes it e.g. name => Name, type => Type etc
      return key.charAt(0).toUpperCase() + key.slice(1);
    }
  });


};
