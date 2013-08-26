
var _ = require("lodash"),
    fs = require("fs"),
    path = require("path"),
    cachePath = path.join(__dirname, "cache.json"),
    cache = {};

//init
if(fs.existsSync(cachePath))
  read();
else
  write();

exports.get = function() {
  return cache;
};

exports.set = function(newCache) {
  cache = newCache;
  write();
};

function read() {
  var contents = fs.readFileSync(cachePath);
  if(!contents) return;
  try {
    cache = JSON.parse(contents);
  } catch(e) {
    return;
  }
  return true;
}

function write() {
  var contents = JSON.stringify(cache, null, 2);
  fs.writeFileSync(cachePath, contents);
}
