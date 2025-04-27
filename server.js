import { fetchData } from "./Services/fetchData.js";
import {
  sendCsvResponse,
  findOrderById,
  foundOrdersByAmount,
  validateMinAndMax,
} from "./Services/serverHelper.js";
import { parse } from "json2csv";
import expressBasicAuth from "express-basic-auth";
import cron from "node-cron";
import express from "express";
import { configDotenv } from "dotenv";
import { formatData } from "./Services/serviceHelper.js";
const app = express();
let result = [];
let formattedData = [];
let csv = null;

configDotenv();

const API_KEY = process.env.API_KEY;
const USER_PASSWORD = process.env.USER_PASSWORD;

const start = async () => {
  result = await fetchData();
  formattedData = formatData(result);
  csv = parse(formattedData);
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
  const filtered = foundOrdersByAmount(formattedData, minWorth, maxWorth);

  if (filtered.length == 0) {
    res.header("Content-Type", "text/plain");
    res.status(400);
    res.send("No value in the indicated range");
    return;
  }
  sendCsvResponse(res, filtered);
});

app.get("/orders/:orderId", (req, res) => {
  const orderId = req.params.orderId;
  try {
    const order = findOrderById(orderId, formattedData);

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
