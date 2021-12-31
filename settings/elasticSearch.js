const esConfig = require("../config/elasticSearch");
const ES = require("elasticsearch");

const {address, port} = esConfig;

module.exports = () => {
  return new ES.Client({
    host: address + ":" + port,
    requestTimeout: 90000,
    apiVersion: '6.8'
  });
}