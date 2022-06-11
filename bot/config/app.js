module.exports = {
  coinmarketcap: {
    baseUrl: "https://pro-api.coinmarketcap.com",
    authHeaderName: "X-CMC_PRO_API_KEY",
    latestPrice: {
      method: "GET",
      path: "/v1/cryptocurrency/listings/latest",
    },
  },
  bitcoin: "btc",
};
