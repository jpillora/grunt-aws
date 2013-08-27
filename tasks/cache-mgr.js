
var _ = require("lodash"),
    fs = require("fs"),
    path = require("path"),
    dirPath = path.join(__dirname,"..","caches"),
    active = [];

if(!fs.existsSync(dirPath))
  fs.mkdirSync(dirPath);

exports.get = function(name) {
  var p = cachePath(name);

  var cache = {};
  //fetch
  if(fs.existsSync(p)) {
    try {
      cache = JSON.parse(fs.readFileSync(p));
    } catch(e) {
      cache = {};
    }
  }

  meta(cache, name);
  return cache;
};


exports.put = function(cache) {
  var name = meta(cache);
  if(!name)
    throw "Object not found. Only put objects that have been 'get()'";
  var p = cachePath(name);
  var contents = JSON.stringify(cache, null, 2);
  fs.writeFileSync(p, contents);
};

//helpers
function cachePath(name) {
  return path.join(dirPath,name+".json");
}

//object -> string map
function meta(obj, m) {
  if(!active.meta)
    active.meta = {};

  var i = active.indexOf(obj);
  if(m && i === -1) {
    active.push(obj);
    i = active.indexOf(obj);
    active.meta[i] = m;
  } else if(i >= 0) {
    return active.meta[i];
  }
  return null;
}
