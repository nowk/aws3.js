/* jshint laxcomma: true */

module.exports = exports = Aws3;


var crypto = require('crypto')
  ;


Aws3.awsAccessKey = process.env.AWS_ACCESS_KEY_ID;
Aws3.awsSecretKey = process.env.AWS_SECRET_ACCESS_KEY;
Aws3.s3Bucket     = process.env.S3_BUCKET || 'aws3_bucket';
Aws3.awsRegion    = process.env.AWS_REGION || 'us-east-1';


/*
 * var aws3      = new Aws3('file.txt', 'text/plain', 'a/unique/optional/path');
 * var getUrl    = aws3.signedUrl('get');    // Public or private s3 url
 * var putUrl    = aws3.signedUrl('put');    // Signed url for CORS put
 * var deleteUrl = aws3.signedUrl('delete'); // Signed url for CORS delete
 *
 */

function Aws3(filename, mimetype, path, acl, expirein) {
  this.filename = filename;
  this.mimetype = mimetype;
  this.acl      = acl || 'private';
  this.path     = path || '/';
  this.expirein = expirein || 3600;

  this.asattachment = false; // must be explicitly set eg. aws3.asattachment = true;
}


/*
 * @api private
 */

Aws3.prototype.attachable = function(method, delimiter) {
  if (method === 'get' && this.asattachment) {
    return delimiter+'response-content-disposition=attachment';
  }
  return '';
};


/*
 * @api private
 */

Aws3.prototype.generateSignedRequest = function(method) {
  var signature = encodeURIComponent(this.signature(method));
  return [this.fileUrl(), this.keyAndExpiresParams()+'&Signature='+signature+this.attachable(method, '&')].join('?');
};


/*
 * @api private
 */

Aws3.prototype.payload = function(method) {
  var arr = [
      method.toUpperCase()
    , ''
    , (method==='put' ? this.mimetype : '')
    , this.expiresIn()
    , this.bucketFilePath()+this.attachable(method, '?')
  ];
  if (method === 'put') arr.splice(4, 0, this.amzAclHeader());
  return arr.join('\n').toString('utf-8');
};


/*
 * @api private
 */

Aws3.prototype.amzAclHeader = function() {
  return 'x-amz-acl:'+this.acl;
};


/*
 * @api private
 */

Aws3.prototype.signature = function(method) {
  return crypto.createHmac('sha1', Aws3.awsSecretKey).update(this.payload(method)).digest('base64');
};


/*
 * @api private
 */

Aws3.prototype.keyAndExpiresParams = function() {
  return 'AWSAccessKeyId='+Aws3.awsAccessKey+'&Expires='+this.expiresIn();
};


/*
 * @api private
 */

Aws3.prototype.regionExtension = function() {
  if (Aws3.awsRegion !== 'us-east-1') {
    return '-'+Aws3.awsRegion;
  }
  return '';
};


/*
 * @api private
 */

Aws3.prototype.subdomain = function() {
  return 's3'+this.regionExtension();
};


/*
 * @api private
 */

Aws3.prototype.s3Url = function() {
  return 'https://'+this.subdomain()+'.amazonaws.com/'+Aws3.s3Bucket;
};


/*
 * @api private
 */

Aws3.prototype.bucketFilePath = function() {
  return '/'+Aws3.s3Bucket+'/'+this.filePath();
};


/*
 * @api public
 */

Aws3.prototype.filePath = function() {
  return (this.path.replace(/\/$/, '')+'/'+encodeURIComponent(this.filename)).replace(/^\//, '');
};


/*
 * @api public
 */

Aws3.prototype.fileUrl = function() {
  return this.s3Url()+'/'+this.filePath();
};


/*
 * @api public
 */

Aws3.prototype.expiresIn = function() {
  var now = Math.round(new Date().getTime() / 1000);
  if (typeof this._expiresIn === 'undefined') this._expiresIn = now+this.expirein;
  return this._expiresIn;
};


/*
 * @api public
 */

Aws3.prototype.signedUrl = function(method) {
  return this.generateSignedRequest(method);
};

