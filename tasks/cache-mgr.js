var fs = require("fs"),
    path = require("path"),
    dirPath = path.join(__dirname,"..","caches");

if(!fs.existsSync(dirPath))
  fs.mkdirSync(dirPath);

//retreives/creates a given cache from disk
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

  mapObj(cache, name);
  return cache;
};

//saves a cache to disk
exports.put = function(cache) {
  var name = mapObj(cache);
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
// mapObj(obj) => get str by obj
// mapObj(obj, str) => set str
mapObj.objs = [];
mapObj.strs = [];
function mapObj(obj, str) {
  var i = mapObj.objs.indexOf(obj);
  if(str && i === -1) {
    mapObj.objs.push(obj);
    i = mapObj.objs.indexOf(obj);
    mapObj.strs[i] = str;
  } else if(i >= 0) {
    return mapObj.strs[i];
  }
  return null;
}
