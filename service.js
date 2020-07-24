const o = require("odata").o;
const fetch = require("node-fetch");
var token = require("basic-auth-token");
require("dotenv/config");

function getRequest(url, catalog, filter = 5) {
  var option = {
    headers: new fetch.Headers({
      "Content-Type": "application/json",
    }),
  };
  return new Promise(function (success, failure) {
    o(url, option)
      .get(catalog)
      .query({ $top: filter })
      .then(function (data) {
        success(data);
      })
      .catch(function (error) {
        failure(error);
      });
  });
}

module.exports = {
  getAPI: async function (url, catalog, amount = 5, skip = 0, select, filter) {
    var basicToken = token(process.env.USERNAME_API, process.env.PW_API);
    var option = {
      headers: new fetch.Headers({
        "Content-Type": "application/json",
        "Authorization": `Basic ${basicToken}`,
      }),
    };
    var response = await o(url, option)
      .get(catalog)
      .query({
        $top: amount,
        $skip: skip,
        $format: "json",
        $select: select,
        $filter: filter,
      })
      .catch(function (error) {
        console.log(error.status);
        console.log(error.statusText);
        console.log(option);
      });
    return response;
  },

  multilAPI: async function () {
    var response;
    await getRequest(
      "https://my-bookshop-srv-insightful-cheetah-ev.cfapps.us10.hana.ondemand.com/catalog/",
      "Authors"
    )
      .then(function (body1) {
        return getRequest(
          "https://my-bookshop-srv-insightful-cheetah-ev.cfapps.us10.hana.ondemand.com/catalog/",
          "Authors"
        );
      })
      .then(function (body2) {
        response += body2;
        return getRequest(
          "https://my-bookshop-srv-insightful-cheetah-ev.cfapps.us10.hana.ondemand.com/catalog/",
          "Authors"
        );
      })
      .then(function (body3) {
        response += body3;
      });

    return response;
  },
  promiseAllAPI: async function () {
    return Promise.all([
      getRequest(
        `https://my-bookshop-srv-insightful-cheetah-ev.cfapps.us10.hana.ondemand.com/catalog/`,
        "Authors"
      ),
      getRequest(
        `https://my-bookshop-srv-insightful-cheetah-ev.cfapps.us10.hana.ondemand.com/catalog/`,
        "Books"
      ),
      getRequest(`https://api10.successfactors.com/odata/v2/`, "Position", 5),
    ])
      .then((responses) => {
        console.log(responses);
        for (let response of responses) {
          console.log(`${response.url}: ${response.status}`);
        }

        return responses;
      })
      .then((responses) => Promise.all(responses.map((r) => console.log(r))))
      .catch(function (err) {
        console.log(err);
      });
  },
};
