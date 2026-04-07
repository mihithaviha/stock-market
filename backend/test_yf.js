const yahooFinance = require('yahoo-finance2').default;
async function run() {
  try {
    const res = await yahooFinance.search('Apple', {quotesCount: 1});
    console.log(JSON.stringify(res, null, 2));
  } catch (e) {
    console.error(e.message, e.stack);
  }
}
run();
