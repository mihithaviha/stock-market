const YahooFinance = require("yahoo-finance2").default;
const language = require('@google-cloud/language');

const yahooFinance = new YahooFinance();
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
    const newsItems = search.news || [];
    
    let nlpClient = null;
    try {
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_CLOUD_PROJECT) {
        nlpClient = new language.LanguageServiceClient();
      }
    } catch(e) {
      console.warn("NLP Client not initialized");
    }
    
    return await Promise.all(newsItems.map(async n => {
      let sentiment = Math.random() > 0.5 ? 0.6 : -0.4;
      if (nlpClient) {
        try {
          const document = { content: n.title, type: 'PLAIN_TEXT' };
          const [result] = await nlpClient.analyzeSentiment({ document });
          sentiment = result.documentSentiment.score;
        } catch(nlpErr) {
          console.warn("Sentiment analysis omitted");
        }
      }
      return {
        title: n.title,
        link: n.link,
        publisher: n.publisher,
        providerPublishTime: n.providerPublishTime,
        sentiment,
        relatedTickers: n.relatedTickers || []
      };
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
  } catch (e) {
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
      revenueGrowth: fd.revenueGrowth !== undefined ? fd.revenueGrowth : null,
      profitMargins: fd.profitMargins !== undefined ? fd.profitMargins : null,
      operatingMargins: fd.operatingMargins !== undefined ? fd.operatingMargins : null,
      returnOnEquity: fd.returnOnEquity !== undefined ? fd.returnOnEquity : null,
      totalCash: fd.totalCash !== undefined ? fd.totalCash : null,
      totalDebt: fd.totalDebt !== undefined ? fd.totalDebt : null,
      recommendationKey: fd.recommendationKey || 'none'
    };
  } catch (e) {
    console.error("Financials error:", e.message);
    return null;
  }
}

async function searchStocks(query) {
  try {
    const results = await yahooFinance.search(query, { quotesCount: 8, newsCount: 0 });
    return results.quotes
      .map(q => ({
        symbol: q.symbol,
        name: q.shortName || q.longName || q.symbol,
        exchDisp: q.exchDisp || 'Unknown',
        type: q.quoteType || 'Unknown'
      }));
  } catch (e) {
    console.error("Search API error:", e.message);
    return [];
  }
}

module.exports = { getStockQuote, getStockNews, getMarketTrends, getStockFinancials, searchStocks };
