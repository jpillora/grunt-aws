# grunt-aws

> A Grunt interface into the Amazon Web Services Node.JS SDK

## Getting Started
This plugin requires Grunt `~0.4.0`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-aws --save-dev
```

One the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-aws');
```

## The "aws" task

### Quick Usage

```js
grunt.initConfig({
  aws: {
    options: {
      config:{
        accessKeyId: '...',
        secretAccessKey: '...'
      },
      s3: {
        options: {
          root: 'build/'
          bucket: '...'
          access: 'public-read'
        }
      }
    },
    deploy: {
      service: 's3'
      put: ['build/**/*.*']
    }
  }
});
```

### Options

#### options.config
Type: `Object`
Default: `{}`

#### options.config.accessKeyId (required)
Type: `String`

Amazon access key id

#### options.config.secretAccessKey (required)
Type: `String`

Amazon secret access key

#### options.s3
Type: `Object`
Default: `{}`

S3 specifc options

#### options.s3.root
Type: `String`
Default: `'./'`

Local directory to use as S3 root

#### options.s3.bucket (required)
Type: `String`

Name of S3 bucket

#### options.s3.access
Type: `String`
Default: `'public-read'`


### Target API

#### `target`.put
Type: `Array` | `String`
Default: `[]`

A single glob or an array of globs


#### `target`.del
Type: `Array` | `String`
Default: `[]`

A single glob or an array of globs

### Target specifc Options

Each target may override the options specified. The following example is equivalent to the "Quick Usage" example above.


```js
grunt.initConfig({
  aws: {
    options: {
      config:{
        accessKeyId: '...',
        secretAccessKey: '...'
      },
      s3: {
        //nothing here
      }
    },
    deploy: {
      service: 's3',
      // these options will override 'service' options (so s3 options in this case)
      options: {
        root: 'build/'
        bucket: '...'
        access: 'public-read'
      }
      put: ['build/**/*.*']
    }
  }
});
```

