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


  it('generates a base_url using the s3Bucket', function() {
    var aws3 = new Aws3('large.txt', 'text/plain');
    assert.equal(aws3.base_url(), 'https://s3.amazonaws.com/aws3_bucket');
  });

  it('can define these arguements', function() {
    var aws3 = new Aws3('large.txt', 'text/plain');
    assert.equal(aws3.file_name, 'large.txt');
    assert.equal(aws3.mime_type, 'text/plain');
    assert.equal(aws3.acl, 'private');
    assert.equal(aws3.path, '/');

    aws3 = new Aws3('large.txt', 'text/plain', 'public', '/a/new/path');
    assert.equal(aws3.acl, 'public');
    assert.equal(aws3.path, '/a/new/path');
  });

  it('expires in 60 minutes by default', function() {
    var aws3 = new Aws3('large.txt', 'text/plain');
    assert.equal(aws3.expires_in(), one_hour_from_now());
  });

  describe('#file_path', function() {
    it('returns the generated file_path', function() {
      var aws3 = new Aws3('large.txt', 'text/plain', null, '/generated-unique-key');
      assert.equal(aws3.file_path(), 'generated-unique-key/large.txt');
    });
  });

  describe('#url', function() {
    it('returns the generated url', function() {
      var aws3 = new Aws3('large.txt', 'text/plain', null, '/generated-unique-key');
      assert.equal(aws3.url(), 'https://s3.amazonaws.com/aws3_bucket/generated-unique-key/large.txt');
    });
  });

  describe('#bucket_file_path', function() {
    it('returns the full file path w/ bucket', function() {
      var aws3 = new Aws3('large.txt', 'text/plain', null, '/generated-unique-key');
      assert.equal(aws3.bucket_file_path(), '/aws3_bucket/generated-unique-key/large.txt');
    });
  });

  describe('signed requests', function() {
    var aws3 = new Aws3('large.txt', 'text/plain', null, '/abcd/');

    function signature(str) {
      return crypto.createHmac('sha1', process.env.AWS_SECRET_ACCESS_KEY)
        .update(str)
        .digest('base64');
    }

    describe('#signed_url', function() {
      it('returns a signed get request', function() {
        var arr = ['GET', '', '', one_hour_from_now(), '/aws3_bucket/abcd/large.txt'].join('\n');
        assert.equal(aws3.req_string('get'), arr);
        assert.equal(aws3.signed_url('get'), 
                     aws3.url()+'?'+aws3.key_and_expires_params()+'&Signature='+signature(arr));
      });

      it('returns a signed put request', function() {
        var arr = ['PUT', '', 'text/plain', one_hour_from_now(), 'x-amz-acl:private', '/aws3_bucket/abcd/large.txt'].join('\n');
        assert.equal(aws3.req_string('put'), arr);
        assert.equal(aws3.signed_url('put'), 
                     aws3.url()+'?'+aws3.key_and_expires_params()+'&Signature='+signature(arr));
      });

      it('returns a signed delete request', function() {
        var arr = ['DELETE', '', '', one_hour_from_now(), '/aws3_bucket/abcd/large.txt'].join('\n');
        assert.equal(aws3.req_string('delete'), arr);
        assert.equal(aws3.signed_url('delete'), 
                     aws3.url()+'?'+aws3.key_and_expires_params()+'&Signature='+signature(arr));
      });
    });
  });
});
