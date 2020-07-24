const express = require("express");
const db = require("../query.js");

const router = express.Router();

router.get("/all", async (req, res) => {
  try {
    db.queryDb(
      "Select fte, actual_plan_rate, new_hire, turn_over_rate, termination, targetFTE, (CASE WHEN businessUnit = 'null' THEN '' ELSE businessUnit END) AS businessUnit, (CASE WHEN division = 'null' THEN '' ELSE division END) AS division, (CASE WHEN company = 'null' THEN '' ELSE company END) AS company, (CASE WHEN department = 'null' THEN '' ELSE department END) AS department FROM my_bookshop_Position_EmpJob",
      function (err, data) {
        console.log(data);
        res.json(data);
      }
    );
  } catch (error) {
    res.json({ message: err });
  }
});

router.get("/filter", async (req, res) => {
  try {
    var filter = req.query.filter;
    db.queryDb(
      `SELECT *, A.fte / A.targetFTE AS actual_plan_rate, (CASE WHEN A.termination = 0 THEN 0 ELSE A.new_hire / A.termination END) AS turn_over_rate FROM (SELECT (CASE WHEN ${filter} = 'null' THEN '' ELSE ${filter} END) AS ${filter}, SUM(targetFTE) AS targetFTE, SUM(fte) AS fte, SUM(termination) AS termination, SUM(new_hire) AS new_hire  FROM  my_bookshop_Position_EmpJob GROUP BY ${filter}) AS A;`,
      function (err, data) {
        res.json(data);
      }
    );
  } catch (error) {
    res.json({ message: err });
  }
});

module.exports = router;
