const should = require('should');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const { createInstrumenter } = require('istanbul-lib-instrument');
const libCoverage = require('istanbul-lib-coverage');

describe('Localization (jsdom)', () => {
  let window;
  const scriptPath = path.join(__dirname, 'localization.js');

  const supportedLanguages = ['en', 'cn', 'ct', 'de', 'es', 'fr', 'pt', 'ko'];
  const languageNames = {
    en: 'English',
    cn: 'Chinese (Simplified)',
    ct: 'Chinese (Traditional)',
    de: 'German',
    es: 'Spanish',
    fr: 'French',
    pt: 'Portuguese',
    ko: 'Korean',
  };

  before(() => {
    // Create a simulated browser environment
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      runScripts: 'dangerously',
    });
    window = dom.window;

    // Initialize coverage object in window
    window.__coverage__ = window.__coverage__ || {};

    // Read the original script
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');

    // Instrument the code for coverage tracking
    const instrumenter = createInstrumenter();
    const instrumentedCode = instrumenter.instrumentSync(
      scriptContent,
      scriptPath
    );

    // Execute the instrumented code in jsdom
    const scriptElement = window.document.createElement('script');
    scriptElement.textContent = instrumentedCode;
    window.document.body.appendChild(scriptElement);
  });

  after(() => {
    // Merge jsdom coverage data into the global coverage object
    if (window.__coverage__) {
      global.__coverage__ = global.__coverage__ || {};

      const coverageMap = libCoverage.createCoverageMap(global.__coverage__);
      coverageMap.merge(window.__coverage__);

      global.__coverage__ = coverageMap.toJSON();
    }
  });

  describe('language objects', () => {
    it('should define all 8 language objects', () => {
      should.exist(window.en);
      should.exist(window.cn);
      should.exist(window.ct);
      should.exist(window.de);
      should.exist(window.es);
      should.exist(window.fr);
      should.exist(window.pt);
      should.exist(window.ko);
    });

    it('all language objects should be objects', () => {
      should(window.en).be.an.Object();
      should(window.cn).be.an.Object();
      should(window.ct).be.an.Object();
      should(window.de).be.an.Object();
      should(window.es).be.an.Object();
      should(window.fr).be.an.Object();
      should(window.pt).be.an.Object();
      should(window.ko).be.an.Object();
    });
  });

  describe('langs container object', () => {
    it('should be defined', () => {
      should.exist(window.langs);
      should(window.langs).be.an.Object();
    });

    it('should include all supported languages', () => {
      supportedLanguages.forEach(lang => {
        should(window.langs).have.property(lang);
        should(window.langs[lang]).be.an.Object();
      });
    });

    it('should map to the correct language objects', () => {
      should(window.langs.en).equal(window.en);
      should(window.langs.cn).equal(window.cn);
      should(window.langs.ct).equal(window.ct);
      should(window.langs.de).equal(window.de);
      should(window.langs.es).equal(window.es);
      should(window.langs.fr).equal(window.fr);
      should(window.langs.pt).equal(window.pt);
      should(window.langs.ko).equal(window.ko);
    });
  });

  describe('translation key consistency', () => {
    const getKeys = (obj) => Object.keys(obj);

    it('all languages should have the same number of keys', () => {
      const enCount = getKeys(window.en).length;

      supportedLanguages.forEach(lang => {
        const langCount = getKeys(window.langs[lang]).length;
        should(langCount).equal(
          enCount,
          `${languageNames[lang]} has ${langCount} keys, expected ${enCount}`
        );
      });
    });

    it('all languages should have the exact same keys as English', () => {
      const enKeys = getKeys(window.en).sort();

      supportedLanguages.forEach(lang => {
        if (lang === 'en') return;

        const langObj = window.langs[lang];
        const langKeys = getKeys(langObj).sort();

        const missingKeys = enKeys.filter(key => !langKeys.includes(key));
        const extraKeys = langKeys.filter(key => !enKeys.includes(key));

        should(missingKeys).be.empty();
        should(extraKeys).be.empty();
      });
    });
  });

  describe('translation value validation', () => {
    const getKeys = (obj) => Object.keys(obj);

    it('all translations should be non-empty strings', () => {
      supportedLanguages.forEach(lang => {
        const langObj = window.langs[lang];
        const keys = getKeys(langObj);

        keys.forEach(key => {
          should(langObj[key]).be.a.String();
          should(langObj[key]).not.be.empty();
        });
      });
    });
  });

  describe('translation categories', () => {
    const getKeys = (obj) => Object.keys(obj);
    const categorizeKeys = (obj) => {
      const keys = getKeys(obj);
      return {
        costs: keys.filter(k => k.startsWith('costs_')),
        status: keys.filter(k => k.startsWith('status_')),
        warning: keys.filter(k => k.startsWith('warning_')),
        info: keys.filter(k => k.startsWith('info_')),
        end: keys.filter(k => k.startsWith('end_')),
        buttons: keys.filter(k => k.startsWith('buttons_')),
        login: keys.filter(k => k.startsWith('login_')),
      };
    };

    it('should have translations in all expected categories', () => {
      const categories = categorizeKeys(window.en);

      should(categories.costs.length).be.greaterThan(0, 'Should have cost translations');
      should(categories.status.length).be.greaterThan(0, 'Should have status translations');
      should(categories.warning.length).be.greaterThan(0, 'Should have warning translations');
      should(categories.info.length).be.greaterThan(0, 'Should have info translations');
      should(categories.end.length).be.greaterThan(0, 'Should have end-game translations');
      should(categories.buttons.length).be.greaterThan(0, 'Should have button translations');
      should(categories.login.length).be.greaterThan(0, 'Should have login translations');
    });

    it('all languages should have the same number of keys per category', () => {
      const enCategories = categorizeKeys(window.en);

      supportedLanguages.forEach(lang => {
        if (lang === 'en') return;

        const langCategories = categorizeKeys(window.langs[lang]);

        should(langCategories.costs.length).equal(
          enCategories.costs.length,
          `${languageNames[lang]} cost keys mismatch`
        );
        should(langCategories.status.length).equal(
          enCategories.status.length,
          `${languageNames[lang]} status keys mismatch`
        );
        should(langCategories.warning.length).equal(
          enCategories.warning.length,
          `${languageNames[lang]} warning keys mismatch`
        );
        should(langCategories.info.length).equal(
          enCategories.info.length,
          `${languageNames[lang]} info keys mismatch`
        );
        should(langCategories.end.length).equal(
          enCategories.end.length,
          `${languageNames[lang]} end keys mismatch`
        );
        should(langCategories.buttons.length).equal(
          enCategories.buttons.length,
          `${languageNames[lang]} button keys mismatch`
        );
        should(langCategories.login.length).equal(
          enCategories.login.length,
          `${languageNames[lang]} login keys mismatch`
        );
      });
    });
  });

  describe('required translation keys', () => {
    const requiredKeys = [
      'costs_fishValue',
      'costs_costCast',
      'costs_costSecond',
      'costs_costLeave',
      'status_wait',
      'status_season',
      'status_paused',
      'warning_seasonEnd',
      'warning_seasonStart',
      'info_you',
      'info_fishCaught',
      'info_profits',
      'buttons_goFishing',
      'buttons_goToSea',
      'buttons_castFish',
      'buttons_return',
      'login_title',
      'login_welcome',
      'end_over',
    ];

    it('all languages should have all required keys', () => {
      requiredKeys.forEach(key => {
        supportedLanguages.forEach(lang => {
          should(window.langs[lang]).have.property(key);
          should(window.langs[lang][key]).not.be.empty();
        });
      });
    });
  });

  describe('HTML content preservation', () => {
    const iconButtons = [
      'buttons_goToSea',
      'buttons_castFish',
      'buttons_return',
      'buttons_pause',
      'buttons_resume',
    ];

    it('English button translations should contain icon HTML', () => {
      iconButtons.forEach(key => {
        should(window.en[key]).match(/<i class="icon-/);
        should(window.en[key]).match(/<\/i>/);
      });
    });

    it('all language button translations should preserve icon HTML', () => {
      iconButtons.forEach(key => {
        supportedLanguages.forEach(lang => {
          should(window.langs[lang][key]).match(
            /<i class="icon-/,
            `${languageNames[lang]}: '${key}' should contain icon opening tag`
          );
          should(window.langs[lang][key]).match(
            /<\/i>/,
            `${languageNames[lang]}: '${key}' should contain icon closing tag`
          );
        });
      });
    });
  });

  describe('translation count', () => {
    it('should have a substantial number of translations', () => {
      const keyCount = Object.keys(window.en).length;
      should(keyCount).be.greaterThan(40, 'Should have more than 40 translation keys');
    });
  });

  describe('specific content validation', () => {
    it('fish-related translations should contain fish terminology', () => {
      const fishKeys = ['info_fishCaught', 'costs_fishValue'];

      fishKeys.forEach(key => {
        const enText = window.en[key].toLowerCase();
        should(enText).match(/fish/);
      });
    });

    it('status messages should be informative', () => {
      should(window.en['status_wait']).not.be.empty();
      should(window.en['status_season']).not.be.empty();
      should(window.en['status_paused']).not.be.empty();
    });

    it('warning messages should exist and be clear', () => {
      should(window.en['warning_seasonEnd']).not.be.empty();
      should(window.en['warning_seasonStart']).not.be.empty();
    });
  });
});
