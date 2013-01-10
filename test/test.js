var request = require('request'),
    expect = require('expect.js');

var pub = require('../');

before(function() {
  pub({
    port: 8000,
    path: __dirname + '/public',
    listing: true,
  });
});

describe('server', function() {
  it('should answer requests correctly', function(done) {
    request('http://localhost:8000/test', function(req, res, body) {
      expect(body).to.be('nexgay');
      done();
    });
  });

  it('should return 404 if file doesn\'t exist', function(done) {
    request('http://localhost:8000/unexistent', function(req, res, body) {
      expect(res.statusCode).to.be(404);
      done();
    });
  });

  it('should use directory listing if it there isn\'t an index.html', function(done) {
    request('http://localhost:8000/windextest', function(req, res, body) {
      expect(body).to.contain('<html>');
      done();
    });
  });

  it('should use index.html if it\'s there', function(done) {
    request('http://localhost:8000/indextest', function(req, res, body) {
      expect(body).to.be('yagxen');
      done();
    });
  });
});
