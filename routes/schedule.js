const express = require("express");
const services = require("../service.js");
const db = require("../query.js");
require("dotenv/config");

const router = express.Router();

function TryParseInt(str, defaultValue) {
  var retValue = defaultValue;
  if (str !== null) {
    if (str.length > 0) {
      if (!isNaN(str)) {
        retValue = parseInt(str);
      }
    }
  }
  return retValue;
}

async function getDataFromAPI(catalog, select, filter) {
  let amount = 800;
  let skip = 0;
  var response = await services.getAPI(
    process.env.URL_DB_SOURCE,
    catalog,
    amount,
    skip,
    select,
    filter
  );
  var i = 0;
  var resultList = response.d.results;
  do {
    console.log("Importing");
    var query = "";
    // positionList.forEach((employee) => {
    //   //query += `INSERT INTO my_bookshop_Position(code,effectiveStartDate,company,businessUnit,targetFTE,division,department) VALUES ('${positionList.code}', '${positionList.effectiveStartDate}','${positionList.company}', '${positionList.businessUnit}','${positionList.targetFTE}','${positionList.division}','${positionList.department}');`;
    // });
    skip += amount;
    response = await services.getAPI(
      process.env.URL_DB_SOURCE,
      catalog,
      amount,
      skip,
      select,
      filter
    );
    i += 1;
    console.log(i + " : " + skip);
    resultList = resultList.concat(response.d.results);
    console.log("Length: " + resultList.length);
  } while (response.d.results.length > 0);
  return resultList;
}

function mergeList(positionList, empJobList) {
  var index = 0;
  var resultList = [];
  do {
    var indexEmbjob = 0;
    do {
      if (
        positionList[index].fte === null ||
        positionList[index].fte === undefined
      )
        positionList[index].fte = 0;
      if (
        positionList[index].termination === null ||
        positionList[index].termination === undefined
      )
        positionList[index].termination = 0;
      if (
        positionList[index].new_hire === null ||
        positionList[index].new_hire === undefined
      )
        positionList[index].new_hire = 0;
      if (
        positionList[index].company === empJobList[indexEmbjob].company &&
        positionList[index].division === empJobList[indexEmbjob].division &&
        positionList[index].businessUnit ===
          empJobList[indexEmbjob].businessUnit &&
        positionList[index].department === empJobList[indexEmbjob].department
      ) {
        positionList[index].fte += parseInt(
          empJobList[indexEmbjob].fte !== null ? empJobList[indexEmbjob].fte : 0
        );

        positionList[index].termination += empJobList[
          indexEmbjob
        ].eventReason.startsWith("TER")
          ? 1
          : 0;

        positionList[index].new_hire +=
          empJobList[indexEmbjob].eventReason === "HIRNEW" ||
          empJobList[indexEmbjob].eventReason === "HIRNEWRE"
            ? 1
            : 0;
      }

      indexEmbjob++;
    } while (indexEmbjob < empJobList.length);
    positionList[index].actual_plan_rate = 0;
    positionList[index].turn_over_rate = 0;
    positionList[index].targetFTE = TryParseInt(
      positionList[index].targetFTE,
      0
    );
    index++;
  } while (index < positionList.length);

  var helper = {};
  resultList = positionList.reduce(function (r, o) {
    var key =
      o.division + "-" + o.businessUnit + "-" + o.department + "-" + o.company;

    if (!helper[key]) {
      helper[key] = Object.assign({}, o);
      r.push(helper[key]);
    } else {
      //  helper[key].fte += o.fte;
      //  helper[key].termination += o.termination;
      helper[key].targetFTE += o.targetFTE;
      //   helper[key].new_hire += o.new_hire;
    }
    return r;
  }, []);

  resultList.map(function (record) {
    record.actual_plan_rate = (record.targetFTE === 0
      ? 0
      : record.fte / record.targetFTE
    ).toFixed(2);
    record.turn_over_rate = (record.termination === 0
      ? 0
      : record.new_hire / record.termination
    ).toFixed(2);
    return record;
  });
  return resultList;
}

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

router.post("/", async (req, res) => {
  let data = req.body;
  var timeString = data["timestamp"];
  var time = timeString.split(":");

  var interval = setInterval(async function () {
    var date = new Date();

    var settedHour =
      parseInt(time[0]) < 7
        ? 24 + (parseInt(time[0]) - 7)
        : parseInt(time[0]) - 7;
    var settedMinute = parseInt(time[1]);

    if (date.getHours() === settedHour && date.getMinutes() === settedMinute) {
      //======================= Get Position
      var positionList = await getDataFromAPI(
        "Position",
        "company,businessUnit,division,department,targetFTE,effectiveStartDate",
        `effectiveStartDate le datetime'${date.toISOString()}'`
      );

      //======================== Get EmpJob
      console.log("======================== Get EmpJob");
      var empJobList = await getDataFromAPI(
        "EmpJob",
        "company,businessUnit,division,department,fte,eventReason,startDate",
        `startDate le datetime'${date.toISOString()}'`
      );

      var resultList = mergeList(positionList, empJobList);
      var query = "";
      resultList.forEach((record) => {
        query += `INSERT INTO my_bookshop_Position_EmpJob VALUES 
          ('${uuidv4()}', 
          '${record.effectiveStartDate}',
          '${record.businessUnit}',
          '${record.division}',
          '${record.company}',
          '${record.department}',
          ${record.targetFTE},
          ${TryParseInt(String(record.termination), 0)},
          ${TryParseInt(String(record.fte), 0)},
          ${
            Number.isNaN(record.actual_plan_rate) ||
            typeof record.actual_plan_rate === "undefined"
              ? 0
              : record.actual_plan_rate
          },
          ${TryParseInt(String(record.new_hire), 0)},
          ${
            Number.isNaN(record.turn_over_rate) ||
            typeof record.turn_over_rate === "undefined"
              ? 0
              : record.turn_over_rate
          });`;
      });
      db.queryDb(query);
    }
  }, 60000);
  res.send(`<h1>Scheduling</h1>`);
});

module.exports = router;
