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

Server.prototype.parseRange = function(head, stat) {
  var parts = head.split('='),
      type  = parts.shift(),
      set = (parts.shift() || '').split(',').shift(), // paf only supports one range as of now
      opts = {stream: {}, headers: {}};

  opts.stream.start = 0;
  opts.stream.end = stat.size;
  
  if (!type || !set || type !== 'bytes')
    return opts;

  if (set[0] === '-') {
    opts.stream.start = stat.size + parseInt(set);
    
    opts.headers['Content-Range'] = 'bytes ' + opts.stream.start + '/' + stat.size;
    opts.headers['Content-Length'] = -parseInt(set);
  } else {
    set = set.split('-');

    opts.stream.start = set.shift();
    opts.stream.end   = set.shift();

    opts.headers['Content-Range'] = 'bytes ' + opts.stream.start + '-' + opts.stream.end + '/' + stat.size;
    opts.headers['Content-Length'] = opts.stream.end - opts.stream.start;
  }
  
  opts.stream.start = parseInt(opts.stream.start) || 0;
  opts.stream.end = parseInt(opts.stream.end) || stat.size;

  if (
    opts.stream.end > stat.size ||
    opts.stream.start > stat.size ||
    opts.stream.start > opts.stream.end
  ) {
    opts.stream.start = 0;
    opts.stream.end = stat.size;

    opts.headers['Content-Length'] = stat.size;
  }

  return opts;
};

Server.prototype.serve = function(req, res) {
  var self = this;
  
  this.fireMiddlewares(req, res, function(req, res) {
    var p = self.resolve(req.url);

    fs.stat(p, function(e, stat) {
      if (e || stat.isDirectory()) 
        return self.unexistent(req, res);
      
      var range = self.parseRange(req.headers.range || '', stat),
          headers = range.headers;
      
      headers['Content-Type'] = mime[path.extname(p).slice(1)] || 'application/octet-stream';
      headers['Content-Length'] = headers['Content-Length'] || stat.size;

      res.writeHead(200, headers);
      fs.createReadStream(p, range.stream).pipe(res);
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
