const should = require('should');
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

describe('Dashboard (jsdom)', () => {
  let window, $;

  before(() => {
    const dom = new JSDOM(`
      <!DOCTYPE html>
      <html><body>
        <table><tbody id="tracked-simulations-row"></tbody></table>
      </body></html>
    `, { runScripts: 'dangerously', url: 'http://localhost:8080/experimenters/exp1/dashboard' });
    window = dom.window;

    window.io = { connect: () => ({ on: () => {}, emit: () => {} }) };
    window._ = { isEqual: () => false };
    window.moment = () => ({ format: () => '' });

    const run = file => {
      const script = window.document.createElement('script');
      script.textContent = fs.readFileSync(file, 'utf8');
      window.document.body.appendChild(script);
    };
    run(path.join(__dirname, '../../bower_components/jquery/jquery.min.js'));
    $ = window.$;
    $.ajax = () => {};      // no server: skip loading the microworld tables
    $.fx.off = true;        // no row fade-in animation
    run(path.join(__dirname, 'dashboard.js'));
  });

  beforeEach(() => {
    $('#tracked-simulations-row').empty();
  });

  function rows() {
    // Array.from builds the array in Node's realm so deep equality works
    return Array.from($('#tracked-simulations-row tr').toArray(), tr => $(tr).find('td').last().text());
  }

  const sim = (oceanId, code) => ({ oceanId: oceanId, code: code, time: 'now', participants: ['p1', 'p2'] });

  it('should show a new run as currently running', () => {
    window.newSimulation(sim(1, 'AAA'));
    should(rows()).eql(['Currently running']);
  });

  it('should update the run\'s row when it finishes, not add a second one', () => {
    window.newSimulation(sim(1, 'AAA'));
    window.simulationDone(sim(1, 'AAA'));
    should(rows()).eql(['Finished run']);
    $('#tracked-simulations-row tr').hasClass('info').should.be.true();
  });

  it('should only update the row of the run that finished', () => {
    window.newSimulation(sim(1, 'AAA'));
    window.newSimulation(sim(2, 'BBB'));
    window.simulationDone(sim(1, 'AAA'));
    should(rows()).eql(['Currently running', 'Finished run']);
  });

  it('should not duplicate running rows when the dashboard reconnects', () => {
    window.currentRunningSimulations({ 1: Object.assign(sim(1, 'AAA'), { expId: 'exp1' }) });
    window.currentRunningSimulations({ 1: Object.assign(sim(1, 'AAA'), { expId: 'exp1' }) });
    should(rows()).eql(['Currently running']);
  });

  it('should add abandonments as separate rows and keep the run\'s row', () => {
    window.newSimulation(sim(1, 'AAA'));
    window.simulationInterrupt(Object.assign(sim(1, 'AAA'), { participants: ['p1'] }));
    should(rows()).eql(['Participant abandoned simulation run', 'Currently running']);
    window.simulationDone(sim(1, 'AAA'));
    should(rows()).eql(['Participant abandoned simulation run', 'Finished run']);
  });
});
