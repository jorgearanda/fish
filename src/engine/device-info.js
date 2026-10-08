'use strict';

// Builds the device record saved with each run from what the participant's
// browser reports. Browsers don't reliably expose brand and model: iPhones only
// say "iPhone", and Android Chrome hides the model ("K") and freezes the Android
// version at 10 in its user agent unless Client Hints provide them. The raw user
// agent is always kept so the data can be re-parsed later.

var MAX_STRING = 512;
var DEVICE_CLASSES = ['phone', 'small tablet', 'large tablet', 'desktop'];

// Model prefix → brand, for common Android phones; matched case-insensitively
var BRAND_PREFIXES = [
  [/^(SM-|GT-|SAMSUNG|Galaxy)/i, 'Samsung'],
  [/^TECNO/i, 'Tecno'],
  [/^Infinix/i, 'Infinix'],
  [/^itel/i, 'itel'],
  [/^(Redmi|POCO|Mi |MI |Xiaomi)/i, 'Xiaomi'],
  [/^(moto|Motorola|XT\d)/i, 'Motorola'],
  [/^Nokia/i, 'Nokia'],
  [/^Pixel/i, 'Google'],
  [/^(HUAWEI|HONOR)/i, 'Huawei'],
  [/^(CPH|OPPO)/i, 'Oppo'],
  [/^(RMX|realme)/i, 'Realme'],
  [/^vivo/i, 'vivo'],
  [/^(LM-|LG)/i, 'LG'],
  [/^(iPhone|iPad)/, 'Apple'],
];

function cleanString(value) {
  if (typeof value !== 'string') return '';
  return value.slice(0, MAX_STRING).trim();
}

function cleanNumber(value) {
  var n = Number(value);
  return isFinite(n) && n >= 0 && n < 100000 ? n : null;
}

function match(ua, re) {
  var m = ua.match(re);
  return m ? m[1] : '';
}

function parseInAppBrowser(ua) {
  if (/FBAN|FBAV|FB_IAB/.test(ua)) return 'Facebook';
  if (/Instagram/.test(ua)) return 'Instagram';
  if (/WhatsApp/.test(ua)) return 'WhatsApp';
  if (/Telegram/.test(ua)) return 'Telegram';
  if (/\bLine\//.test(ua)) return 'LINE';
  if (/; wv\)/.test(ua)) return 'Android app (unknown)';
  // iPhone/iPad browsers all mention Safari, except pages shown inside an app
  if (/(iPhone|iPad|iPod)/.test(ua) && !/Safari\//.test(ua)) return 'iOS app (unknown)';
  return '';
}

function parseBrowser(ua) {
  var rules = [
    ['Opera Mini', /Opera Mini\/([\d.]+)/],
    ['Opera Mini', /OPiOS\/([\d.]+)/],
    ['Samsung Internet', /SamsungBrowser\/([\d.]+)/],
    ['Edge', /Edg(?:e|A|iOS)?\/([\d.]+)/],
    ['Opera', /OPR\/([\d.]+)/],
    ['Firefox', /(?:Firefox|FxiOS)\/([\d.]+)/],
    ['Chrome', /(?:Chrome|CriOS)\/([\d.]+)/],
    ['Safari', /Version\/([\d.]+).*Safari\//],
  ];
  for (var i = 0; i < rules.length; i++) {
    if (rules[i][1].test(ua)) return { name: rules[i][0], version: match(ua, rules[i][1]) };
  }
  return { name: 'Other', version: '' };
}

function parseOs(ua) {
  if (/Android/.test(ua)) return { name: 'Android', version: match(ua, /Android ([\d.]+)/) };
  // Apple freezes the OS version in the user agent (iOS at 18.x since iOS 26,
  // macOS at 10.15.7), so it is left blank here; see buildDeviceRecord for iOS
  if (/(iPhone|iPad|iPod)/.test(ua)) return { name: 'iOS', version: '' };
  if (/CrOS/.test(ua)) return { name: 'ChromeOS', version: '' };
  if (/Windows NT/.test(ua)) return { name: 'Windows', version: match(ua, /Windows NT ([\d.]+)/) };
  if (/Mac OS X/.test(ua)) return { name: 'macOS', version: '' };
  if (/Linux/.test(ua)) return { name: 'Linux', version: '' };
  return { name: 'Other', version: '' };
}

function parseModel(ua) {
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';
  var model = match(ua, /Android [\d.]*;\s*([^;)]+)/).replace(/\s*Build\/.*$/, '').trim();
  // "K" is the placeholder Chrome uses when it hides the model
  return model === 'K' ? '' : model;
}

function brandOf(model) {
  for (var i = 0; i < BRAND_PREFIXES.length; i++) {
    if (BRAND_PREFIXES[i][0].test(model)) return BRAND_PREFIXES[i][1];
  }
  return '';
}

// raw: the object sent by the client (fish.js collectDeviceInfo); untrusted
exports.buildDeviceRecord = function(participant, raw) {
  raw = raw || {};
  var ua = cleanString(raw.userAgent);
  var browser = parseBrowser(ua);
  var os = parseOs(ua);

  // Client Hints, when present, are more accurate than the frozen user agent
  var model = cleanString(raw.hintModel) || parseModel(ua);
  var osVersion = os.name === 'Android' && cleanString(raw.hintPlatformVersion) ?
    cleanString(raw.hintPlatformVersion) : os.version;
  // Safari's major version matches the iOS major version (not the point
  // release); other iPhone browsers give no usable iOS version
  if (os.name === 'iOS' && browser.name === 'Safari' && browser.version) {
    osVersion = browser.version.split('.')[0];
  }

  var deviceClass = cleanString(raw.deviceClass);
  if (DEVICE_CLASSES.indexOf(deviceClass) === -1) deviceClass = '';

  return {
    participant: participant,
    deviceClass: deviceClass,
    brand: brandOf(model),
    model: model,
    os: os.name,
    osVersion: osVersion,
    browser: browser.name,
    browserVersion: browser.version,
    inAppBrowser: parseInAppBrowser(ua),
    touch: raw.touch === true,
    screenWidth: cleanNumber(raw.screenWidth),
    screenHeight: cleanNumber(raw.screenHeight),
    viewportWidth: cleanNumber(raw.viewportWidth),
    viewportHeight: cleanNumber(raw.viewportHeight),
    pixelRatio: cleanNumber(raw.pixelRatio),
    language: cleanString(raw.language),
    userAgent: ua,
    recordedAt: new Date(),
  };
};
