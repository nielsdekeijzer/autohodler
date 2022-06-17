const tabletojson = require("tabletojson").Tabletojson;
const map = require('../util/currencySymbolMap');

const bitvavo = require('bitvavo')().options({
    APIKEY: process.env["BITVAVO_API_KEY"],
    APISECRET: process.env["BITVAVO_API_SECRET"],
    ACCESSWINDOW: 10000,
    RESTURL: 'https://api.bitvavo.com/v2',
    DEBUGGING: false
})

module.exports = async function (context) {

    //TODO: error handling
    context.log('Requesting basket from 21shares.com.');
    const url = 'https://21shares.com/product/hodl'
    const options = { onlyColumns: [0, 1], useFirstRowForHeadings: true };
    const tablesAsJson = await tabletojson.convertUrl(url, options);
    const basket = tablesAsJson[1].slice(1); // get table in first index and ignore headers
    context.log(`Done requesting basket. Result: ${JSON.stringify(basket, null, 2)}`);


    function mapCurrencies (basket) {
        return basket.map(i => {
            const currency = map[i.Cryptocurrency.toLowerCase()];
            if (currency === undefined) {
                throw new Error(`Unknown currency: ${i}`);
            }
        })
    }

    const mappedCurrencies = mapCurrencies();


    const deposit = 200; //TODO: balance check, configurable amount
    let orders = [];
    for (let i = 0; i < mappedCurrencies.length; i++) {
        const symbol = mappedCurrencies[i]
        const market = `${symbol}-EUR`;
        const weight = basket[i].Weighting;
        const amountQuote = (deposit * parseFloat(weight) / 100).toString();
        
        let order = bitvavo.placeOrder(market, 'buy', 'market', { amountQuote });
        orders.push(order);
    }

    const allSettled = await Promise.allSettled(orders);
    context.log(allSettled); //TODO: error handling
    return allSettled;
    //TODO: add tests
}