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


  describe('#s3_url', function() {
    it('generates the s3 url w/ bucket', function() {
      var aws3 = new Aws3('large.txt', 'text/plain');
      assert.equal(aws3.s3_url(), 'https://s3.amazonaws.com/aws3_bucket');
    });
  });

  it('can define these arguements', function() {
    var aws3 = new Aws3('large.txt', 'text/plain');
    assert.equal(aws3.file_name, 'large.txt');
    assert.equal(aws3.mime_type, 'text/plain');
    assert.equal(aws3.acl, 'private');
    assert.equal(aws3.path, '/');
    assert.equal(aws3.expire_in, 3600);

    aws3 = new Aws3('large.txt', 'text/plain', '/a/new/path', 'public', 7200);
    assert.equal(aws3.acl, 'public');
    assert.equal(aws3.path, '/a/new/path');
    assert.equal(aws3.expire_in, 7200);
  });

  it('expires in 60 minutes by default', function() {
    var aws3 = new Aws3('large.txt', 'text/plain');
    assert.equal(aws3.expires_in(), one_hour_from_now());
  });

  describe('#file_path', function() {
    it('returns the full file path', function() {
      var aws3 = new Aws3('large.txt', 'text/plain', '/a-unique-key');
      assert.equal(aws3.file_path(), 'a-unique-key/large.txt');
    });
  });

  describe('#url', function() {
    it('returns the generated url', function() {
      var aws3 = new Aws3('large.txt', 'text/plain', '/a-unique-key');
      assert.equal(aws3.url(), 'https://s3.amazonaws.com/aws3_bucket/a-unique-key/large.txt');
    });
  });

  describe('#bucket_file_path', function() {
    it('returns the full file path w/ bucket', function() {
      var aws3 = new Aws3('large.txt', 'text/plain', '/a-unique-key');
      assert.equal(aws3.bucket_file_path(), '/aws3_bucket/a-unique-key/large.txt');
    });
  });

  describe('#signed_url', function() {
    var aws3;

    function signature(str) {
      return crypto.createHmac('sha1', process.env.AWS_SECRET_ACCESS_KEY)
        .update(str)
        .digest('base64');
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

      assert.equal(aws3.signed_url('get'), url()+'&Signature='+signature(arr));
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

      assert.equal(aws3.signed_url('put'), url()+'&Signature='+signature(arr));
    });

    it('returns a signed delete request', function() {
      var arr = [
          'DELETE'
        , ''
        , ''
        , one_hour_from_now()
        , '/aws3_bucket/abcd/large.txt'
      ].join('\n');

      assert.equal(aws3.signed_url('delete'), url()+'&Signature='+signature(arr));
    });
  });
});
