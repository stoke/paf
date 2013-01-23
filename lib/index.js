var fs = require('fs'),
    path = require('path'),
    mime = require('./mime');

function Server(opts) {
  var self = this;

  this.path = path.resolve(opts.path);
  this.quiet = opts.quiet;
  this.middlewares = opts.middlewares || null;

  this.log('Listening on ' + opts.port);
}

Server.prototype.dispatch = function(req, res) {
  if (req.method !== 'GET') 
    return this.unsupportedMethod(req, res);

  if (!this.isSecure(req.url)) {
    this.log(req.method, 'rejected for url ' + req.url);
    
    return res.end(res.writeHead(500));
  }

  this.log(req.method, req.url);

  this.serve(req, res);
};

Server.prototype.fireMiddlewares = function(req, res, cbl) {
  var self = this,
      idx = -1;

  if (!this.middlewares) return;

  (function loop(req, res) {
    var middleware = self.middlewares[++idx];

    if (!middleware)
      return cbl(req, res);

    middleware.call(self, req, res, loop);
  })(req, res);
};

Server.prototype.unexistent = function(req, res, headers) {
  res.writeHead(404, headers);
  res.end(req.url + ' not found');
};

Server.prototype.unauthorized = function(req, res, headers) {
  res.writeHead(401, headers);
  res.end('unauthorized');
};

Server.prototype.serve = function(req, res) {
  var self = this;
  
  this.fireMiddlewares(req, res, function(req, res) {
    var p = self.resolve(req.url);

    fs.stat(p, function(e, stat) {
      if (e || stat.isDirectory()) 
        return self.unexistent(req, res);
      
      res.writeHead(200, {'Content-Type': mime[path.extname(p).slice(1)] || 'application/octet-stream'});
      
      fs.createReadStream(p).pipe(res);
    });
  });
};

Server.prototype.resolve = function(p) {
  return path.normalize(
    path.join(this.path, p)
  );
};

Server.prototype.isSecure = function(p) {
  return this.resolve(p).slice(0, this.path.length) === this.path;
};

Server.prototype.log = function() {
  if (this.quiet) return;
  
  var args = [].slice.call(arguments),
      msg = args.pop(),
      method = args.shift();
  
  if (method)
    console.log(method + ' ' + msg);
  else
    console.log(msg);
};

Server.prototype.unsupportedMethod = function(req, res, method) {
  this.log(method, 'method is unsupported for url ' + req.url);
};

module.exports = function(opts) {
  var server = new Server(opts);
  
  require('http').createServer(function(req, res) {
    server.dispatch(req, res); 
  }).listen(opts.port);
};
