/* jshint laxcomma: true */

var Aws3        = require('../aws3')
  , assert      = require('assert')
  , sinon       = require('sinon')
  , crypto      = require('crypto')
  ;


describe('Aws3', function() {
  var clock;

  function one_hour_from_now() {
    return Math.round(new Date().getTime() / 1000)+3600;
  }

  beforeEach(function() {
    clock = sinon.useFakeTimers();
    clock.tick(100);
  });

  afterEach(function() {
    clock.restore();
  });


  describe('#s3Url', function() {
    it('generates the s3 url w/ bucket', function() {
      var aws3 = new Aws3('large.txt', 'text/plain');
      assert.equal(aws3.s3Url(), 'https://s3.amazonaws.com/aws3_bucket');
    });
  });

  it('can define these arguements', function() {
    var aws3 = new Aws3('large.txt', 'text/plain');
    assert.equal(aws3.filename, 'large.txt');
    assert.equal(aws3.mimetype, 'text/plain');
    assert.equal(aws3.acl, 'private');
    assert.equal(aws3.path, '/');
    assert.equal(aws3.expirein, 3600);

    aws3 = new Aws3('large.txt', 'text/plain', '/a/new/path', 'public', 7200);
    assert.equal(aws3.acl, 'public');
    assert.equal(aws3.path, '/a/new/path');
    assert.equal(aws3.expirein, 7200);
  });

  it('expires in 60 minutes by default', function() {
    var aws3 = new Aws3('large.txt', 'text/plain');
    assert.equal(aws3.expiresIn(), one_hour_from_now());
  });

  describe('#filePath', function() {
    it('returns the full file path', function() {
      var aws3 = new Aws3('large.txt', 'text/plain', '/a-unique-key');
      assert.equal(aws3.filePath(), 'a-unique-key/large.txt');
    });
  });

  describe('#fileUrl', function() {
    it('returns the generated url', function() {
      var aws3 = new Aws3('large.txt', 'text/plain', '/a-unique-key');
      assert.equal(aws3.fileUrl(), 'https://s3.amazonaws.com/aws3_bucket/a-unique-key/large.txt');
    });
  });

  describe('#bucketFilePath', function() {
    it('returns the full file path w/ bucket', function() {
      var aws3 = new Aws3('large.txt', 'text/plain', '/a-unique-key');
      assert.equal(aws3.bucketFilePath(), '/aws3_bucket/a-unique-key/large.txt');
    });
  });

  describe('#signedUrl', function() {
    var aws3;

    function signature(str) {
      return encodeURIComponent(crypto.createHmac('sha1', process.env.AWS_SECRET_ACCESS_KEY)
        .update(str)
        .digest('base64'));
    }

    function url() {
      return 'https://s3.amazonaws.com/aws3_bucket/abcd/large.txt?AWSAccessKeyId='+
        process.env.AWS_ACCESS_KEY_ID+'&Expires='+one_hour_from_now();
    }

    beforeEach(function() {
      aws3 = new Aws3('large.txt', 'text/plain', '/abcd/');
    });

    it('returns a signed get request', function() {
      var arr = [
          'GET'
        , ''
        , ''
        , one_hour_from_now()
        , '/aws3_bucket/abcd/large.txt'
      ].join('\n');

      assert.equal(aws3.signedUrl('get'), url()+'&Signature='+signature(arr));
    });

    it('can return a signed get request to download as an attachment', function() {
      aws3.asattachment = true;

      var arr = [
          'GET'
        , ''
        , ''
        , one_hour_from_now()
        , '/aws3_bucket/abcd/large.txt?response-content-disposition=attachment'
      ].join('\n');

      assert.equal(aws3.signedUrl('get'), url()+'&Signature='+signature(arr)+'&response-content-disposition=attachment');
    });

    it('returns a signed put request', function() {
      var arr = [
          'PUT'
        , ''
        , 'text/plain'
        , one_hour_from_now()
        , 'x-amz-acl:private'
        , '/aws3_bucket/abcd/large.txt'
      ].join('\n');

      assert.equal(aws3.signedUrl('put'), url()+'&Signature='+signature(arr));
    });

    it('returns a signed delete request', function() {
      var arr = [
          'DELETE'
        , ''
        , ''
        , one_hour_from_now()
        , '/aws3_bucket/abcd/large.txt'
      ].join('\n');

      assert.equal(aws3.signedUrl('delete'), url()+'&Signature='+signature(arr));
    });
  });
});
