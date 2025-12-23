const should = require('should');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const { createInstrumenter } = require('istanbul-lib-instrument');
const libCoverage = require('istanbul-lib-coverage');

describe('Fish (jsdom)', () => {
  let window, document, $;
  const scriptPath = path.join(__dirname, 'fish.js');

  before(() => {
    // Create a simulated browser environment with necessary HTML structure
    const dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head></head>
        <body>
          <div id="catch-intent-header"></div>
          <div id="catch-intent-th"></div>
          <div id="catch-intent-dialog-box"></div>
          <input id="catch-intent-input" />
          <button id="catch-intent-submit"></button>
          <div id="catch-intent-prompt1"></div>
          <div id="catch-intent-prompt2"></div>
          <div id="f0-catch-intent"></div>
          <div id="f1-catch-intent"></div>
          <div id="f2-catch-intent"></div>
          <canvas id="ocean-canvas"></canvas>
          <div id="status"></div>
          <div id="warning"></div>
        </body>
      </html>
    `, {
      runScripts: 'dangerously',
      resources: 'usable',
      url: 'http://localhost:8080/fish?mwid=123&pid=456&lang=en'
    });

    window = dom.window;
    document = window.document;

    // Initialize coverage object in window
    window.__coverage__ = window.__coverage__ || {};

    // Mock jQuery - basic implementation for testing
    const jQuery = function(selector) {
      if (typeof selector === 'string') {
        const element = document.querySelector(selector);
        return {
          text: function(val) {
            if (val !== undefined) {
              if (element) element.textContent = val;
              return this;
            }
            return element ? element.textContent : '';
          },
          val: function(val) {
            if (val !== undefined) {
              if (element) element.value = val;
              return this;
            }
            return element ? element.value : '';
          },
          show: function() {
            if (element) element.style.display = '';
            return this;
          },
          hide: function() {
            if (element) element.style.display = 'none';
            return this;
          },
          on: function(event, handler) {
            if (element) element.addEventListener(event, handler);
            return this;
          },
          trigger: function(event) {
            if (element) {
              const evt = new window.Event(event);
              element.dispatchEvent(evt);
            }
            return this;
          }
        };
      }
      return {};
    };

    // Add url() method for query parameters
    jQuery.url = function() {
      return {
        param: function(name) {
          const params = {
            mwid: '123',
            pid: '456',
            lang: 'en'
          };
          return params[name];
        }
      };
    };

    window.$ = jQuery;

    // Mock Socket.IO
    const mockSocket = {
      emit: function() {},
      on: function() { return this; },
      connect: function() { return this; }
    };
    window.io = {
      connect: function() { return mockSocket; }
    };

    // Mock langs object (simplified version)
    window.langs = {
      en: {
        info_intent: 'Intended Catch',
        status_wait: 'Waiting',
        status_season: 'Season',
        costs_fishValue: 'Fish Value',
        buttons_goToSea: 'Go to Sea'
      },
      es: {
        info_intent: 'Captura Prevista',
        status_wait: 'Esperando',
        status_season: 'Temporada',
        costs_fishValue: 'Valor del Pescado',
        buttons_goToSea: 'Ir al Mar'
      }
    };

    // Mock Image constructor
    window.Image = function() {
      return {
        src: '',
        width: 100,
        height: 100
      };
    };

    // Read and instrument the fish.js code
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');
    const instrumenter = createInstrumenter();
    const instrumentedCode = instrumenter.instrumentSync(scriptContent, scriptPath);

    // Execute the instrumented code
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

  describe('Utility Functions', () => {
    describe('escapeRegExp()', () => {
      it('should escape special regex characters', () => {
        window.escapeRegExp('test.string').should.equal('test\\.string');
        window.escapeRegExp('test*string').should.equal('test\\*string');
        window.escapeRegExp('test+string').should.equal('test\\+string');
        window.escapeRegExp('test?string').should.equal('test\\?string');
        window.escapeRegExp('test^string').should.equal('test\\^string');
        window.escapeRegExp('test$string').should.equal('test\\$string');
        window.escapeRegExp('test{string}').should.equal('test\\{string\\}');
        window.escapeRegExp('test(string)').should.equal('test\\(string\\)');
        window.escapeRegExp('test|string').should.equal('test\\|string');
        window.escapeRegExp('test[string]').should.equal('test\\[string\\]');
        window.escapeRegExp('test\\string').should.equal('test\\\\string');
      });

      it('should handle empty string', () => {
        window.escapeRegExp('').should.equal('');
      });

      it('should handle string with no special characters', () => {
        window.escapeRegExp('teststring').should.equal('teststring');
      });
    });

    describe('escapeReplacement()', () => {
      it('should escape dollar signs in replacement strings', () => {
        // In regex replacement strings, $$ means literal $, so $$$$ means $$
        // This function converts $ to $$ for use in replacements
        window.escapeReplacement('test$string').should.equal('test$$string');
        window.escapeReplacement('$$').should.equal('$$$$');
      });

      it('should handle empty string', () => {
        window.escapeReplacement('').should.equal('');
      });

      it('should handle string with no dollar signs', () => {
        window.escapeReplacement('teststring').should.equal('teststring');
      });
    });

    describe('substituteQueryParameter()', () => {
      it('should substitute query parameter in URL', () => {
        window.queryParams = { mwid: '123', pid: '456' };
        const url = 'http://example.com?mw=${mwid}&p=${pid}';
        const result = window.substituteQueryParameter(url, 'mwid');
        result.should.equal('http://example.com?mw=123&p=${pid}');
      });

      it('should handle parameters with special regex characters', () => {
        window.queryParams = { special: 'test.value' };
        const url = 'http://example.com?param=${special}';
        const result = window.substituteQueryParameter(url, 'special');
        result.should.equal('http://example.com?param=test.value');
      });

      it('should be case insensitive', () => {
        window.queryParams = { test: 'value' };
        const url = 'http://example.com?${TEST}&${test}';
        const result = window.substituteQueryParameter(url, 'test');
        result.should.equal('http://example.com?value&value');
      });
    });
  });

  describe('Language Selection', () => {
    it('should set English as default language', () => {
      should.exist(window.msgs);
      window.msgs.should.have.property('status_wait');
    });

    it('should use language from query parameter', () => {
      window.lang.should.equal('en');
    });
  });

  describe('Catch Intent Functions', () => {
    beforeEach(() => {
      // Reset state
      window.myCatchIntent = 'n/a';
      window.myCatchIntentSubmitted = false;
      window.myCatchIntentDisplaySeason = 0;
      window.st = {
        fishers: [
          { name: 'Fisher 1' },
          { name: 'Fisher 2' }
        ],
        catchIntentSeason: 0,
        catchIntentDisplaySeason: 0
      };
    });

    describe('showCatchIntentColumn()', () => {
      it('should show catch intent header and columns', () => {
        window.showCatchIntentColumn(1);

        const header = document.querySelector('#catch-intent-header');
        header.textContent.should.match(/Intended Catch/);
        header.textContent.should.match(/1/);
      });

      it('should show catch intent columns for all fishers', () => {
        window.showCatchIntentColumn(2);

        const f0 = document.querySelector('#f0-catch-intent');
        const f1 = document.querySelector('#f1-catch-intent');

        f0.style.display.should.not.equal('none');
        f1.style.display.should.not.equal('none');
      });
    });

    describe('hideCatchIntentColumn()', () => {
      it('should hide catch intent header and columns', () => {
        window.showCatchIntentColumn(1);
        window.hideCatchIntentColumn();

        const th = document.querySelector('#catch-intent-th');
        th.style.display.should.equal('none');
      });

      it('should hide catch intent columns for all fishers', () => {
        window.showCatchIntentColumn(1);
        window.hideCatchIntentColumn();

        const f0 = document.querySelector('#f0-catch-intent');
        const f1 = document.querySelector('#f1-catch-intent');

        f0.style.display.should.equal('none');
        f1.style.display.should.equal('none');
      });
    });

    describe('showCatchIntentDialog()', () => {
      it('should show the catch intent dialog', () => {
        window.myCatchIntentDialogConfigured = false;
        window.ocean = {
          catchIntentPrompt1: 'How many fish?',
          catchIntentPrompt2: 'Please enter a number'
        };

        window.showCatchIntentDialog();

        const dialog = document.querySelector('#catch-intent-dialog-box');
        dialog.style.display.should.not.equal('none');
      });

      it('should set dialog prompts from ocean config', () => {
        window.myCatchIntentDialogConfigured = false;
        window.ocean = {
          catchIntentPrompt1: 'How many fish?',
          catchIntentPrompt2: 'Additional instructions'
        };

        window.showCatchIntentDialog();

        const prompt1 = document.querySelector('#catch-intent-prompt1');
        const prompt2 = document.querySelector('#catch-intent-prompt2');

        prompt1.textContent.should.equal('How many fish?');
        prompt2.textContent.should.equal('Additional instructions');
        prompt2.style.display.should.not.equal('none');
      });

      it('should hide second prompt if empty', () => {
        window.ocean = {
          catchIntentPrompt1: 'How many fish?',
          catchIntentPrompt2: ''
        };
        window.myCatchIntentDialogConfigured = false;

        window.showCatchIntentDialog();

        const prompt2 = document.querySelector('#catch-intent-prompt2');
        prompt2.style.display.should.equal('none');
      });

      it('should clear input field', () => {
        window.ocean = {
          catchIntentPrompt1: 'Test',
          catchIntentPrompt2: ''
        };

        const input = document.querySelector('#catch-intent-input');
        input.value = 'old value';

        window.showCatchIntentDialog();

        input.value.should.equal('');
      });
    });

    describe('hideCatchIntentDialog()', () => {
      it('should hide the catch intent dialog', () => {
        window.ocean = {
          catchIntentPrompt1: 'Test',
          catchIntentPrompt2: ''
        };
        window.showCatchIntentDialog();
        window.hideCatchIntentDialog();

        const dialog = document.querySelector('#catch-intent-dialog-box');
        dialog.style.display.should.equal('none');
      });
    });

    describe('checkCatchIntentDisplay()', () => {
      it('should show column when season changes from 0 to positive', () => {
        window.st.catchIntentDisplaySeason = 1;
        window.myCatchIntentSubmitted = false;
        window.myCatchIntentDisplaySeason = 0;

        window.checkCatchIntentDisplay();

        const header = document.querySelector('#catch-intent-header');
        header.textContent.should.match(/1/);
      });

      it('should hide column when season changes to 0', () => {
        window.showCatchIntentColumn(1);
        window.st.catchIntentDisplaySeason = 0;
        window.myCatchIntentDisplaySeason = 1;
        window.myCatchIntentSubmitted = false;

        window.checkCatchIntentDisplay();

        const th = document.querySelector('#catch-intent-th');
        th.style.display.should.equal('none');
      });

      it('should not update if season has not changed', () => {
        window.st.catchIntentDisplaySeason = 1;
        window.myCatchIntentDisplaySeason = 1;
        window.myCatchIntentSubmitted = false;

        const headerBefore = document.querySelector('#catch-intent-header').textContent;
        window.checkCatchIntentDisplay();
        const headerAfter = document.querySelector('#catch-intent-header').textContent;

        headerAfter.should.equal(headerBefore);
      });
    });
  });

  describe('State Object', () => {
    it('should exist as a global variable', () => {
      should.exist(window.st);
      window.st.should.be.an.Object();
    });
  });

  describe('Global Variables', () => {
    it('should set microworld ID from query params', () => {
      window.mwId.should.equal('123');
    });

    it('should set participant ID from query params', () => {
      window.pId.should.equal('456');
    });

    it('should initialize socket connection', () => {
      should.exist(window.socket);
    });
  });
});
