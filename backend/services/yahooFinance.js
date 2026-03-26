const yahooFinance = require('yahoo-finance2').default;

async function getStockQuote(ticker) {
  try {
    const quote = await yahooFinance.quote(ticker);
    return {
      price: quote.regularMarketPrice,
      change: quote.regularMarketChange || 0,
      changePercent: quote.regularMarketChangePercent || 0,
      name: quote.longName || quote.shortName || ticker,
      symbol: quote.symbol,
      high: quote.regularMarketDayHigh || 0,
      low: quote.regularMarketDayLow || 0,
    };
  } catch (error) {
    console.error(`Error fetching quote for ${ticker}:`, error.message);
    return null;
  }
}

async function getStockNews(ticker) {
  try {
    const search = await yahooFinance.search(ticker, { newsCount: 3 });
    return search.news.map(n => ({
      title: n.title,
      link: n.link,
      publisher: n.publisher,
      providerPublishTime: n.providerPublishTime,
      sentiment: Math.random() > 0.5 ? 0.6 : -0.4 // mock sentiment for UI coloring
    }));
  } catch (error) {
    console.error(`Error fetching news for ${ticker}:`, error.message);
    return [];
  }
}

async function getMarketTrends() {
  try {
    const [gainers, losers, actives] = await Promise.all([
      yahooFinance.screener({ scrIds: 'day_gainers', count: 5 }),
      yahooFinance.screener({ scrIds: 'day_losers', count: 5 }),
      yahooFinance.screener({ scrIds: 'most_actives', count: 5 })
    ]);
    const formatQuote = (q) => ({ symbol: q.symbol, name: q.shortName || q.longName, price: q.regularMarketPrice, changePercent: q.regularMarketChangePercent });
    return {
      topGainers: gainers?.quotes ? gainers.quotes.map(formatQuote) : [],
      topLosers: losers?.quotes ? losers.quotes.map(formatQuote) : [],
      mostActive: actives?.quotes ? actives.quotes.map(formatQuote) : []
    };
  } catch(e) {
    console.error("Trends error:", e.message);
    return null;
  }
}

async function getStockFinancials(ticker) {
  try {
    const summary = await yahooFinance.quoteSummary(ticker, { modules: ['financialData'] });
    const fd = summary.financialData || {};
    return {
      ticker,
      revenueGrowth: fd.revenueGrowth || 0,
      profitMargins: fd.profitMargins || 0,
      operatingMargins: fd.operatingMargins || 0,
      returnOnEquity: fd.returnOnEquity || 0,
      totalCash: fd.totalCash || 0,
      totalDebt: fd.totalDebt || 0,
      recommendationKey: fd.recommendationKey || 'none'
    };
  } catch(e) {
    console.error("Financials error:", e.message);
    return null;
  }
}

async function searchStocks(query) {
  try {
    const results = await yahooFinance.search(query, { quotesCount: 8, newsCount: 0 });
    return results.quotes
      .filter(q => q.isYahooFinance) // Filter out news/unrelated
      .map(q => ({
        symbol: q.symbol,
        name: q.shortName || q.longName,
        exchDisp: q.exchDisp,
        type: q.quoteType
      }));
  } catch (e) {
    console.error("Search API error:", e.message);
    return [];
  }
}

module.exports = { getStockQuote, getStockNews, getMarketTrends, getStockFinancials, searchStocks };
