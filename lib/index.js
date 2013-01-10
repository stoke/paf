var fs = require('fs'),
    path = require('path'),
    mime = require('./mime');

function Server(opts) {
  var self = this;

  this.path = path.resolve(opts.path);
  this.listing = opts.listing;
  this.quiet = opts.quiet;

  this.log('Listening on ' + opts.port);
}

Server.prototype.dispatch = function(req, res) {
  if (req.method !== 'GET') 
    return this.unsupportedMethod(req, res);

  if (!this.isSecure(req.url)) {
    this.log(req.method, 'rejected for url ' + req.url);
    
    return res.end(res.writeHead(500));
  }

  if (req.url === '/') 
    return this.manageDir(req, res);

  this.log(req.method, req.url);

  this.serve(req, res);
};

Server.prototype.unexistent = function(req, res) {
  res.writeHead(404);
  res.end(req.url + ' not found');
};

Server.prototype.serve = function(req, res) {
  var self = this,
      p = this.resolve(req.url);

  fs.exists(p, function(exist) {
    if (!exist) 
      return self.unexistent(req, res);

    fs.stat(p, function(e, stat) {
      if (e)
        return self.unexistent(req, res);

      if (stat.isDirectory())
        return self.manageDir(req, res);

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

Server.prototype.manageDir = function(req, res) {
  var self = this,
      p = this.resolve(req.url);
  
  fs.exists(p + '/index.html', function(e) {
    if (e) {
      res.writeHead(200, {'Content-Type': 'text/html'});
      return fs.createReadStream(path.join(p, 'index.html')).pipe(res);
    }
    
    if (!self.listing)
      return res.end('Permission denied');

    fs.readdir(p, function(e, files) {
      var html = '<html><head></head><body><div>'
      
      html += files.map(function(file) {
        return '<a href="' + path.join(req.url, file) + '">' + file + '</a><br />\n';
      }).join('');

      html += '</div></body></html>';

      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(html);
    });
  });
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
