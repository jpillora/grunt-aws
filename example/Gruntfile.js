
module.exports = function(grunt) {

  grunt.loadNpmTasks("grunt-aws");

  grunt.initConfig({

    aws: grunt.file.readJSON("aws-credentials.json"),

    s3: {
      options: {
        accessKeyId: "<%= aws.accessKeyId %>",
        secretAccessKey: "<%= aws.secretAccessKey %>",
        bucket: "..."
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
    },

    sns: {
      options: {
        accessKeyId: "<%= aws.accessKeyId %>",
        secretAccessKey: "<%= aws.secretAccessKey %>",
        region: "...",
        target: "...",
        message: "...",
        subject: "..."
      }
    }

  });

  grunt.registerTask("default", ["s3"]);
};
