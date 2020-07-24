var hana = require("@sap/hana-client");
require("dotenv/config");

var connOptions = {
  serverNode: process.env.SERVER_NODE,
  encrypt: "true",
  currentschema: process.env.SCHEMA_DB,
  uid: process.env.USERID_DB,
  pwd: process.env.PW_DB,
  //"Xw5934dGo4CnEAVkCzhn.NlRZX2xWfpek3oerTr0cj-ae_sE9ZXCJIvGxvHIzjIvUMt_8bgx.kYIf_nctpsj4pGgS0OYZoSjbp4VkjsFk3YpXTWBxC6l8CgA2kuvS7lo",
  sslValidateCertificate: "false",
};
var connection = hana.createConnection();
function disconnect(err) {
  connection.disconnect(function (err) {
    if (err) {
      return console.error(err);
    }
  });
}
function runQueries(queries, callback1) {
  queries.forEach((query) => {
    connection.exec(query, callback1);
  });
}

// inspired by: http://stackoverflow.com/a/12920211/3110929
var splitStringBySemicolon = function (s) {
  /**
   * Reverse the string
   */
  var rev = s.split("").reverse().join("");

  /**
   * Only split on non escape semicolons.
   */ s;
  var commands = rev
    .split(/;(?=[^\\])/g)
    .reverse()
    .map(function (s) {
      /**
       * Put string back into order and return string chunk
       */
      return s.split("").reverse().join("").trim();
    });

  for (var i = 0; i < commands.length; i++) {
    if (commands[i].replace(/ /g, "").length == 0) {
      commands.splice(i, 1);
    }
  }

  return commands;
};
module.exports = {
  queryDb: async function (queryParam, callback) {
    var result;
    connection.connect(connOptions, function (err) {
      if (err) {
        return console.error(err);
      }
      var queries = splitStringBySemicolon(queryParam);
      runQueries(queries, callback);
      //var sql = "INSERT INTO my_bookshop_Authors VALUES(108,'Ellite');";
      // var sql =
      //   "INSERT INTO mytable(code,effectiveStartDate,cust_subCode,cust_subDepartment,businessUnit,lastModifiedDateTime,jobTitle,criticality,createdDateTime,jobCode,type,incumbent,cust_payGradeLevel,division,payRange,cust_subDepartment2,regularTemporary,costCenter,standardHours,legacyPositionId,externalName_localized,mdfSystemRecordStatus,vacant,effectiveStatus,technicalParameters,cust_employmentType,externalName_vi_VN,effectiveEndDate,positionCriticality,positionTitle,cust_mid,description,externalName_defaultValue,positionControlled,cust_IncentivePlan2,payGrade,company,cust_compensationpackage,department,employeeClass,cust_max,creationSource,changeReason,targetFTE,lastModifiedBy,jobLevel,transactionSequence,cust_incentivePlan,createdBy,mdfSystemOptimisticLockUUID,comment,location,multipleIncumbentsAllowed,cust_min,externalName_en_US,externalName_en_DEBUG) VALUES ('1','/Date(1590624000000)/',NULL,NULL,'GLB6','/Date(1592468625000+0000)/','Compensation & Benefits - Experienced Professional  (P2)',NULL,'/Date(1590646371000+0000)/','2019-804','RP',NULL,4,'GLB.BS','GR-CV07',NULL,NULL,'GLB_CC_HR',44,NULL,'C&B','N','false','A',NULL,NULL,'Nhân viên C&B','/Date(253402214400000)/',NULL,NULL,15150000,NULL,'C&B','true',NULL,'GR-CV07','CMCGLOBAL',NULL,'QTNL',NULL,17700000,'IMPORT','updatePosition',2,'CMC000810',2,1,NULL,'CMC000154','395DF8D5D41148E4AAD427235E7FF47F',NULL,'CGLOBALHN','true',12600000,'C&B',NULL);";
      // var rows = connection.exec(query, function (err, rows) {
      //   if (err) {
      //     return console.error(err);
      //   }
      //   console.log(util.inspect(rows, { colors: false }));
      //   // var t1 = performance.now();
      //   //   console.log("time in ms " +  (t1 - t0));
      // });
    });
    disconnect();
    return result;
  },
};
