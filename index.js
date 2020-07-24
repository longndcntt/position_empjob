const express = require("express");
const app = express();
const router = express.Router();
const path = __dirname; // this folder should contain your html files.
const bodyParser = require("body-parser");
const cors = require("cors");
const db = require("./query.js");
const position_empjobRoutes = require("./routes/position_empjob");
const scheduleRoutes = require("./routes/schedule");

app.use("/node_modules", express.static(__dirname + "/node_modules")); // redirect bootstrap JS
app.use("/bower_components", express.static(__dirname + "/bower_components"));
app.use("/views", express.static(__dirname + "/views"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/", router);
app.use(cors());
app.use("/position_empjob", position_empjobRoutes);
app.use("/schedule", scheduleRoutes);


//#region get
router.get("/", async function (req, res) {
  res.sendFile(path + "/views/index.html");
});
//#endregion

//#region POST
app.post("/delete", async function (req, res) {
  db.queryDb("DELETE FROM my_bookshop_Position_EmpJob");
  res.send(`<h1>Deleted</h1>`);
});
//#endregion

var port = process.env.PORT || 8080;
app.listen(port, function () {
  console.log("Live at Port 8080");
});
