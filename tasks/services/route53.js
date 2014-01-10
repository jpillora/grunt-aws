var AWS = require("aws-sdk"),
    _ = require("lodash"),
    async = require("async"),
    CacheMgr = require("../cache-mgr");

module.exports = function(grunt) {
 
  //route53 description
  var DESC = "grunt-aws's route53 for easy setup of domains";

  //route53 defaults
  var DEFAULTS = {
    cache: true,
    concurrent: 20,
    dryRun: false,
    TTL: 300,
    zones: []
  };

  //route53 task
  grunt.registerTask("route53", DESC, function() {

    //get options
    var opts = this.options(DEFAULTS);

    //stop the task here if no zones were configured
    if(_.isEmpty(opts.zones))
      return grunt.log.ok("No Route53 zones configured");

    if (opts.cache && allRecordsInCache()){
      return grunt.log.ok("All Route53 zones found in cache");
    }

    //mark as async
    var done = this.async();

    //dry run prefix
    var DRYRUN = opts.dryRun ? "[DRYRUN] " : "";

    //whitelist allowed keys
    AWS.config.update(_.pick(opts,
      'accessKeyId',
      'secretAccessKey'
    ), true);
 
    //route53 client
    var Route53 = new AWS.Route53();

    //create records defined in opts.zones
    createRecordsForZones(done);

    //------------------------------------------------

    function allRecordsInCache() {
      return _.all(_.pairs(opts.zones), function(config){
        var zone = config[0];
        var records = config[1];
        var cachedZone = CacheMgr.get('route53:zone:' + zone);
        if(!cachedZone) return false;
        var recordNames = _.map(records, function(record){ return record.name || record.Name; });
        //test that all records for this zone are in the cache
        return _.isEmpty(_.difference(recordNames, cachedZone.records));
      });
    }

    function createRecordsForZones(callback) {
      async.eachLimit(_.pairs(opts.zones), opts.concurrent, function(config, next){
        var zone = config[0];
        var records = config[1];
        getZoneID(zone, function(err, zoneID){
          if(err) return next(err);
          createRecords(zone, zoneID, records, next);
        });
      }, callback);
    }

    function getZoneID(zone, callback) {
      if (opts.cache){
        //return zone id if in cache
        var cache = CacheMgr.get('route53:zone:' + zone);
        if (cache.id) return callback(null, cache.id);
      }
      //get list of zones from route53 and load into cache if cache enabled
      Route53.listHostedZones(function(err, data){
        if(err) return callback(err);
        var zoneDataForCurrentZone;
        _.each(data.HostedZones, function(zoneData){
          var zoneName =  zoneData.Name.replace(/\.$/, '');
          if (opts.cache){
            var cache = CacheMgr.get('route53:zone:' + zoneName);
            if (!cache.id){
              cache.id = zoneData.Id.replace(/.*\//, '');
              CacheMgr.put(cache);
            }
          }
          if (zoneName === zone){
            zoneDataForCurrentZone = zoneData;
          }
        });
        if(!zoneDataForCurrentZone) return callback('No ID found for zone: ' + zone);
        callback(null, zoneDataForCurrentZone.Id);
      });
    }

    function createRecords(zone, zoneID, records, callback) {
      //get list of all records for this zone
      Route53.listResourceRecordSets({ HostedZoneId: zoneID }, function(err, data) {
        if(err) return callback(err);

        if (opts.cache){
          //store list of records in cache
          var cache = CacheMgr.get('route53:zone:' + zone);
          cache.id = zoneID;
          cache.records = _.map(data.ResourceRecordSets, function(route53RecordData){
            //strip trailing period from the name
            return route53RecordData.Name.replace(/\.$/, '');
          });
          CacheMgr.put(cache);
        }

        //find all records that don't exist in Route53
        var recordsToCreate = _.select(records, function(record) {
          //check for any Route53 record matching this record's name (with period on the end)
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
          HostedZoneId: zoneID,
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
            return { Value: dnsValue };
          });
        }else{
          changeRequest[makeAwsFriendly(key)] = value;
        }
      });
      //add default TTL if not specified
      if (!changeRequest.TTL && !changeRequest.AliasTarget){
        changeRequest.TTL = opts.TTL;
      }
      return { Action: 'CREATE', ResourceRecordSet: changeRequest };
    }

    function makeAwsFriendly(key) {
      // capitalize the key the way AWS likes it e.g. name => Name, type => Type etc
      return key.charAt(0).toUpperCase() + key.slice(1);
    }
  });


};
