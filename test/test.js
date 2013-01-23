var request = require('request'),
    expect = require('expect.js');

var pub = require('../'),
    middlewares = require('../lib/middlewares');

before(function() {
  pub({
  port: 8001,
    path: __dirname + '/public',
    listing: true,
    middlewares: [middlewares.index('index.html'), middlewares.listing]
  });
});

describe('server', function() {
  it('should answer requests correctly', function(done) {
    request('http://localhost:8001/test', function(req, res, body) {
      expect(body).to.be('nexgay');
      done();
    });
  });

  it('should return 404 if file doesn\'t exist', function(done) {
    request('http://localhost:8001/unexistent', function(req, res, body) {
      expect(res.statusCode).to.be(404);
      done();
    });
  });

  it('should use directory listing if it there isn\'t an index.html', function(done) {
    request('http://localhost:8001/windextest', function(req, res, body) {
      expect(body).to.contain('<html>');
      done();
    });
  });

  it('should use index.html if it\'s there', function(done) {
    request('http://localhost:8001/indextest', function(req, res, body) {
      expect(body).to.be('yagxen');
      done();
    });
  });
});
