# grunt-aws

A Grunt interface into the Amazon Web Services Node.JS SDK `aws-sdk`

## Getting Started
This plugin requires Grunt `0.4.x`

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
Currently however, only the Simple Storage Service `"s3"` task has been implemented.

## The "s3" task


### Features

* Fast
* Simple
* Auto Gzip
* Smart Caching

### Usage

To upload all files *inside* `build/` into `my-awesome-bucket`:

```js
  grunt.initConfig({
    aws: grunt.file.readJSON("credentials.json"),
    s3: {
      options: {
        accessKeyId: "<%= aws.accessKeyId %>",
        secretAccessKey: "<%= aws.secretAccessKey %>",
        bucket: "my-awesome-bucket"
      },
      build: {
        cwd: "build/",
        src: "**"
      }
    }
  });
```

See the complete example [here](https://github.com/jpillora/grunt-aws/tree/master/example)

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

#### `gzip` (Boolean)

Default `true`

Gzips the file before uploading and sets the appropriate headers

 **Note: The default is `true` because this task assumes you're uploading content to be consumed by [browsers developed after 1999](http://schroepl.net/projekte/mod_gzip/browser.htm). On the terminal, you can retrieve a file using `curl --compressed <url>`.**

#### `dryRun` (Boolean)

Default `false`

Performs a preview run displaying what would be modified

#### `concurrency` (Number)

Default `20`

Number of S3 operations that may be performed concurrently 

#### `cache` (Boolean)

Default `true`

Don't upload files that already exist (same ETag). Each target has it's
own options cache, so if you change the options object, files
will be forced to reupload.

#### `cacheTTL` (Number)

Default `60*60*1000` (1hr)

Number of milliseconds to wait before retrieving the
object list from S3. If you only modify this bucket
from `grunt-aws` on one machine then it can be `Infinity`
if you like. To disable cache, set it to `0`. 

#### `headers` (Object)

Set HTTP headers

The following headers are allowed by S3:

* `ContentLength`
* `ContentType`
* `ContentDisposition`
* `ContentEncoding`
* `CacheControl` (converts numbers into strings as `max-age=<num>, public`)
* `Expires` (converts dates to strings with `toUTCString()`)

#### `meta` (Object)

Set **custom** HTTP headers

All custom headers will be prefixed with `x-amz-meta-`.
For example `{Foo:"42"}` becomes `x-amz-meta-foo:42`.

### More Examples

``` js
s3: {
  options: {
    accessKeyId: "<%= aws.accessKeyId %>",
    secretAccessKey: "<%= aws.secretAccessKey %>",
    bucket: "my-bucket"
  },
  //upload all files in img/
  images: {
    src: "img/**"
  },
  //upload all pdf and txt files in docs/
  documents: {
    src: "docs/**/*.{pdf,txt}"
  },
  //upload all files in secrets/ to a different bucket
  secrets: {
    //override options
    options: {
    	bucket: "my-secret-bucket"
    }
    src: "secrets/**"
  },
  //upload the `public/` directory with a 2 year cache time
  longTym: {
    options: {
      headers: {
        CacheControl: 630720000 //max-age=630720000, public
      }
    }
    src: "public/**"
  },
  //upload the `public/` directory a specific expiry date
  beryLongTym: {
    options: {
      headers: {
        Expires: new Date('2050') //Sat, 01 Jan 2050 00:00:00 GMT
      }
    }
    src: "public/**"
  }
}
```

### References

* [S3 AWS SDK API Docs](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3_20060301.html)

### Todo

* Download operation
* Delete unmatched files

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





