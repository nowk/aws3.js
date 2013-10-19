/* jshint laxcomma: true */

var crypto      = require('crypto')
  ;

var awsAccessKey = process.env.AWS_ACCESS_KEY_ID
  , awsSecretKey = process.env.AWS_SECRET_ACCESS_KEY
  , s3Bucket     = process.env.S3_BUCKET || 'aws3_bucket'
  ;

var Aws3 = function(file_name, mime_type, acl, path) {
  this.awsAccessKey = awsAccessKey;
  this.awsSecretKey = awsSecretKey;
  this.s3Bucket     = s3Bucket;
  this.file_name    = file_name;
  this.mime_type    = mime_type;
  this.acl          = acl || 'private';
  this.path         = path || '/';

  this.get_request = function() {
    return ['GET', '', '', this.expires_in(), this.bucket_file_path()].join('\n').toString('utf-8');
  };

  this.put_request = function() {
    return ['PUT', '', this.mime_type, this.expires_in(), this.bucket_file_path()].join('\n').toString('utf-8');
  };

  this.del_request = function() {
    return ['DELETE', '', '', this.expires_in(), this.bucket_file_path()].join('\n').toString('utf-8');
  };

  this.sig = function(method) {
    return crypto.createHmac('sha1', this.awsSecretKey).update(this[method+'_request']()).digest('base64');
  };

  this.generate_signed_request = function(method) {
    return [this.url(), this.key_and_expires_params()+'&Signature='+this.sig(method)].join('?');
  };

  this.key_and_expires_params = function() {
    return 'AWSAccessKeyId='+this.awsAccessKey+'&Expires='+this.expires_in();
  };
};

Aws3.base_url = 'https://s3.amazonaws.com/'+s3Bucket;

Aws3.prototype.file_path = function() {
  return (this.path.replace(/\/$/, '')+'/'+this.file_name).replace(/^\//, '');
};

Aws3.prototype.bucket_file_path = function() {
  return '/'+this.s3Bucket+'/'+this.file_path();
};

Aws3.prototype.url = function() {
  return Aws3.base_url+'/'+this.file_path();
};

Aws3.prototype.expires_in = function() {
  var now = Math.round(new Date().getTime() / 1000);
  if (typeof this._expires_in === 'undefined') {
    this._expires_in = now+3600;
  }
  return this._expires_in;
};


Aws3.prototype.signed_get_request = function() {
  return this.generate_signed_request('get');
};

Aws3.prototype.signed_put_request = function() {
  return this.generate_signed_request('put');
};

Aws3.prototype.signed_del_request = function() {
  return this.generate_signed_request('del');
};


module.exports = exports = Aws3;
