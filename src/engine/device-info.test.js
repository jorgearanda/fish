'use strict';

var should = require('should');

var buildDeviceRecord = require('./device-info').buildDeviceRecord;

describe('Engine - Device info', function() {
  function record(userAgent, extra) {
    return buildDeviceRecord('p001', Object.assign({ userAgent: userAgent }, extra || {}));
  }

  it('should parse an Android phone with the model in the user agent', function() {
    var d = record('Mozilla/5.0 (Linux; Android 9; SM-A105F) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36');
    d.os.should.equal('Android');
    d.osVersion.should.equal('9');
    d.browser.should.equal('Chrome');
    d.browserVersion.should.equal('90.0.4430.91');
    d.model.should.equal('SM-A105F');
    d.brand.should.equal('Samsung');
    d.inAppBrowser.should.equal('');
  });

  it('should treat Chrome\'s hidden model "K" as unknown', function() {
    var d = record('Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36');
    d.model.should.equal('');
    d.brand.should.equal('');
  });

  it('should prefer Client Hints for model and Android version', function() {
    var d = record('Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
      { hintModel: 'TECNO KG5', hintPlatformVersion: '13.0.0' });
    d.model.should.equal('TECNO KG5');
    d.brand.should.equal('Tecno');
    d.osVersion.should.equal('13.0.0');
  });

  it('should strip the Build suffix and detect the Android in-app browser', function() {
    var d = record('Mozilla/5.0 (Linux; Android 11; Infinix X6812 Build/RP1A.200720.011; wv) ' +
      'AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/119.0 Mobile Safari/537.36');
    d.model.should.equal('Infinix X6812');
    d.brand.should.equal('Infinix');
    d.inAppBrowser.should.equal('Android app (unknown)');
  });

  it('should detect named in-app browsers', function() {
    record('Mozilla/5.0 (Linux; Android 12; SM-A125F) AppleWebKit/537.36 Chrome/120.0 ' +
      'Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/440.0;]').inAppBrowser.should.equal('Facebook');
    record('Mozilla/5.0 (Linux; Android 12; SM-A125F) AppleWebKit/537.36 Chrome/120.0 ' +
      'Mobile Safari/537.36 WhatsApp/2.24').inAppBrowser.should.equal('WhatsApp');
    record('Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 ' +
      '(KHTML, like Gecko) Mobile/15E148 Instagram 320.0').inAppBrowser.should.equal('Instagram');
  });

  it('should parse iPhone Safari, taking the iOS major version from Safari\'s', function() {
    // Real device: iOS 26.7.1 reports a frozen "OS 18_7" and Safari 26.6.2
    var d = record('Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 ' +
      '(KHTML, like Gecko) Version/26.6.2 Mobile/15E148 Safari/604.1');
    d.os.should.equal('iOS');
    d.osVersion.should.equal('26');
    d.browserVersion.should.equal('26.6.2');
  });

  it('should leave the iOS version blank for other iPhone browsers', function() {
    var d = record('Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 ' +
      '(KHTML, like Gecko) FxiOS/157.0 Mobile/15E148 Safari/605.1.15');
    d.os.should.equal('iOS');
    d.osVersion.should.equal('');
    d.browser.should.equal('Firefox');
  });

  it('should parse iPhone Safari details', function() {
    var d = record('Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 ' +
      '(KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1');
    d.os.should.equal('iOS');
    d.osVersion.should.equal('17');
    d.browser.should.equal('Safari');
    d.browserVersion.should.equal('17.4');
    d.model.should.equal('iPhone');
    d.brand.should.equal('Apple');
    d.inAppBrowser.should.equal('');
  });

  it('should flag an unnamed iPhone in-app browser', function() {
    record('Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 ' +
      '(KHTML, like Gecko) Mobile/15E148').inAppBrowser.should.equal('iOS app (unknown)');
  });

  it('should recognise browsers that matter for FISH', function() {
    record('Opera/9.80 (Android; Opera Mini/36.2.2254/119.132; U; id) Presto/2.12.423 Version/12.16')
      .browser.should.equal('Opera Mini');
    record('Mozilla/5.0 (Linux; Android 13; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) ' +
      'SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36').browser.should.equal('Samsung Internet');
    record('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
      'Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0').browser.should.equal('Edge');
    record('Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:125.0) Gecko/20100101 Firefox/125.0')
      .browser.should.equal('Firefox');
  });

  it('should parse desktop operating systems', function() {
    var d = record('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
    d.os.should.equal('Windows');
    d.osVersion.should.equal('10.0');
    d.model.should.equal('');
    var mac = record('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) ' +
      'Version/27.0 Safari/605.1.15');
    mac.os.should.equal('macOS');
    mac.osVersion.should.equal(''); // frozen at 10.15.7 by every Mac browser
  });

  it('should keep screen details and the raw user agent', function() {
    var ua = 'Mozilla/5.0 (Linux; Android 10; K) Chrome/124.0 Mobile Safari/537.36';
    var d = record(ua, {
      deviceClass: 'phone', touch: true, screenWidth: 393, screenHeight: 873,
      viewportWidth: 393, viewportHeight: 760, pixelRatio: 2.75, language: 'pt-BR',
    });
    d.participant.should.equal('p001');
    d.deviceClass.should.equal('phone');
    d.touch.should.equal(true);
    d.screenWidth.should.equal(393);
    d.screenHeight.should.equal(873);
    d.pixelRatio.should.equal(2.75);
    d.language.should.equal('pt-BR');
    d.userAgent.should.equal(ua);
    d.recordedAt.should.be.instanceOf(Date);
  });

  it('should reject malformed input from the client', function() {
    var d = buildDeviceRecord('p001', {
      userAgent: 'x'.repeat(2000),
      deviceClass: 'toaster',
      touch: 'yes',
      screenWidth: 'wide',
      screenHeight: -5,
      hintModel: { evil: true },
    });
    d.userAgent.length.should.equal(512);
    d.deviceClass.should.equal('');
    d.touch.should.equal(false);
    should(d.screenWidth).be.null();
    should(d.screenHeight).be.null();
    d.model.should.equal('');
  });

  it('should cope with no information at all', function() {
    var d = buildDeviceRecord('p001', undefined);
    d.os.should.equal('Other');
    d.browser.should.equal('Other');
    d.userAgent.should.equal('');
  });
});
