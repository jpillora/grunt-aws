# grunt-aws

> A Grunt interface into the Amazon Web Services Node.JS SDK

## Getting Started
This plugin requires Grunt `~0.4.0`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```sh
npm install --save-dev grunt-aws
```

One the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-aws');
```

-----

*Note:*

This plugin aims to provide a task for each service on AWS.
Currently however, only the Simple Storage Service task has been implemented.

## The "s3" task


### Features

* Simple
* Fast
* Only upload changes

### Usage

```js
  grunt.initConfig({
    aws: grunt.file.readJSON("credentials.json"),
    s3: {
      options: {
        accessKeyId: "<%= aws.accessKeyId %>",
        secretAccessKey: "<%= aws.secretAccessKey %>",
        bucket: "..."
      },
      build: {
        expand: true,
        cwd: "build/",
        src: "**/*"
      }
    }
  });
```

### Options

#### `accessKeyId` *required* (String) 

Amazon access key id

#### `secretAccessKey` *required* (String) 

Amazon secret access key

#### `bucket` *required* (String)

Bucket name

#### `region` (String)

Default *US Standard*

For all possible values, see [Location constraints](http://docs.aws.amazon.com/general/latest/gr/rande.html#s3_region).

#### `access` (String)

Default `"public-read"`

File permissions, must be one of:

* `"private"`
* `"public-read"`
* `"public-read-write"`
* `"authenticated-read"`
* `"bucket-owner-read"`
* `"bucket-owner-full-control"`

#### `dryRun` (Boolean)

Default `false`

Performs a preview run displaying what would be modified

#### `concurrency` (Number)

Default `20`

Number of S3 operations that may be performed concurrently 

#### `cacheTimeout` (Number)

Default `60*60*1000` (1hr)

Number of milliseconds to wait before retrieving the
object list from S3. If you only modify this bucket
from `grunt-aws` on one machine then it can be `Infinity`
if you like. To disable cache, set it to `0`.

### References

* [S3 AWS SDK API Docs](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3_20060301.html)



#### MIT License

Copyright &copy; 2013 Jaime Pillora &lt;dev@jpillora.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.





