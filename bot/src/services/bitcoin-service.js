const CoinmarketcapClient = require("../clients/coinmarketcap-client");

module.exports = class BitcoinService {
  static async now() {
    let nowResult;
    try {
      nowResult = await CoinmarketcapClient.now();
    } catch (err) {
      throw err;
    }

    const bitcoin = nowResult.data.data.filter((x) => x.symbol === "BTC");

    if (bitcoin.length < 1) {
      throw new Error("did not find bitcoin");
    }

    return bitcoin[0];
  }
};
