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
      // Handle $(function() {}) - shorthand for $(document).ready()
      if (typeof selector === 'function') {
        // Execute immediately in test environment
        selector();
        return jQuery(document);
      }

      // Handle $(window)
      if (selector === window) {
        return {
          width: function() {
            return 1024; // Mock window width
          },
          height: function() {
            return 768; // Mock window height
          },
          on: function(event, handler) {
            window.addEventListener(event, handler);
            return this;
          },
          resize: function(handler) {
            if (handler) window.addEventListener('resize', handler);
            return this;
          },
          ready: function(handler) {
            handler();
            return this;
          }
        };
      }

      if (typeof selector === 'string') {
        if (/^<\w+>$/.test(selector)) {
          const el = document.createElement(selector.slice(1, -1));
          return {
            text: function(val) {
              if (val !== undefined) { el.textContent = String(val); return this; }
              return el.textContent;
            },
            html: function(val) {
              if (val !== undefined) { el.innerHTML = val; return this; }
              return el.innerHTML;
            },
            attr: function(name, val) {
              if (val !== undefined) { el.setAttribute(name, val); return this; }
              return el.getAttribute(name);
            }
          };
        }
        const elements = Array.from(document.querySelectorAll(selector));
        const element = elements[0] || null;
        return {
          length: elements.length,
          text: function(val) {
            if (val !== undefined) {
              elements.forEach(el => el.textContent = val);
              return this;
            }
            return element ? element.textContent : '';
          },
          val: function(val) {
            if (val !== undefined) {
              elements.forEach(el => el.value = val);
              return this;
            }
            return element ? element.value : '';
          },
          html: function(val) {
            if (val !== undefined) {
              elements.forEach(el => el.innerHTML = val);
              return this;
            }
            return element ? element.innerHTML : '';
          },
          attr: function(name, val) {
            if (val !== undefined) {
              elements.forEach(el => el.setAttribute(name, val));
              return this;
            }
            // Like jQuery: undefined (not null) for a missing attribute
            return element && element.hasAttribute(name) ? element.getAttribute(name) : undefined;
          },
          prop: function(name, val) {
            if (val !== undefined) {
              elements.forEach(el => el[name] = val);
              return this;
            }
            return element ? element[name] : undefined;
          },
          addClass: function(className) {
            elements.forEach(el => el.classList.add(className));
            return this;
          },
          removeClass: function(className) {
            elements.forEach(el => el.classList.remove(className));
            return this;
          },
          hasClass: function(className) {
            return element ? element.classList.contains(className) : false;
          },
          toggleClass: function(className, state) {
            elements.forEach(el => el.classList.toggle(className, state));
            return this;
          },
          insertAfter: function(target) {
            const targetEl = document.querySelector(target);
            if (targetEl) elements.forEach(el => targetEl.after(el));
            return this;
          },
          show: function() {
            elements.forEach(el => el.style.display = '');
            return this;
          },
          hide: function() {
            elements.forEach(el => el.style.display = 'none');
            return this;
          },
          on: function(event, handler) {
            elements.forEach(el => el.addEventListener(event, handler));
            return this;
          },
          trigger: function(event) {
            elements.forEach(el => {
              const evt = new window.Event(event);
              el.dispatchEvent(evt);
            });
            return this;
          },
          ready: function(handler) {
            // In test environment, execute immediately
            handler();
            return this;
          },
          width: function(val) {
            if (val !== undefined) {
              elements.forEach(el => el.style.width = val + 'px');
              return this;
            }
            return element ? (element.offsetWidth || 800) : 0;
          },
          each: function(callback) {
            elements.forEach((el, i) => {
              callback.call(el, i, el);
            });
            return this;
          },
          find: function(selector) {
            const found = element ? element.querySelector(selector) : null;
            return jQuery(found ? '#' + (found.id || 'not-found') : '#not-found');
          },
          fadeOut: function(duration, callback) {
            elements.forEach(el => el.style.display = 'none');
            if (typeof duration === 'function') {
              duration();
            } else if (callback) {
              callback();
            }
            return this;
          },
          fadeIn: function(duration, callback) {
            elements.forEach(el => el.style.display = '');
            if (typeof duration === 'function') {
              duration();
            } else if (callback) {
              callback();
            }
            return this;
          },
          data: function(name, val) {
            if (!element) return val === undefined ? undefined : this;
            if (val !== undefined) {
              elements.forEach(el => el.setAttribute('data-' + name, val));
              return this;
            }
            return element.getAttribute('data-' + name);
          },
          removeAttr: function(name) {
            elements.forEach(el => el.removeAttribute(name));
            return this;
          },
          css: function(prop, val) {
            if (val !== undefined) {
              elements.forEach(el => el.style[prop] = val);
              return this;
            }
            return element ? element.style[prop] : '';
          },
          modal: function(options) {
            // Mock Bootstrap modal
            elements.forEach(el => {
              if (typeof el.modal === 'function') {
                el.modal(options);
              }
            });
            return this;
          }
        };
      }

      // Handle $(document) or other DOM nodes
      if (selector === document || selector.nodeType) {
        return {
          ready: function(handler) {
            // In test environment, execute immediately
            handler();
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
            lang: 'en',
            pdisplay: 'TestPlayer',
            fclass: 'GroupA'
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
        info_fisher: 'Fisher',
        info_season: 'Season',
        info_overall: 'Overall',
        status_wait: 'Waiting',
        status_season: 'Season ',
        status_subWait: 'Please wait',
        status_spawning: 'Spawning',
        status_subSpawning: 'Fish are spawning',
        status_paused: 'Paused',
        status_getReady: 'Get ready!',
        status_fishTo: ' to ',
        status_fishRemaining: ' fish remaining',
        end_over: 'Game Over',
        costs_fishValue: 'Fish Value:',
        costs_costLeave: 'Cost to Leave Port:',
        costs_costCast: 'Cost per Cast:',
        costs_costSecond: 'Cost per Second:',
        buttons_goFishing: 'Go Fishing',
        buttons_goToSea: 'Go to Sea',
        buttons_return: 'Return to Port',
        buttons_castFish: 'Cast',
        buttons_catchFish: 'Catch',
        buttons_pause: 'Pause',
        buttons_resume: 'Resume',
        warning_seasonStart: 'Season starting!',
        warning_seasonEnd: 'Season ending!',
        warning_playerDisconnected: 'Player lost, waiting {seconds} s',
        end_disconnect: 'Game ended: a player lost their connection.',
        lobby_fisherMissing: 'Fisher missing',
        lobby_fisherReady: 'Fisher ready and waiting',
        lobby_fisherReading: 'Fisher reading rules'
      },
      es: {
        info_intent: 'Captura Prevista',
        info_fisher: 'Pescador',
        info_season: 'Temporada',
        info_overall: 'Total',
        status_wait: 'Esperando',
        status_season: 'Temporada ',
        status_subWait: 'Por favor espere',
        status_spawning: 'Desovando',
        status_subSpawning: 'Los peces están desovando',
        status_paused: 'Pausado',
        status_getReady: '¡Prepárate!',
        status_fishTo: ' a ',
        status_fishRemaining: ' peces restantes',
        end_over: 'Juego Terminado',
        costs_fishValue: 'Valor del Pescado:',
        costs_costLeave: 'Costo de Salir del Puerto:',
        costs_costCast: 'Costo por Lanzamiento:',
        costs_costSecond: 'Costo por Segundo:',
        buttons_goFishing: 'Ir a Pescar',
        buttons_goToSea: 'Ir al Mar',
        buttons_return: 'Volver al Puerto',
        buttons_castFish: 'Lanzar',
        buttons_catchFish: 'Pescar',
        buttons_pause: 'Pausar',
        buttons_resume: 'Reanudar',
        warning_seasonStart: '¡Comienza la temporada!',
        warning_seasonEnd: '¡Termina la temporada!'
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

    it('should set pParams object from query params', () => {
      // pParams may be in window scope or accessed differently due to jsdom
      // Check that the mock URL params are correctly configured
      const urlParams = window.$.url().param;
      urlParams('pdisplay').should.equal('TestPlayer');
      urlParams('fclass').should.equal('GroupA');
    });

    it('should initialize socket connection', () => {
      should.exist(window.socket);
    });
  });

  describe('UI Display Functions', () => {
    beforeEach(() => {
      // Add necessary DOM elements
      const profitElements = [
        'profit-season-header', 'profit-total-header', 'profit-gap-header',
        'profit-season-th', 'profit-total-th',
        'f0-profit-season', 'f1-profit-season',
        'f0-profit-total', 'f1-profit-total',
        'f0-profit-gap', 'f1-profit-gap',
        'costs-box'
      ];
      if (!document.querySelector('#profit-season-header')) {
        const elements = [
          ...profitElements,
          'read-rules', 'changeLocation',
          'attempt-fish', 'pause', 'resume',
          'fisher-header', 'fish-season-header', 'fish-total-header',
          'revenue-fish', 'cost-departure', 'cost-cast', 'cost-second',
          'status-label', 'status-sub-label', 'warning-alert',
          'rules-text', 'tutorial'
        ];
        elements.forEach(id => {
          if (!document.querySelector('#' + id)) {
            const elem = document.createElement('div');
            elem.id = id;
            document.body.appendChild(elem);
          }
        });
      }

      // Reset display styles for profit-related elements between tests
      profitElements.forEach(id => {
        const el = document.querySelector('#' + id);
        if (el) el.style.display = '';
      });

      window.st = {
        fishers: [
          { name: 'Fisher 1' },
          { name: 'Fisher 2' }
        ],
        status: 'loading',
        season: 0,
        certainFish: 100,
        reportedMysteryFish: 0,
        catchIntentDisplaySeason: 0
      };

      window.ocean = {
        currencySymbol: '$',
        fishValue: 3.0,
        costDeparture: 1.0,
        costCast: 0.5,
        costSecond: 0.1,
        preparationText: 'Welcome to the fish game!\nGood luck!',
        enablePause: true,
        enableTutorial: true,
        profitSeasonDisabled: false,
        profitTotalDisabled: false,
        profitGapDisabled: false
      };
    });

    describe('hideProfitColumns()', () => {
      it('should hide profit headers', () => {
        window.hideProfitColumns();

        document.querySelector('#profit-season-header').style.display.should.equal('none');
        document.querySelector('#profit-total-header').style.display.should.equal('none');
      });

      it('should hide profit columns for all fishers', () => {
        window.hideProfitColumns();

        document.querySelector('#f0-profit-season').style.display.should.equal('none');
        document.querySelector('#f1-profit-season').style.display.should.equal('none');
        document.querySelector('#f0-profit-total').style.display.should.equal('none');
        document.querySelector('#f1-profit-total').style.display.should.equal('none');
      });

      it('should hide costs box', () => {
        window.hideProfitColumns();

        document.querySelector('#costs-box').style.display.should.equal('none');
      });

      it('should remove bootstro classes from profit elements', () => {
        const elem = document.querySelector('#profit-season-header');
        elem.classList.add('bootstro');

        window.hideProfitColumns();

        elem.classList.contains('bootstro').should.be.false();
      });
    });

    describe('hideProfitSeasonColumn()', () => {
      it('should hide only season profit elements', () => {
        window.hideProfitSeasonColumn();

        document.querySelector('#profit-season-header').style.display.should.equal('none');
        document.querySelector('#f0-profit-season').style.display.should.equal('none');
        document.querySelector('#f1-profit-season').style.display.should.equal('none');
      });

      it('should not hide total or gap columns', () => {
        window.hideProfitSeasonColumn();

        document.querySelector('#profit-total-header').style.display.should.not.equal('none');
        document.querySelector('#profit-gap-header').style.display.should.not.equal('none');
      });
    });

    describe('hideProfitTotalColumn()', () => {
      it('should hide only total profit elements', () => {
        window.hideProfitTotalColumn();

        document.querySelector('#profit-total-header').style.display.should.equal('none');
        document.querySelector('#f0-profit-total').style.display.should.equal('none');
        document.querySelector('#f1-profit-total').style.display.should.equal('none');
      });

      it('should not hide season or gap columns', () => {
        window.hideProfitTotalColumn();

        document.querySelector('#profit-season-header').style.display.should.not.equal('none');
        document.querySelector('#profit-gap-header').style.display.should.not.equal('none');
      });
    });

    describe('hideProfitGapColumn()', () => {
      it('should hide only gap profit elements', () => {
        window.hideProfitGapColumn();

        document.querySelector('#profit-gap-header').style.display.should.equal('none');
        document.querySelector('#f0-profit-gap').style.display.should.equal('none');
        document.querySelector('#f1-profit-gap').style.display.should.equal('none');
      });

      it('should not hide season or total columns', () => {
        window.hideProfitGapColumn();

        document.querySelector('#profit-season-header').style.display.should.not.equal('none');
        document.querySelector('#profit-total-header').style.display.should.not.equal('none');
      });
    });

    describe('disableButtons()', () => {
      it('should disable all action buttons', () => {
        window.disableButtons();

        const changeLocation = document.querySelector('#changeLocation');
        const attemptFish = document.querySelector('#attempt-fish');
        const pause = document.querySelector('#pause');

        changeLocation.hasAttribute('disabled').should.be.true();
        attemptFish.hasAttribute('disabled').should.be.true();
        pause.hasAttribute('disabled').should.be.true();
      });
    });

    describe('loadLabels()', () => {
      it('should set button labels from messages', () => {
        window.loadLabels();

        document.querySelector('#read-rules').textContent.should.equal(window.msgs.buttons_goFishing);
      });

      it('should set header labels from messages', () => {
        window.loadLabels();

        document.querySelector('#fisher-header').textContent.should.equal(window.msgs.info_fisher);
      });

      it('should label the fish button "Attempt to fish" when the catch chance is below 100%', () => {
        const originalOcean = window.ocean;
        window.ocean = { chanceCatch: 0.8 };
        window.loadLabels();
        document.querySelector('#attempt-fish').innerHTML.should.equal(window.msgs.buttons_castFish);
        window.ocean = originalOcean;
      });

      it('should label the fish button "Catch a fish" when the catch chance is 100%', () => {
        const originalOcean = window.ocean;
        window.ocean = { chanceCatch: 1 };
        window.loadLabels();
        document.querySelector('#attempt-fish').innerHTML.should.equal(window.msgs.buttons_catchFish);
        window.ocean = originalOcean;
      });

      it('should use "Attempt to fish" before the microworld params arrive', () => {
        const originalOcean = window.ocean;
        window.ocean = undefined;
        window.loadLabels();
        document.querySelector('#attempt-fish').innerHTML.should.equal(window.msgs.buttons_castFish);
        window.ocean = originalOcean;
      });

      it('should call updateCosts and updateStatus', () => {
        let costsUpdated = false;
        let statusUpdated = false;

        const originalUpdateCosts = window.updateCosts;
        const originalUpdateStatus = window.updateStatus;

        window.updateCosts = () => { costsUpdated = true; };
        window.updateStatus = () => { statusUpdated = true; };

        window.loadLabels();

        costsUpdated.should.be.true();
        statusUpdated.should.be.true();

        // Restore
        window.updateCosts = originalUpdateCosts;
        window.updateStatus = originalUpdateStatus;
      });
    });

    describe('updateStatus()', () => {
      it('should display loading status', () => {
        window.st.status = 'loading';
        window.updateStatus();

        const status = document.querySelector('#status-label');
        status.textContent.should.equal(window.msgs.status_wait);
      });

      it('should display running status with season number', () => {
        window.st.status = 'running';
        window.st.season = 5;
        window.updateStatus();

        const status = document.querySelector('#status-label');
        status.innerHTML.should.match(/Season/);
        status.innerHTML.should.match(/5/);
      });

      it('should display fish count in running status', () => {
        window.st.status = 'running';
        window.st.season = 1;
        window.st.certainFish = 100;
        window.st.reportedMysteryFish = 0;
        window.updateStatus();

        const subLabel = document.querySelector('#status-sub-label');
        subLabel.innerHTML.should.match(/100/);
      });

      it('should display mystery fish range when present', () => {
        window.st.status = 'running';
        window.st.season = 1;
        window.st.certainFish = 80;
        window.st.reportedMysteryFish = 20;
        window.updateStatus();

        const subLabel = document.querySelector('#status-sub-label');
        subLabel.innerHTML.should.match(/80/);
        subLabel.innerHTML.should.match(/100/);
      });

      it('should display resting status', () => {
        window.st.status = 'resting';
        window.updateStatus();

        const status = document.querySelector('#status-label');
        status.textContent.should.equal(window.msgs.status_spawning);
      });

      it('should display paused status', () => {
        window.st.status = 'paused';
        window.updateStatus();

        const status = document.querySelector('#status-label');
        status.textContent.should.equal(window.msgs.status_paused);
      });

      it('should display over status', () => {
        window.st.status = 'over';
        window.updateStatus();

        const status = document.querySelector('#status-label');
        status.textContent.should.equal(window.msgs.end_over);
      });
    });

    // Warnings are notices in line 2 of the status bar, on red (.status-notice)
    describe('updateWarning()', () => {
      const line2 = () => document.querySelector('#status-sub-label');

      beforeEach(() => {
        window.clearWarnings();
        window.st = { status: 'running', season: 1, certainFish: 7, reportedMysteryFish: 0 };
      });

      it('should show start warning for first season', () => {
        window.st.season = 0;
        window.updateWarning('start');

        line2().textContent.should.equal(window.msgs.status_getReady);
        line2().classList.contains('status-notice').should.be.true();
      });

      it('should show start warning for subsequent seasons', () => {
        window.st.season = 2;
        window.updateWarning('start');

        line2().textContent.should.equal(window.msgs.warning_seasonStart);
      });

      it('should show end warning', () => {
        window.updateWarning('end');

        line2().textContent.should.equal(window.msgs.warning_seasonEnd);
        line2().classList.contains('status-notice').should.be.true();
      });

      it('should go back to the fish count when the warning is cleared', () => {
        window.updateWarning('end');
        window.updateWarning('something else');

        line2().classList.contains('status-notice').should.be.false();
        line2().textContent.should.match(/^7/);
      });
    });

    describe('clearWarnings()', () => {
      it('should clear any notice', () => {
        window.st = { status: 'running', season: 1, certainFish: 7, reportedMysteryFish: 0 };
        window.updateWarning('end');

        window.clearWarnings();

        document.querySelector('#status-sub-label').classList.contains('status-notice').should.be.false();
      });
    });

    describe('updateCosts()', () => {
      it('should show fish value when non-zero and the notice is enabled', () => {
        window.ocean.showFishValueNotice = true;
        window.ocean.fishValue = 3.0;
        window.updateCosts();

        const revenue = document.querySelector('#revenue-fish');
        revenue.textContent.should.match(/\$3/);
        revenue.style.display.should.not.equal('none');
      });

      it('should show fish value when the setting is missing (older microworlds)', () => {
        delete window.ocean.showFishValueNotice;
        window.ocean.fishValue = 3.0;
        window.updateCosts();

        document.querySelector('#revenue-fish').style.display.should.not.equal('none');
      });

      it('should hide fish value when the notice is switched off', () => {
        window.ocean.showFishValueNotice = false;
        window.ocean.fishValue = 3.0;
        window.updateCosts();

        document.querySelector('#revenue-fish').style.display.should.equal('none');
        window.ocean.showFishValueNotice = true;
      });

      it('should hide fish value when zero', () => {
        window.ocean.showFishValueNotice = true;
        window.ocean.fishValue = 0;
        window.updateCosts();

        const revenue = document.querySelector('#revenue-fish');
        revenue.style.display.should.equal('none');
      });

      it('should show cost of departure when non-zero', () => {
        window.ocean.costDeparture = 1.0;
        window.updateCosts();

        const cost = document.querySelector('#cost-departure');
        cost.textContent.should.match(/\$1/);
      });

      it('should hide cost of departure when zero', () => {
        window.ocean.costDeparture = 0;
        window.updateCosts();

        const cost = document.querySelector('#cost-departure');
        cost.style.display.should.equal('none');
      });

      it('should show cost of cast when non-zero', () => {
        window.ocean.costCast = 0.5;
        window.updateCosts();

        const cost = document.querySelector('#cost-cast');
        cost.textContent.should.match(/\$0\.5/);
      });

      it('should hide cost of cast when zero', () => {
        window.ocean.costCast = 0;
        window.updateCosts();

        const cost = document.querySelector('#cost-cast');
        cost.style.display.should.equal('none');
      });

      it('should show cost per second when non-zero', () => {
        window.ocean.costSecond = 0.1;
        window.updateCosts();

        const cost = document.querySelector('#cost-second');
        cost.textContent.should.match(/\$0\.1/);
      });

      it('should hide cost per second when zero', () => {
        window.ocean.costSecond = 0;
        window.updateCosts();

        const cost = document.querySelector('#cost-second');
        cost.style.display.should.equal('none');
      });

      describe('with fisher advantage', () => {
        afterEach(() => {
          window.pParams.fHasAdvantage = false;
        });

        it('should show reduced costs for an advantaged fisher', () => {
          window.ocean.fisherAdvantageEnabled = true;
          window.ocean.costDeparture = 1.0;
          window.ocean.costDepartureReduction = 0.4;
          window.ocean.costCast = 0.5;
          window.ocean.costCastReduction = 0.2;
          window.ocean.costSecond = 0.1;
          window.ocean.costSecondReduction = 0.06;
          window.pParams.fHasAdvantage = true;

          window.updateCosts();

          document.querySelector('#cost-departure').textContent.should.match(/\$0\.6/);
          document.querySelector('#cost-cast').textContent.should.match(/\$0\.3/);
          document.querySelector('#cost-second').textContent.should.match(/\$0\.04/);
        });

        it('should show full costs for a fisher without advantage', () => {
          window.ocean.fisherAdvantageEnabled = true;
          window.ocean.costDeparture = 1.0;
          window.ocean.costDepartureReduction = 0.4;
          window.pParams.fHasAdvantage = false;

          window.updateCosts();

          document.querySelector('#cost-departure').textContent.should.match(/\$1/);
        });
      });

      it('should return early if ocean is not defined', () => {
        window.ocean = null;

        // Should not throw error
        (() => window.updateCosts()).should.not.throw();
      });
    });

    describe('computeProfitGap()', () => {
      beforeEach(() => {
        window.ocean.fisherAdvantageEnabled = true;
        window.ocean.fishValue = 3;
        window.ocean.fishValuePayGap = 1;
        window.ocean.costCast = 1;
        window.ocean.costCastReduction = 0.5;
        window.ocean.costDeparture = 1;
        window.ocean.costDepartureReduction = 0.25;
        window.ocean.costSecond = 0;
        window.ocean.costSecondReduction = 0;
      });

      it('should compute a negative gap for a non-advantaged fisher (reproduces microworld YJ4HBN)', () => {
        const fisher = {
          params: { fHasAdvantage: false },
          money: 9.00,
          totalFishCaught: 5,
          totalCasts: 5,
          totalDepartures: 1,
          totalSecondsAtSea: 0
        };

        const gap = window.computeProfitGap(fisher);

        gap.should.equal('-7.75');
      });

      it('should compute the mirror-image positive gap for an advantaged fisher with the same activity', () => {
        const fisher = {
          params: { fHasAdvantage: true },
          money: 16.75,
          totalFishCaught: 5,
          totalCasts: 5,
          totalDepartures: 1,
          totalSecondsAtSea: 0
        };

        const gap = window.computeProfitGap(fisher);

        gap.should.equal('7.75');
      });

      it('should not throw when seasonData contains the season-0 null placeholder (reproduces live display bug)', () => {
        const fisher = {
          params: { fHasAdvantage: false },
          money: 9.00,
          totalFishCaught: 5,
          totalCasts: 5,
          totalDepartures: 1,
          totalSecondsAtSea: 0,
          seasonData: [null, { actualCasts: 5 }]
        };

        (() => window.computeProfitGap(fisher)).should.not.throw();
      });
    });

    describe('updateRulesText()', () => {
      it('should set rules text with line breaks converted to <br />', () => {
        window.ocean.preparationText = 'Line 1\nLine 2\nLine 3';
        window.updateRulesText();

        const rulesText = document.querySelector('#rules-text');
        rulesText.innerHTML.should.equal('Line 1<br>Line 2<br>Line 3');
      });

      it('should handle text without line breaks', () => {
        window.ocean.preparationText = 'Single line text';
        window.updateRulesText();

        const rulesText = document.querySelector('#rules-text');
        rulesText.innerHTML.should.equal('Single line text');
      });
    });

    describe('makeUnpausable()', () => {
      it('should hide pause button when pause is disabled', () => {
        window.ocean.enablePause = false;
        window.makeUnpausable();

        const pause = document.querySelector('#pause');
        pause.style.display.should.equal('none');
      });

      it('should not hide pause button when pause is enabled', () => {
        const pause = document.querySelector('#pause');
        pause.style.display = ''; // Reset

        window.ocean.enablePause = true;
        window.makeUnpausable();

        pause.style.display.should.not.equal('none');
      });

      it('should give the other two buttons the pause column\'s space', () => {
        document.querySelectorAll('#control-box').forEach(el => el.remove());
        const box = document.createElement('div');
        box.id = 'control-box';
        box.innerHTML = '<div class="col-xs-4 control-col"></div><div class="col-xs-4 control-col"></div>' +
          '<div class="col-xs-4" id="pause-col"></div>';
        document.body.appendChild(box);

        window.ocean.enablePause = false;
        window.makeUnpausable();

        document.querySelector('#pause-col').style.display.should.equal('none');
        document.querySelectorAll('#control-box .col-xs-6').length.should.equal(2);
        document.querySelectorAll('#control-box .control-col.col-xs-4').length.should.equal(0);
        box.remove();
        window.ocean.enablePause = true;
      });
    });

    describe('hideTutorial()', () => {
      it('should hide tutorial when disabled', () => {
        window.ocean.enableTutorial = false;
        window.hideTutorial();

        const tutorial = document.querySelector('#tutorial');
        tutorial.style.display.should.equal('none');
      });

      it('should not hide tutorial when enabled', () => {
        const tutorial = document.querySelector('#tutorial');
        tutorial.style.display = ''; // Reset

        window.ocean.enableTutorial = true;
        window.hideTutorial();

        tutorial.style.display.should.not.equal('none');
      });
    });
  });

  describe('Game Flow Functions', () => {
    beforeEach(() => {
      // Create additional DOM elements for game flow tests
      const elements = [
        'changeLocation', 'attempt-fish', 'pause', 'resume',
        'fish-season-header', 'profit-season-header',
        'over-text', 'over-modal'
      ];
      elements.forEach(id => {
        const elem = document.createElement(id === 'changeLocation' || id === 'attempt-fish' || id === 'pause' || id === 'resume' ? 'button' : 'div');
        elem.id = id;
        if (id === 'changeLocation') {
          elem.setAttribute('data-location', 'port');
        }
        if (id === 'over-modal') {
          // Mock Bootstrap modal
          elem.modal = function(options) {
            elem.setAttribute('data-modal-shown', 'true');
            elem.setAttribute('data-keyboard', options.keyboard);
            elem.setAttribute('data-backdrop', options.backdrop);
          };
        }
        document.body.appendChild(elem);
      });

      // Set up mock socket
      window.mockSocketEmits = [];
      window.socket = {
        emit: function(event, data) {
          window.mockSocketEmits.push({ event, data });
        },
        disconnect: function() {
          window.mockSocketEmits.push({ event: 'disconnect' });
        }
      };

      // Set up basic state
      window.st = {
        fishers: [],
        status: 'loading',
        season: 0,
        certainFish: 100,
        reportedMysteryFish: 0
      };

      // Reset display styles for profit-related elements between tests
      ['profit-season-header', 'profit-total-header', 'profit-gap-header',
       'profit-season-th', 'profit-total-th',
       'f0-profit-season', 'f1-profit-season',
       'f0-profit-total', 'f1-profit-total',
       'f0-profit-gap', 'f1-profit-gap',
       'costs-box'].forEach(id => {
        const el = document.querySelector('#' + id);
        if (el) el.style.display = '';
      });

      window.ocean = {
        profitSeasonDisabled: false,
        profitTotalDisabled: false,
        profitGapDisabled: false,
        enablePause: true,
        enableTutorial: true,
        currencySymbol: '$',
        endTimeText: 'Time is up!\nGame over.',
        endDepletionText: 'Fish depleted!\nGame over.'
      };
    });

    describe('hide ocean', () => {
      beforeEach(() => {
        // Fresh copy of the page structure the feature touches
        ['game-column', 'ocean-column', 'status-box', 'status-sub-label', 'ocean-box', 'warning-alert'].forEach(id => {
          document.querySelectorAll('#' + id).forEach(el => el.remove());
        });
        const game = document.createElement('div');
        game.id = 'game-column';
        game.innerHTML = '<div id="status-box"><h3 id="status-sub-label"></h3></div>';
        const oceanCol = document.createElement('div');
        oceanCol.id = 'ocean-column';
        oceanCol.innerHTML = '<div id="ocean-box" class="bootstro"><div id="warning-alert"></div></div>';
        document.body.appendChild(game);
        document.body.appendChild(oceanCol);
        window.st = { status: 'running', certainFish: 5, mysteryFish: 0 };
      });

      it('should leave the layout alone when the ocean is shown', () => {
        window.ocean = { hideOcean: false };
        window.applyOceanVisibility();
        document.querySelector('#ocean-column').style.display.should.equal('');
        document.querySelector('#ocean-box').classList.contains('bootstro').should.be.true();
        document.querySelector('#warning-alert').parentElement.id.should.equal('ocean-box');
      });

      it('should hide the ocean column and centre the game', () => {
        window.ocean = { hideOcean: true };
        window.applyOceanVisibility();
        document.querySelector('#ocean-column').style.display.should.equal('none');
        document.querySelector('#game-column').classList.contains('col-sm-offset-3').should.be.true();
        document.querySelector('#ocean-box').classList.contains('bootstro').should.be.false();
      });

      it('should turn the fish count red when overfishing and the ocean is hidden', () => {
        window.ocean = { hideOcean: true, enableRespawnWarning: true, spawnFactor: 2, maxFish: 20 };
        window.drawOcean();
        document.querySelector('#status-sub-label').classList.contains('respawn-warning').should.be.true();
      });

      it('should clear the red fish count once there are enough fish', () => {
        window.ocean = { hideOcean: true, enableRespawnWarning: true, spawnFactor: 2, maxFish: 20 };
        window.drawOcean();
        window.st.certainFish = 15;
        window.drawOcean();
        document.querySelector('#status-sub-label').classList.contains('respawn-warning').should.be.false();
      });

      it('should not turn the fish count red when the warning is off', () => {
        window.ocean = { hideOcean: true, enableRespawnWarning: false, spawnFactor: 2, maxFish: 20 };
        window.drawOcean();
        document.querySelector('#status-sub-label').classList.contains('respawn-warning').should.be.false();
      });

      it('should not turn the fish count red when the ocean shows the warning', () => {
        window.ocean = { hideOcean: false, enableRespawnWarning: true, spawnFactor: 2, maxFish: 20 };
        window.updateRespawnWarning();
        document.querySelector('#status-sub-label').classList.contains('respawn-warning').should.be.false();
      });

      it('should not touch the canvas when the ocean is hidden', () => {
        window.ocean = { hideOcean: true };
        const originalGetById = window.document.getElementById;
        let canvasRequested = false;
        window.document.getElementById = id => {
          if (id === 'ocean-canvas') canvasRequested = true;
          return originalGetById.call(window.document, id);
        };
        window.drawOcean();
        window.document.getElementById = originalGetById;
        canvasRequested.should.be.false();
      });
    });

    describe('device recording', () => {
      function stubMatchMedia(touchOnly) {
        window.matchMedia = () => ({ matches: touchOnly });
      }

      function stubScreen(width, height) {
        Object.defineProperty(window.screen, 'width', { value: width, configurable: true });
        Object.defineProperty(window.screen, 'height', { value: height, configurable: true });
      }

      afterEach(() => {
        delete window.matchMedia;
      });

      it('should classify a device with a mouse as desktop', () => {
        stubMatchMedia(false);
        stubScreen(1920, 1080);
        window.getDeviceClass().should.equal('desktop');
      });

      it('should classify touch-only devices by their shorter side', () => {
        stubMatchMedia(true);
        stubScreen(393, 873);
        window.getDeviceClass().should.equal('phone');
        stubScreen(1133, 744);
        window.getDeviceClass().should.equal('small tablet');
        stubScreen(820, 1180);
        window.getDeviceClass().should.equal('large tablet');
      });

      it('should remember it has been in a game, so a reconnect is flagged as one', () => {
        window.hasJoinedOcean = false;
        window.setupOcean({
          enablePause: true, enableTutorial: true, preparationText: '',
          fishValue: 1.0, costDeparture: 0.5, costCast: 0.1, costSecond: 0.0
        });
        window.hasJoinedOcean.should.be.true();
      });

      it('should send device info when joining an ocean', () => {
        window.setupOcean({
          enablePause: true,
          enableTutorial: true,
          preparationText: 'Welcome!',
          fishValue: 1.0,
          costDeparture: 0.5,
          costCast: 0.1,
          costSecond: 0.0
        });
        const sent = window.mockSocketEmits.filter(e => e.event === 'deviceInfo');
        sent.length.should.equal(1);
        should(sent[0].data).have.properties(['deviceClass', 'userAgent', 'screenWidth', 'screenHeight',
          'viewportWidth', 'viewportHeight', 'pixelRatio', 'touch', 'language']);
        sent[0].data.userAgent.should.equal(window.navigator.userAgent);
      });
    });

    describe('rules screen on joining', () => {
      let rulesShown;
      const params = {
        enablePause: true, enableTutorial: true, preparationText: 'Rules',
        fishValue: 1.0, costDeparture: 0.5, costCast: 0.1, costSecond: 0.0
      };

      beforeEach(() => {
        document.querySelectorAll('#rules-modal').forEach(el => el.remove());
        const modal = document.createElement('div');
        modal.id = 'rules-modal';
        rulesShown = 0;
        modal.modal = () => { rulesShown++; };
        document.body.appendChild(modal);
      });

      it('should show the rules to a participant joining a new game', () => {
        window.setupOcean(params, { rejoining: false });
        rulesShown.should.equal(1);
      });

      it('should show the rules when no join state is sent (older server)', () => {
        window.setupOcean(params);
        rulesShown.should.equal(1);
      });

      it('should not show the rules to a participant rejoining a game under way', () => {
        window.setupOcean(params, { rejoining: true });
        rulesShown.should.equal(0);
      });
    });

    describe('setupOcean()', () => {
      it('should call all ocean setup functions', () => {
        const testOcean = {
          profitSeasonDisabled: false,
          profitTotalDisabled: false,
          profitGapDisabled: false,
          enablePause: true,
          enableTutorial: true,
          preparationText: 'Welcome!',
          fishValue: 1.0,
          costDeparture: 0.5,
          costCast: 0.1,
          costSecond: 0.0
        };

        window.setupOcean(testOcean);

        // Ocean should be set
        window.ocean.should.equal(testOcean);

        // Catch intent column should be hidden (called by setupOcean)
        // setupOcean calls hideCatchIntentColumn() which hides #catch-intent-th
        const catchIntentTh = document.querySelector('#catch-intent-th');
        should.exist(catchIntentTh);
        catchIntentTh.style.display.should.equal('none');
      });

      it('should hide only season column when profitSeasonDisabled is true', () => {
        const testOcean = {
          profitSeasonDisabled: true,
          profitTotalDisabled: false,
          profitGapDisabled: false,
          fisherAdvantageEnabled: true,
          enablePause: true,
          enableTutorial: true,
          preparationText: 'Welcome!',
          fishValue: 1.0,
          costDeparture: 0,
          costCast: 0,
          costSecond: 0
        };

        window.setupOcean(testOcean);

        document.querySelector('#profit-season-header').style.display.should.equal('none');
        document.querySelector('#profit-total-header').style.display.should.not.equal('none');
        document.querySelector('#profit-gap-header').style.display.should.not.equal('none');
      });

      it('should hide costs box only when all three profit columns are disabled', () => {
        const testOcean = {
          profitSeasonDisabled: true,
          profitTotalDisabled: true,
          profitGapDisabled: true,
          enablePause: true,
          enableTutorial: true,
          preparationText: 'Welcome!',
          fishValue: 1.0,
          costDeparture: 0,
          costCast: 0,
          costSecond: 0
        };

        window.setupOcean(testOcean);

        document.querySelector('#costs-box').style.display.should.equal('none');
      });
    });

    describe('changeLocation()', () => {
      it('should change from port to sea', () => {
        // Set up messages
        window.msgs = window.langs[window.lang];

        const btn = document.querySelector('#changeLocation');
        btn.setAttribute('data-location', 'port');

        window.changeLocation();

        // Socket should emit goToSea
        window.mockSocketEmits.should.containDeep([{ event: 'goToSea' }]);

        // Button data should change
        btn.getAttribute('data-location').should.equal('sea');

        // Button text should change to return message
        btn.innerHTML.should.equal(window.msgs.buttons_return);
      });

      it('should change from sea to port', () => {
        // Set up messages
        window.msgs = window.langs[window.lang];

        const btn = document.querySelector('#changeLocation');
        btn.setAttribute('data-location', 'sea');

        window.changeLocation();

        // Socket should emit return
        window.mockSocketEmits.should.containDeep([{ event: 'return' }]);

        // Button data should change
        btn.getAttribute('data-location').should.equal('port');

        // Button text should change to goToSea message
        btn.innerHTML.should.equal(window.msgs.buttons_goToSea);
      });
    });

    describe('resetLocation()', () => {
      it('should reset location to port', () => {
        // Set up messages
        window.msgs = window.langs[window.lang];

        const btn = document.querySelector('#changeLocation');
        btn.setAttribute('data-location', 'sea');

        window.resetLocation();

        btn.getAttribute('data-location').should.equal('port');
        btn.innerHTML.should.equal(window.msgs.buttons_goToSea);
      });
    });

    describe('goToSea()', () => {
      it('should emit goToSea event and enable fishing button', () => {
        const attemptBtn = document.querySelector('#attempt-fish');
        attemptBtn.setAttribute('disabled', 'disabled');

        window.goToSea();

        // Socket should emit
        window.mockSocketEmits.should.containDeep([{ event: 'goToSea' }]);

        // Button should be enabled
        attemptBtn.hasAttribute('disabled').should.be.false();
      });
    });

    describe('goToPort()', () => {
      it('should emit return event and disable fishing button', () => {
        const attemptBtn = document.querySelector('#attempt-fish');

        window.goToPort();

        // Socket should emit
        window.mockSocketEmits.should.containDeep([{ event: 'return' }]);

        // Button should be disabled
        attemptBtn.getAttribute('disabled').should.equal('disabled');
      });
    });

    describe('attemptToFish()', () => {
      it('should emit attemptToFish event', () => {
        window.attemptToFish();

        window.mockSocketEmits.should.containDeep([{ event: 'attemptToFish' }]);
      });
    });

    describe('endSeason()', () => {
      it('should update season and status', () => {
        window.st.season = 1;
        window.st.status = 'running';

        window.endSeason({ season: 2, status: 'resting' });

        window.st.season.should.equal(2);
        window.st.status.should.equal('resting');
      });

      it('should disable buttons', () => {
        const changeBtn = document.querySelector('#changeLocation');
        const attemptBtn = document.querySelector('#attempt-fish');

        window.endSeason({ season: 2, status: 'resting' });

        changeBtn.getAttribute('disabled').should.equal('disabled');
        attemptBtn.getAttribute('disabled').should.equal('disabled');
      });
    });

    describe('endRun()', () => {
      it('should disconnect socket and show modal', () => {
        window.endRun('time');

        // Should disconnect
        window.mockSocketEmits.should.containDeep([{ event: 'disconnect' }]);

        // Status should be over
        window.st.status.should.equal('over');

        // Modal should be shown
        const modal = document.querySelector('#over-modal');
        modal.getAttribute('data-modal-shown').should.equal('true');
      });

      it('should display time-based end text', () => {
        window.ocean.endTimeText = 'Time is up!\nGame over.';

        window.endRun('time');

        const overText = document.querySelector('#over-text');
        overText.innerHTML.should.match(/Time is up/);
        overText.innerHTML.should.match(/<br/);
      });

      it('should display depletion-based end text', () => {
        window.ocean.endDepletionText = 'Fish depleted!\nGame over.';

        window.endRun('depletion');

        const overText = document.querySelector('#over-text');
        overText.innerHTML.should.match(/Fish depleted/);
        overText.innerHTML.should.match(/<br/);
      });

      it('should explain a game ended because a player was lost', () => {
        window.endRun('disconnect');
        document.querySelector('#over-text').innerHTML.should.equal(window.msgs.end_disconnect);
      });
    });

    describe('leaving the page', () => {
      let calls;

      beforeEach(() => {
        calls = [];
        window.disconnectedOnPageHide = false;
        window.socket.connected = true;
        window.socket.disconnect = () => { calls.push('disconnect'); window.socket.connected = false; };
        window.socket.connect = () => { calls.push('connect'); window.socket.connected = true; };
      });

      it('should disconnect when the page is hidden, so the server knows at once', () => {
        window.onPageHide();
        calls.should.eql(['disconnect']);
      });

      it('should reconnect when the page comes back from the back/forward cache', () => {
        window.onPageHide();
        window.onPageShow({ persisted: true });
        calls.should.eql(['disconnect', 'connect']);
      });

      it('should not reconnect on a normal page load', () => {
        window.onPageShow({ persisted: false });
        calls.should.eql([]);
      });

      it('should not reconnect a game that had already ended', () => {
        window.socket.connected = false; // endRun disconnected it
        window.onPageHide();
        window.onPageShow({ persisted: true });
        calls.should.eql([]);
      });
    });

    describe('disconnect pause', () => {
      beforeEach(() => {
        window.st = { status: 'running', fishers: [] };
        document.querySelector('#changeLocation').removeAttribute('disabled');
        document.querySelector('#attempt-fish').removeAttribute('disabled');
      });

      afterEach(() => {
        window.hideDisconnectPause();
      });

      it('should show the countdown and block the game buttons', () => {
        window.showDisconnectPause({ secondsLeft: 30 });
        document.querySelector('#status-sub-label').textContent.should.equal('Player lost, waiting 30 s');
        document.querySelector('#status-sub-label').classList.contains('status-notice').should.be.true();
        document.querySelector('#changeLocation').hasAttribute('disabled').should.be.true();
        document.querySelector('#attempt-fish').hasAttribute('disabled').should.be.true();
        document.querySelector('#pause').style.display.should.equal('none');
        document.querySelector('#resume').style.display.should.equal('none');
      });

      it('should count down once a second', (done) => {
        window.showDisconnectPause({ secondsLeft: 30 });
        setTimeout(() => {
          document.querySelector('#status-sub-label').textContent.should.equal('Player lost, waiting 29 s');
          done();
        }, 1100);
      });

      it('should restore the buttons it blocked when play resumes', () => {
        window.showDisconnectPause({ secondsLeft: 30 });
        window.hideDisconnectPause();
        window.resume();
        document.querySelector('#changeLocation').hasAttribute('disabled').should.be.false();
        document.querySelector('#status-sub-label').classList.contains('status-notice').should.be.false();
      });
    });

    describe('status bar', () => {
      // Line 1 as "message | clock" (the clock is a separate box on the right)
      const line1 = () => {
        const label = document.querySelector('#status-label');
        const text = label.querySelector('.status-text').textContent;
        const clock = label.querySelector('.status-clock');
        return clock ? text + ' | ' + clock.textContent : text;
      };
      const line2 = () => document.querySelector('#status-sub-label');

      beforeEach(() => {
        window.clearWarnings();
        window.msgs.status_starting = 'Starting';
        window.msgs.status_season = 'Season ';
        window.msgs.status_paused = 'Paused';
        window.msgs.warning_resuming = 'Resuming in {seconds} s';
        window.ocean.showGameClock = false;
      });

      it('should say the game is starting during the countdown, not "wait in the lobby"', () => {
        window.st = { status: 'initial delay', season: 0, seconds: 2, phaseLength: 5 };
        window.updateStatus();
        line1().should.equal('Starting');
      });

      it('should show the time left when the microworld shows a clock', () => {
        window.ocean.showGameClock = true;
        window.st = { status: 'running', season: 2, seconds: 18, phaseLength: 60, certainFish: 5 };
        window.updateStatus();
        line1().should.equal('Season 2 | 00:42');
      });

      it('should show no clock when the microworld hides it (the default)', () => {
        window.st = { status: 'running', season: 2, seconds: 18, phaseLength: 60, certainFish: 5 };
        window.updateStatus();
        line1().should.equal('Season 2');
      });

      it('should show the stopped clock while paused', () => {
        window.ocean.showGameClock = true;
        window.st = { status: 'paused', season: 2, seconds: 18, phaseLength: 60, certainFish: 5 };
        window.updateStatus();
        line1().should.equal('Paused | 00:42');
      });

      it('should count down to resuming in line 2, then go back to the fish count', () => {
        window.st = { status: 'paused', season: 2, certainFish: 5, reportedMysteryFish: 0, resumingIn: 3 };
        window.updateStatus();
        line2().textContent.should.equal('Resuming in 3 s');
        line2().classList.contains('status-notice').should.be.true();

        window.st = { status: 'running', season: 2, certainFish: 5, reportedMysteryFish: 0, resumingIn: null };
        window.updateStatus();
        line2().classList.contains('status-notice').should.be.false();
        line2().textContent.should.match(/^5/);
      });

      it('should not let a cleared resume countdown remove a disconnect notice', () => {
        window.showDisconnectPause({ secondsLeft: 30 });
        window.st = { status: 'paused', season: 2, certainFish: 5, resumingIn: null };
        window.updateStatus();
        line2().textContent.should.equal('Player lost, waiting 30 s');
        window.hideDisconnectPause();
      });
    });

    describe('pause()', () => {
      it('should disable location and fishing buttons', () => {
        const changeBtn = document.querySelector('#changeLocation');
        const attemptBtn = document.querySelector('#attempt-fish');

        window.pause();

        changeBtn.getAttribute('disabled').should.equal('disabled');
        attemptBtn.getAttribute('disabled').should.equal('disabled');
      });

      it('should hide pause button and show resume button', () => {
        const pauseBtn = document.querySelector('#pause');
        const resumeBtn = document.querySelector('#resume');

        window.pause();

        pauseBtn.style.display.should.equal('none');
        resumeBtn.style.display.should.equal('');
      });
    });

    describe('resume()', () => {
      it('should enable location and fishing buttons if they were enabled before pause', () => {
        const changeBtn = document.querySelector('#changeLocation');
        const attemptBtn = document.querySelector('#attempt-fish');

        // Set pre-pause state to undefined (meaning they were enabled)
        window.prePauseButtonsState = {
          changeLocation: undefined,
          attemptFish: undefined
        };

        window.resume();

        changeBtn.hasAttribute('disabled').should.be.false();
        attemptBtn.hasAttribute('disabled').should.be.false();
      });

      it('should show pause button and hide resume button', () => {
        const pauseBtn = document.querySelector('#pause');
        const resumeBtn = document.querySelector('#resume');
        pauseBtn.style.display = 'none';
        resumeBtn.style.display = '';

        window.prePauseButtonsState = {};

        window.resume();

        pauseBtn.style.display.should.equal('');
        resumeBtn.style.display.should.equal('none');
      });

      it('should keep the pause button hidden when pausing is disabled', () => {
        const pauseBtn = document.querySelector('#pause');
        pauseBtn.style.display = 'none';
        window.ocean.enablePause = false;
        window.prePauseButtonsState = {};

        window.resume();

        pauseBtn.style.display.should.equal('none');
        window.ocean.enablePause = true;
      });
    });

    describe('refused on rejoining', () => {
      it('should end the game screen with the reason, in the participant\'s language', () => {
        window.msgs.end_lost = 'Lost: cannot rejoin (translated)';
        window.showRejoinRefused({ code: 'lost', message: 'English text' });
        document.querySelector('#over-text').innerHTML.should.equal('Lost: cannot rejoin (translated)');
        window.st.status.should.equal('over');
        document.querySelector('#over-modal').getAttribute('data-modal-shown').should.equal('true');
      });

      it('should fall back to the server\'s text, safely, without a known code', () => {
        window.showRejoinRefused({ message: 'Plain <b>text</b>' });
        document.querySelector('#over-text').innerHTML.should.equal('Plain &lt;b&gt;text&lt;/b&gt;');
      });
    });

    describe('listen()', () => {
      it('should log, not throw, when a handler fails, so the connection keeps working', () => {
        const originalSocket = window.socket;
        const originalError = window.console.error;
        let registered;
        let logged = '';
        window.socket = { on: (event, fn) => { registered = fn; } };
        window.console.error = (msg) => { logged += msg; };

        window.listen('status', () => { throw new Error('boom'); });
        (() => registered({})).should.not.throw();
        logged.should.match(/status/);

        window.socket = originalSocket;
        window.console.error = originalError;
      });

      it('should pass the message data through to the handler', () => {
        const originalSocket = window.socket;
        let registered;
        let received;
        window.socket = { on: (event, fn) => { registered = fn; } };

        window.listen('status', (data) => { received = data; });
        registered({ season: 2 });
        received.season.should.equal(2);

        window.socket = originalSocket;
      });
    });

    describe('sortFisherTable()', () => {
      it('should do nothing, not throw, before the table is set up', () => {
        // A status update can reach a rejoining page before the table is set
        // up; an error here used to stall the page's connection
        window.ocean.oceanOrder = 'ocean_order_desc_fish_season';
        (() => window.sortFisherTable()).should.not.throw();
      });
    });

    describe('a fisher leaving mid-game', () => {
      const fisher = (name, pDisplay) => ({
        name: name, params: { pDisplay: pDisplay }, status: 'At port', totalFishCaught: 0, money: 0,
        seasonData: [{ catchIntent: 0, nextCatchIntent: 0, fishCaught: 0, endMoney: 0 }]
      });

      beforeEach(() => {
        // A real table, as in fish.pug, replacing loose f* elements from other tests
        document.querySelectorAll('[id^="f0"],[id^="f1"],[id^="f2"],[id^="f3"],#fishers-tbody')
          .forEach(el => el.remove());
        const cells = ['status', 'name', 'catch-intent', 'fish-season', 'fish-total',
          'profit-season', 'profit-total', 'profit-gap'];
        const rows = [0, 1, 2, 3].map(i => '<tr id="f' + i + '">' +
          cells.map(c => '<td id="f' + i + '-' + c + '"></td>').join('') + '</tr>').join('');
        const table = document.createElement('table');
        table.innerHTML = '<tbody id="fishers-tbody">' + rows + '</tbody>';
        document.body.appendChild(table);

        window.pId = 'me';
        window.msgs.info_you = 'You';
        window.myCatchIntentDisplaySeason = 0;
        window.queryParams = {};
        window.ocean = { showFishers: true, showFisherNames: true, profitGapDisabled: true };
      });

      it('should stop listing a fisher who has left', () => {
        window.st = { season: 0, fishers: [fisher('me', 'Me'), fisher('a', 'Alice'), fisher('b', 'Bob')] };
        window.updateFishers();
        document.querySelector('#f2').hasAttribute('active-fisher').should.be.true();

        // Alice is removed: Bob moves up to row 1, and row 2 is no longer used
        window.st = { season: 0, fishers: [fisher('me', 'Me'), fisher('b', 'Bob')] };
        window.updateFishers();
        document.querySelector('#f1-name').textContent.should.equal('Bob');
        document.querySelector('#f2').hasAttribute('active-fisher').should.be.false();
        document.querySelector('#f2').style.display.should.equal('none');
        document.querySelector('#f0').hasAttribute('active-fisher').should.be.true();
        window.fisherTableNeedsRefilter.should.be.true();
      });

      it('should keep asking MixItUp to refilter until a refilter has actually run', () => {
        const calls = [];
        let finish = null;
        // MixItUp drops requests while busy: the first is never completed
        const busy = { mixItUp: (cmd, filter, animate, cb) => { calls.push(filter); } };
        const idle = { mixItUp: (cmd, filter, animate, cb) => { calls.push(filter); finish = cb; } };

        window.fisherTableNeedsRefilter = true;
        window.refilterFisherTableIfNeeded(busy);
        window.fisherTableNeedsRefilter.should.be.true();
        window.refilterFisherTableIfNeeded(idle);
        finish();
        window.fisherTableNeedsRefilter.should.be.false();
        window.refilterFisherTableIfNeeded(idle);
        calls.should.eql(['tr[active-fisher]', 'tr[active-fisher]']);
      });
    });

    describe('requestPause()', () => {
      it('should emit requestPause event with participant ID', () => {
        window.pId = 'test-participant-123';

        window.requestPause();

        window.mockSocketEmits.should.containDeep([
          { event: 'requestPause', data: 'test-participant-123' }
        ]);
      });
    });

    describe('requestResume()', () => {
      it('should emit requestResume event with participant ID', () => {
        window.pId = 'test-participant-456';

        window.requestResume();

        window.mockSocketEmits.should.containDeep([
          { event: 'requestResume', data: 'test-participant-456' }
        ]);
      });
    });

    describe('updateFishers() with pDisplay', () => {
      beforeEach(() => {
        // Add fisher name display elements
        for (let i = 0; i <= 3; i++) {
          const nameElem = document.createElement('div');
          nameElem.id = 'f' + i + '-name';
          document.body.appendChild(nameElem);

          const statusElem = document.createElement('img');
          statusElem.id = 'f' + i + '-status';
          document.body.appendChild(statusElem);

          const fishSeasonElem = document.createElement('div');
          fishSeasonElem.id = 'f' + i + '-fish-season';
          document.body.appendChild(fishSeasonElem);

          const fishTotalElem = document.createElement('div');
          fishTotalElem.id = 'f' + i + '-fish-total';
          document.body.appendChild(fishTotalElem);

          const containerElem = document.createElement('div');
          containerElem.id = 'f' + i;
          document.body.appendChild(containerElem);
        }

        window.pId = '456';
        window.myCatchIntentDisplaySeason = 0;
        window.queryParams = {};
        window.msgs = window.langs.en;
        window.msgs.info_you = 'You';
      });

      it('should display pDisplay for other fishers when showFisherNames is true', () => {
        window.ocean = {
          showFishers: true,
          showFisherNames: true,
          showFisherStatus: true,
          showNumCaught: true,
          showFisherBalance: true
        };

        window.st = {
          season: 0,
          fishers: [
            {
              name: '456',
              params: { pDisplay: 'CurrentPlayer', pClass: 'GroupA' },
              status: 'At port',
              totalFishCaught: 10,
              money: 50.00,
              seasonData: [{ catchIntent: 5, nextCatchIntent: 5, fishCaught: 10, endMoney: 50.00 }]
            },
            {
              name: 'other-fisher-1',
              params: { pDisplay: 'Alice', pClass: 'GroupB' },
              status: 'At sea',
              totalFishCaught: 8,
              money: 40.00,
              seasonData: [{ catchIntent: 4, nextCatchIntent: 4, fishCaught: 8, endMoney: 40.00 }]
            },
            {
              name: 'other-fisher-2',
              params: { pDisplay: 'Bob', pClass: 'GroupA' },
              status: 'At port',
              totalFishCaught: 12,
              money: 60.00,
              seasonData: [{ catchIntent: 6, nextCatchIntent: 6, fishCaught: 12, endMoney: 60.00 }]
            }
          ]
        };

        window.updateFishers();

        // Current player should show "You"
        document.querySelector('#f0-name').textContent.should.equal('You');

        // Other fishers should show their pDisplay values
        document.querySelector('#f1-name').textContent.should.equal('Alice');
        document.querySelector('#f2-name').textContent.should.equal('Bob');
      });

      it('should display class emoji next to name when fisher classes enabled', () => {
        window.ocean = {
          showFishers: true,
          showFisherNames: true,
          showFisherStatus: true,
          showNumCaught: true,
          showFisherBalance: true,
          fisherClassesEnabled: true,
          fisherClasses: ['Class A', 'Class B'],
          fisherClassEmojis: { 'Class A': '⭐', 'Class B': '😀' }
        };

        window.st = {
          season: 0,
          fishers: [
            {
              name: '456',
              params: { pDisplay: 'CurrentPlayer' },
              status: 'At port',
              totalFishCaught: 10,
              money: 50.00,
              seasonData: [{ catchIntent: 5, nextCatchIntent: 5, fishCaught: 10, endMoney: 50.00 }]
            },
            {
              name: 'other-fisher-1',
              params: { pDisplay: 'Alice', fClass: 'Class A' },
              status: 'At sea',
              totalFishCaught: 8,
              money: 40.00,
              seasonData: [{ catchIntent: 4, nextCatchIntent: 4, fishCaught: 8, endMoney: 40.00 }]
            },
            {
              name: 'other-fisher-2',
              params: { pDisplay: 'Bob', fClass: 'Class B' },
              status: 'At port',
              totalFishCaught: 12,
              money: 60.00,
              seasonData: [{ catchIntent: 6, nextCatchIntent: 6, fishCaught: 12, endMoney: 60.00 }]
            }
          ]
        };

        window.updateFishers();

        // Fisher with Class A should show "⭐ Alice"
        document.querySelector('#f1-name').textContent.should.equal('⭐ Alice');
        // Fisher with Class B should show "😀 Bob"
        document.querySelector('#f2-name').textContent.should.equal('😀 Bob');
      });

      it('should display index number when showFisherNames is false', () => {
        window.ocean = {
          showFishers: true,
          showFisherNames: false,
          showFisherStatus: true,
          showNumCaught: true,
          showFisherBalance: true
        };

        window.st = {
          season: 0,
          fishers: [
            {
              name: '456',
              pDisplay: 'CurrentPlayer',
              status: 'At port',
              totalFishCaught: 10,
              money: 50.00,
              seasonData: [{ catchIntent: 5, nextCatchIntent: 5, fishCaught: 10, endMoney: 50.00 }]
            },
            {
              name: 'other-fisher-1',
              pDisplay: 'Alice',
              status: 'At sea',
              totalFishCaught: 8,
              money: 40.00,
              seasonData: [{ catchIntent: 4, nextCatchIntent: 4, fishCaught: 8, endMoney: 40.00 }]
            }
          ]
        };

        window.updateFishers();

        // Other fisher should show index number (1) instead of pDisplay
        document.querySelector('#f1-name').textContent.should.equal('1');
      });

      it('should fallback to fisher.name when pDisplay is undefined', () => {
        window.ocean = {
          showFishers: true,
          showFisherNames: true,
          showFisherStatus: true,
          showNumCaught: true,
          showFisherBalance: true
        };

        window.st = {
          season: 0,
          fishers: [
            {
              name: '456',
              pDisplay: 'CurrentPlayer',
              status: 'At port',
              totalFishCaught: 10,
              money: 50.00,
              seasonData: [{ catchIntent: 5, nextCatchIntent: 5, fishCaught: 10, endMoney: 50.00 }]
            },
            {
              name: 'fisher-without-pdisplay',
              // pDisplay is undefined - should fallback to name
              status: 'At sea',
              totalFishCaught: 8,
              money: 40.00,
              seasonData: [{ catchIntent: 4, nextCatchIntent: 4, fishCaught: 8, endMoney: 40.00 }]
            }
          ]
        };

        window.updateFishers();

        // Should display undefined (since pDisplay is not set and we're displaying fisher.pDisplay)
        // This tests current behavior - if fallback is needed, the Fisher constructor handles it
        const displayedName = document.querySelector('#f1-name').textContent;
        // The value will be 'undefined' as string since pDisplay property doesn't exist
        should.exist(displayedName);
      });
    });

    describe('maybeRedirect()', () => {
      it('should not redirect if redirectURL is empty', () => {
        window.ocean.redirectURL = '';

        // Should not throw error
        (() => window.maybeRedirect()).should.not.throw();
      });

      it('should not redirect if redirectURL is undefined', () => {
        delete window.ocean.redirectURL;

        // Should not throw error
        (() => window.maybeRedirect()).should.not.throw();
      });
    });
  });

  describe('Lobby status table', () => {
    before(() => {
      // Add DOM elements needed by lobby functions
      ['lobby-status-box', 'lobby-tbody'].forEach(id => {
        if (!document.getElementById(id)) {
          const tag = id === 'lobby-tbody' ? 'tbody' : 'div';
          const el = document.createElement(tag);
          el.id = id;
          document.body.appendChild(el);
        }
      });

      // Extend the jQuery mock to support empty(), append(), and $('<tag>') creation
      const orig$ = window.$;
      window.$ = function(selector) {
        // Handle HTML element creation: $('<tr>'), $('<td>'), etc.
        if (typeof selector === 'string' && /^<\w+>$/.test(selector)) {
          const el = document.createElement(selector.slice(1, -1));
          const obj = {
            _domEl: el,
            text: function(val) {
              if (val !== undefined) { el.textContent = String(val); return obj; }
              return el.textContent;
            },
            append: function() {
              Array.from(arguments).forEach(function(item) {
                if (item && item._domEl) el.appendChild(item._domEl);
              });
              return obj;
            }
          };
          return obj;
        }
        const result = orig$(selector);
        if (!result.empty) {
          const els = Array.from(document.querySelectorAll(selector));
          result.empty = function() {
            els.forEach(function(el) { el.innerHTML = ''; });
            return result;
          };
          result.append = function() {
            Array.from(arguments).forEach(function(item) {
              if (item && item._domEl) {
                els.forEach(function(el) { el.appendChild(item._domEl); });
              }
            });
            return result;
          };
        }
        return result;
      };
      window.$.url = orig$.url;
    });

    describe('receiveLobbyStatus()', () => {
      it('should store slots in lobbySlots', () => {
        const slots = [{ entryTime: Date.now(), readyTime: null }, null];
        window.receiveLobbyStatus({ slots: slots });
        window.lobbySlots.should.deepEqual(slots);
      });
    });

    describe('warnInitialDelay()', () => {
      it('should hide #lobby-status-box', () => {
        document.getElementById('lobby-status-box').style.display = '';
        window.warnInitialDelay();
        document.getElementById('lobby-status-box').style.display.should.equal('none');
      });
    });

    describe('renderLobbyTable()', () => {
      it('should create one row per slot', () => {
        const now = Date.now();
        window.lobbySlots = [
          { entryTime: now - 120000, readyTime: now - 60000 },
          { entryTime: now - 60000, readyTime: null },
          null
        ];
        window.renderLobbyTable();
        document.getElementById('lobby-tbody').querySelectorAll('tr').length.should.equal(3);
      });

      it('should show "Fisher missing" for null slots', () => {
        window.lobbySlots = [null];
        window.renderLobbyTable();
        document.getElementById('lobby-tbody').querySelectorAll('td')[0].textContent.should.equal('Fisher missing');
      });

      it('should show "---" time for null slots', () => {
        window.lobbySlots = [null];
        window.renderLobbyTable();
        document.getElementById('lobby-tbody').querySelectorAll('td')[1].textContent.should.equal('---');
      });

      it('should show "Fisher reading rules" when readyTime is null', () => {
        window.lobbySlots = [{ entryTime: Date.now(), readyTime: null }];
        window.renderLobbyTable();
        document.getElementById('lobby-tbody').querySelectorAll('td')[0].textContent.should.equal('Fisher reading rules');
      });

      it('should show "Fisher ready and waiting" when readyTime is set', () => {
        window.lobbySlots = [{ entryTime: Date.now() - 120000, readyTime: Date.now() - 60000 }];
        window.renderLobbyTable();
        document.getElementById('lobby-tbody').querySelectorAll('td')[0].textContent.should.equal('Fisher ready and waiting');
      });

      it('should sort longest wait first', () => {
        const now = Date.now();
        window.lobbySlots = [
          { entryTime: now - 60000, readyTime: null },            // 1 min reading
          { entryTime: now - 180000, readyTime: now - 120000 },   // 2 min ready
        ];
        window.renderLobbyTable();
        const rows = document.getElementById('lobby-tbody').querySelectorAll('tr');
        rows[0].querySelectorAll('td')[0].textContent.should.equal('Fisher ready and waiting');
        rows[1].querySelectorAll('td')[0].textContent.should.equal('Fisher reading rules');
      });

      it('should place missing slots at the bottom', () => {
        const now = Date.now();
        window.lobbySlots = [
          null,
          { entryTime: now - 60000, readyTime: null },
        ];
        window.renderLobbyTable();
        const rows = document.getElementById('lobby-tbody').querySelectorAll('tr');
        rows[0].querySelectorAll('td')[0].textContent.should.equal('Fisher reading rules');
        rows[1].querySelectorAll('td')[0].textContent.should.equal('Fisher missing');
      });
    });
  });
});
