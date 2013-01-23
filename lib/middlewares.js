var fs = require('fs'),
    path = require('path');

var middlewares = exports;

middlewares.index = function(idx) {
  return function(req, res, next) {
    var self = this,
        p = this.resolve(req.url);

    fs.stat(p, function(e, stat) {
      if (e || !stat.isDirectory())
        return next(req, res);
      
      fs.exists(path.join(p, idx), function(e) {
        if (e)
          req.url = path.join(req.url, idx);


        next(req, res);
      });
    });
  };
};

function authorized(username, password, authorization) {
  if (!authorization)
    return false;

  var auth = authorization.split(' '),
      access = new Buffer(auth.pop(), 'base64').toString().split(':');

  var u = access.shift();
  var p = access.join('');

  return username === u && password === p;
}

middlewares.auth = function(username, password) {
  var self = this;

  return function(req, res, next) {
    if (!authorized(username, password, req.headers.authorization)) 
      return this.unauthorized(req, res, {'WWW-Authenticate': 'Basic realm="You shall not pass!"'});

    next(req, res);
  };
};

middlewares.listing = function(req, res, next) {
  var self = this,
      p = this.resolve(req.url);
 
  fs.stat(p, function(e, stat) {
    if (e || !stat.isDirectory())
      return next(req, res);
    
    fs.readdir(p, function(e, files) {
      var html = '<html><body>';
      
      html += files.map(function(file) {
        return '<a href="' + path.join(req.url, file) + '">' + file.replace(/>/, '&gt;').replace(/</, '&lt;') + '</a><br />\n';
      }).join('') + '</body></html>';

      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(html);
    });
  });
};
