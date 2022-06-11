const axios = require("axios");
const appConfig = require("../../config/app");
const secret = require("../../config/secret");
const BASE_URL = appConfig.coinmarketcap.baseUrl;

module.exports = class CoinmarketcapClient {
  static request(axiosOptions) {
    let updatedAxiosOptions = {
      ...axiosOptions,
      url: BASE_URL + axiosOptions.url,
      headers: {
        "X-CMC_PRO_API_KEY": secret.coinmarketcapAPIKey,
      },
    };

    return axios(updatedAxiosOptions);
  }

  static now() {
    return CoinmarketcapClient.request({
      method: appConfig.coinmarketcap.latestPrice.method,
      url: appConfig.coinmarketcap.latestPrice.path,
    });
  }
};
