/* jshint laxcomma: true */

module.exports = exports = Aws3;


var crypto = require('crypto')
  ;


Aws3.awsAccessKey = process.env.AWS_ACCESS_KEY_ID;
Aws3.awsSecretKey = process.env.AWS_SECRET_ACCESS_KEY;
Aws3.s3Bucket     = process.env.S3_BUCKET || 'aws3_bucket';

function Aws3(file_name, mime_type, path, acl, expire_in) {
  this.file_name = file_name;
  this.mime_type = mime_type;
  this.acl       = acl || 'private';
  this.path      = path || '/';
  this.expire_in = expire_in || 3600;


  this.s3_url = function() {
    return 'https://s3.amazonaws.com/'+Aws3.s3Bucket;
  };

  this.bucket_file_path = function() {
    return '/'+Aws3.s3Bucket+'/'+this.file_path();
  };


  this.generate_signed_request = function(method) {
    return [
        this.url()
      , key_and_expires_params()+'&Signature='+signature(method)
    ].join('?');
  };


  var self = this;

  var amzaclheader = function() {
    return 'x-amz-acl:'+self.acl;
  };

  var payload = function(method) {
    var arr = [
        method.toUpperCase()
      , ''
      , (method==='put' ? self.mime_type : '')
      , self.expires_in()
      , self.bucket_file_path()
    ];

    if (method === 'put') arr.splice(4, 0, amzaclheader());

    return arr.join('\n').toString('utf-8');
  };

  var signature = function(method) {
    return crypto
      .createHmac('sha1', Aws3.awsSecretKey)
      .update(payload(method))
      .digest('base64');
  };

  var key_and_expires_params = function() {
    return 'AWSAccessKeyId='+Aws3.awsAccessKey+'&Expires='+self.expires_in();
  };
}


Aws3.prototype.file_path = function() {
  return (this.path.replace(/\/$/, '')+'/'+this.file_name).replace(/^\//, '');
};

Aws3.prototype.url = function() {
  return this.s3_url()+'/'+this.file_path();
};

Aws3.prototype.expires_in = function() {
  var now = Math.round(new Date().getTime() / 1000);
  if (typeof this._expires_in === 'undefined') this._expires_in = now+this.expire_in;
  return this._expires_in;
};

Aws3.prototype.signed_url = function(method) {
  return this.generate_signed_request(method);
};

