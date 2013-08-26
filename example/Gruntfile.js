
module.exports = function(grunt) {

  // grunt.loadNpmTasks("grunt-aws");
  grunt.loadTasks("../tasks");

  grunt.initConfig({

    aws: grunt.file.readJSON("credentials.json"),

    s3: {
      options: {
        accessKeyId: "<%= aws.accessKeyId %>",
        secretAccessKey: "<%= aws.secretAccessKey %>",
        bucket: "jpillora-usa"
      },
      build: {
        expand: true,
        cwd: "build",
        src: "**/*"
      }
    }
  });

  grunt.registerTask("default", ["s3"]);
};