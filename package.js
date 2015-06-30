Package.describe({
  name: 'planifica:file-encryption',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: '',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.1.0.2');

  api.use(['underscore', 'jparker:crypto-core', 'jparker:crypto-aes', 'reactive-var'], 'client');
  api.use('grigio:babel');

  api.addFiles('lzw.js', 'client', {isAsset: true});
  api.addFiles('crypto.js', 'client', {isAsset: true});
  api.addFiles('formatters.js', 'client', {isAsset: true});
  api.addFiles('CryptoJS/rollups/aes.js', 'client', {isAsset: true});
  api.addFiles('CryptoJS/rollups/hmac-sha1.js', 'client');
  api.addFiles('CryptoJS/rollups/sha1.js', 'client');
  api.addFiles('CryptoJS/components/hmac.js', 'client');
  api.addFiles('CryptoJS/components/sha1.js', 'client');

  api.addFiles('Utils.jsx', 'client');
  api.addFiles('BrowserDetect.js', 'client');

  api.addFiles('Encryptor.jsx', 'client');
  api.addFiles('Decryptor.jsx', 'client');

  api.export('Encryptor');
  api.export('Decryptor');

});
