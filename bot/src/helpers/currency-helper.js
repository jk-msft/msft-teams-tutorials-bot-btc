module.exports = class CurrencyHelper {
  static formatToUSD(rawDouble) {
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    });

    return formatter.format(rawDouble);
  }
};
