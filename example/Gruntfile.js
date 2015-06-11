
module.exports = function(grunt) {

  grunt.loadNpmTasks("grunt-aws");

  grunt.initConfig({

    aws: grunt.file.readJSON("aws-credentials.json"),

    s3: {
      options: {
        accessKeyId: "<%= aws.accessKeyId %>",
        secretAccessKey: "<%= aws.secretAccessKey %>",
        bucket: "...",
        exclude: "dirty.js"
      },
      build: {
        cwd: "build",
        src: "**"
      }
    },

    cloudfront: {
      options: {
        accessKeyId: "<%= aws.accessKeyId %>",
        secretAccessKey: "<%= aws.secretAccessKey %>",
        distributionId: "...",
        invalidations: [
          "/index.html"
        ]
      },
      invalidate: {}
    }
  });

  grunt.registerTask("default", ["s3"]);
};