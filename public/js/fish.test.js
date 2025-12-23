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
          html: function(val) {
            if (val !== undefined) {
              if (element) element.innerHTML = val;
              return this;
            }
            return element ? element.innerHTML : '';
          },
          attr: function(name, val) {
            if (val !== undefined) {
              if (element) element.setAttribute(name, val);
              return this;
            }
            return element ? element.getAttribute(name) : null;
          },
          prop: function(name, val) {
            if (val !== undefined) {
              if (element) element[name] = val;
              return this;
            }
            return element ? element[name] : undefined;
          },
          addClass: function(className) {
            if (element) element.classList.add(className);
            return this;
          },
          removeClass: function(className) {
            if (element) element.classList.remove(className);
            return this;
          },
          hasClass: function(className) {
            return element ? element.classList.contains(className) : false;
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
          },
          ready: function(handler) {
            // In test environment, execute immediately
            handler();
            return this;
          },
          width: function(val) {
            if (val !== undefined) {
              if (element) element.style.width = val + 'px';
              return this;
            }
            return element ? (element.offsetWidth || 800) : 0;
          },
          each: function(callback) {
            if (element) {
              callback.call(element, 0, element);
            }
            return this;
          },
          find: function(selector) {
            const found = element ? element.querySelector(selector) : null;
            return jQuery(found ? '#' + (found.id || 'not-found') : '#not-found');
          },
          fadeOut: function(duration, callback) {
            if (element) element.style.display = 'none';
            if (typeof duration === 'function') {
              duration();
            } else if (callback) {
              callback();
            }
            return this;
          },
          fadeIn: function(duration, callback) {
            if (element) element.style.display = '';
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
              element.setAttribute('data-' + name, val);
              return this;
            }
            return element.getAttribute('data-' + name);
          },
          removeAttr: function(name) {
            if (element) element.removeAttribute(name);
            return this;
          },
          modal: function(options) {
            // Mock Bootstrap modal
            if (element && typeof element.modal === 'function') {
              element.modal(options);
            }
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
        buttons_pause: 'Pause',
        buttons_resume: 'Resume',
        warning_seasonStart: 'Season starting!',
        warning_seasonEnd: 'Season ending!'
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

    it('should initialize socket connection', () => {
      should.exist(window.socket);
    });
  });

  describe('UI Display Functions', () => {
    beforeEach(() => {
      // Add necessary DOM elements
      if (!document.querySelector('#profit-season-header')) {
        const elements = [
          'profit-season-header', 'profit-total-header',
          'profit-season-th', 'profit-total-th',
          'f0-profit-season', 'f1-profit-season',
          'f0-profit-total', 'f1-profit-total',
          'costs-box', 'read-rules', 'changeLocation',
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
        profitDisplayDisabled: false
      };
    });

    describe('hideProfitColumns()', () => {
      it('should hide profit headers', () => {
        window.hideProfitColumns();

        document.querySelector('#profit-season-header').style.display.should.equal('none');
        document.querySelector('#profit-total-header').style.display.should.equal('none');
        document.querySelector('#profit-season-th').style.display.should.equal('none');
        document.querySelector('#profit-total-th').style.display.should.equal('none');
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
        status.innerHTML.should.equal(window.msgs.status_wait);
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
        status.innerHTML.should.equal(window.msgs.status_spawning);
      });

      it('should display paused status', () => {
        window.st.status = 'paused';
        window.updateStatus();

        const status = document.querySelector('#status-label');
        status.innerHTML.should.equal(window.msgs.status_paused);
      });

      it('should display over status', () => {
        window.st.status = 'over';
        window.updateStatus();

        const status = document.querySelector('#status-label');
        status.innerHTML.should.equal(window.msgs.end_over);
      });
    });

    describe('updateWarning()', () => {
      it('should show start warning for first season', () => {
        window.st.season = 0;
        window.updateWarning('start');

        const warning = document.querySelector('#warning-alert');
        warning.textContent.should.equal(window.msgs.status_getReady);
      });

      it('should show start warning for subsequent seasons', () => {
        window.st.season = 2;
        window.updateWarning('start');

        const warning = document.querySelector('#warning-alert');
        warning.textContent.should.equal(window.msgs.warning_seasonStart);
      });

      it('should show end warning', () => {
        window.updateWarning('end');

        const warning = document.querySelector('#warning-alert');
        warning.textContent.should.equal(window.msgs.warning_seasonEnd);
      });

      it('should clear warning with other input', () => {
        window.updateWarning('something else');

        const warning = document.querySelector('#warning-alert');
        warning.textContent.should.equal('');
      });
    });

    describe('clearWarnings()', () => {
      it('should clear warning text', () => {
        const warning = document.querySelector('#warning-alert');
        warning.textContent = 'Some warning';

        window.clearWarnings();

        warning.textContent.should.equal('');
      });
    });

    describe('updateCosts()', () => {
      it('should show fish value when non-zero', () => {
        window.ocean.fishValue = 3.0;
        window.updateCosts();

        const revenue = document.querySelector('#revenue-fish');
        revenue.textContent.should.match(/\$3/);
        revenue.style.display.should.not.equal('none');
      });

      it('should hide fish value when zero', () => {
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

      it('should return early if ocean is not defined', () => {
        window.ocean = null;

        // Should not throw error
        (() => window.updateCosts()).should.not.throw();
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

      window.ocean = {
        profitDisplayDisabled: false,
        enablePause: true,
        enableTutorial: true,
        currencySymbol: '$',
        endTimeText: 'Time is up!\nGame over.',
        endDepletionText: 'Fish depleted!\nGame over.'
      };
    });

    describe('setupOcean()', () => {
      it('should call all ocean setup functions', () => {
        const testOcean = {
          profitDisplayDisabled: false,
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

      it('should hide profit columns when profit display is disabled', () => {
        const testOcean = {
          profitDisplayDisabled: true,
          enablePause: true,
          enableTutorial: true,
          preparationText: 'Welcome!',
          fishValue: 1.0,
          costDeparture: 0,
          costCast: 0,
          costSecond: 0
        };

        // Create profit elements
        ['profit-season-header', 'profit-total-header'].forEach(id => {
          const elem = document.createElement('div');
          elem.id = id;
          document.body.appendChild(elem);
        });

        window.setupOcean(testOcean);

        const profitHeader = document.querySelector('#profit-season-header');
        profitHeader.style.display.should.equal('none');
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
});
