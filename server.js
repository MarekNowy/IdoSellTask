import { fetchData } from "./Services/fetchData.js";
import {
  sendCsvResponse,
  findOrderById,
  foundOrdersByAmount,
  validateMinAndMax,
  saveOrdersToFile,
  saveFetchDateToFile,
  flattenOrdersForCsv,
  createCSVFile,
} from "./Services/serverHelper.js";
import expressBasicAuth from "express-basic-auth";
import cron from "node-cron";
import express from "express";
import { configDotenv } from "dotenv";
import { formatData } from "./Services/serviceHelper.js";
const app = express();
let result = [];
let csv = null;
let data;

configDotenv();

const USER_PASSWORD = process.env.USER_PASSWORD;

const fields = ["orderId", "orderWorth", "productId", "quantity"];
const opts = {
  fields,
  delimiter: ";",
  quote: "",
  header: true,
  quoted: false,
  quoted_header: true,
};

const start = async () => {
  result = await fetchData();
  if (Array.isArray(result) && result.length > 0) {
    saveFetchDateToFile();
    const formattedData = formatData(result);
    saveOrdersToFile(formattedData);
    data = createCSVFile(opts, csv);
  } else {
    saveFetchDateToFile();
    data = createCSVFile(opts, csv);
    console.log("No data received from the fetchData function");
  }
};

const users = {
  admin: USER_PASSWORD,
};

app.use(
  expressBasicAuth({
    users: users,
    challenge: true,
    unauthorizedResponse: "Access denied",
  })
);

cron.schedule(
  "0 1 * * *",
  async () => {
    start();
  },
  {
    timezone: "Europe/Warsaw",
  }
);

app.get("/orders", (req, res) => {
  const { minWorth, maxWorth } = req.query;
  const isValid = validateMinAndMax(minWorth, maxWorth);
  if (!isValid) {
    res.header("Content-Type", "text/plain");
    res.status(400);
    res.send("Incorrect input");
    return;
  }

  const filtered = foundOrdersByAmount(data, minWorth, maxWorth);
  const filteredFlat = flattenOrdersForCsv(filtered);
  if (filteredFlat.length == 0) {
    res.header("Content-Type", "text/plain");
    res.status(400);
    res.send("No value in the indicated range");
    return;
  }
  sendCsvResponse(res, filteredFlat, fields);
});

app.get("/orders/:orderId", (req, res) => {
  const orderId = req.params.orderId;
  try {
    const order = findOrderById(orderId, data);

    if (!order) {
      return res.status(404).send("Order not found");
    }

    res.send(order);
  } catch (error) {
    console.error("Error while searching for the order:", error);
    res.status(500).send("Internal Server Error");
  }
});

start().then(() =>
  app.listen(3000, () => {
    console.log("Server is listening on port 3000");
  })
);
