const should = require('should');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const { createInstrumenter } = require('istanbul-lib-instrument');
const libCoverage = require('istanbul-lib-coverage');

describe('Default Text (jsdom)', () => {
  let window;
  const scriptPath = path.join(__dirname, 'default-text.js');

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

  describe('pageHeader object', () => {
    it('should be defined', () => {
      should.exist(window.pageHeader);
      should(window.pageHeader).be.an.Object();
    });

    it('should have all required status keys', () => {
      should(window.pageHeader).have.property('new');
      should(window.pageHeader).have.property('test');
      should(window.pageHeader).have.property('active');
      should(window.pageHeader).have.property('archived');
    });

    it('should have non-empty string values for all keys', () => {
      should(window.pageHeader.new).be.a.String().and.not.be.empty();
      should(window.pageHeader.test).be.a.String().and.not.be.empty();
      should(window.pageHeader.active).be.a.String().and.not.be.empty();
      should(window.pageHeader.archived).be.a.String().and.not.be.empty();
    });
  });

  describe('panelTitle object', () => {
    it('should be defined', () => {
      should.exist(window.panelTitle);
      should(window.panelTitle).be.an.Object();
    });

    it('should have all required status keys', () => {
      should(window.panelTitle).have.property('new');
      should(window.panelTitle).have.property('test');
      should(window.panelTitle).have.property('active');
      should(window.panelTitle).have.property('archived');
    });

    it('should have non-empty string values for all keys', () => {
      should(window.panelTitle.new).be.a.String().and.not.be.empty();
      should(window.panelTitle.test).be.a.String().and.not.be.empty();
      should(window.panelTitle.active).be.a.String().and.not.be.empty();
      should(window.panelTitle.archived).be.a.String().and.not.be.empty();
    });
  });

  describe('panelBody object', () => {
    it('should be defined', () => {
      should.exist(window.panelBody);
      should(window.panelBody).be.an.Object();
    });

    it('should have all required status keys', () => {
      should(window.panelBody).have.property('new');
      should(window.panelBody).have.property('test');
      should(window.panelBody).have.property('active');
      should(window.panelBody).have.property('archived');
    });

    it('should have non-empty string values for all keys', () => {
      should(window.panelBody.new).be.a.String().and.not.be.empty();
      should(window.panelBody.test).be.a.String().and.not.be.empty();
      should(window.panelBody.active).be.a.String().and.not.be.empty();
      should(window.panelBody.archived).be.a.String().and.not.be.empty();
    });
  });

  describe('standalone text constants', () => {
    it('should define prepText as a non-empty string', () => {
      should.exist(window.prepText);
      should(window.prepText).be.a.String().and.not.be.empty();
    });

    it('should define endTimeText as a non-empty string', () => {
      should.exist(window.endTimeText);
      should(window.endTimeText).be.a.String().and.not.be.empty();
    });

    it('should define endDepletedText as a non-empty string', () => {
      should.exist(window.endDepletedText);
      should(window.endDepletedText).be.a.String().and.not.be.empty();
    });

    it('should define catchIntentPrompt1 as a non-empty string', () => {
      should.exist(window.catchIntentPrompt1);
      should(window.catchIntentPrompt1).be.a.String().and.not.be.empty();
    });

    it('should define catchIntentPrompt2 as a non-empty string', () => {
      should.exist(window.catchIntentPrompt2);
      should(window.catchIntentPrompt2).be.a.String().and.not.be.empty();
    });

    it('should define explainRedirectText as a non-empty string', () => {
      should.exist(window.explainRedirectText);
      should(window.explainRedirectText).be.a.String().and.not.be.empty();
    });
  });

  describe('content validation', () => {
    it('prepText should mention key game concepts', () => {
      const text = window.prepText.toLowerCase();
      should(text).match(/fish/);
      should(text).match(/season/);
      should(text).match(/ocean/);
      should(text).match(/catch/);
    });

    it('endTimeText should indicate completion', () => {
      const text = window.endTimeText.toLowerCase();
      should(text).match(/season|done/);
    });

    it('endDepletedText should mention fish depletion', () => {
      const text = window.endDepletedText.toLowerCase();
      should(text).match(/fish/);
      should(text).match(/gone/);
    });

    it('explainRedirectText should contain HTML tags', () => {
      should(window.explainRedirectText).match(/<h4>/);
      should(window.explainRedirectText).match(/<\/h4>/);
      should(window.explainRedirectText).match(/<b>/);
      should(window.explainRedirectText).match(/<tt>/);
    });

    it('explainRedirectText should mention redirection concepts', () => {
      const text = window.explainRedirectText.toLowerCase();
      should(text).match(/redirect/);
      should(text).match(/url/);
      should(text).match(/participant/);
    });
  });

  describe('panel status consistency', () => {
    it('all panel objects should have the same keys', () => {
      const headerKeys = Object.keys(window.pageHeader).sort();
      const titleKeys = Object.keys(window.panelTitle).sort();
      const bodyKeys = Object.keys(window.panelBody).sort();

      should(titleKeys).eql(headerKeys);
      should(bodyKeys).eql(headerKeys);
    });
  });
});
