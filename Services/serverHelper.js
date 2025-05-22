import { parse } from "json2csv";
import { readFileSync } from "fs";
import * as fs from "fs";

export const saveOrdersToFile = (orders) => {
  let data = [];
  if (fs.existsSync("data.json")) {
    data = JSON.parse(fs.readFileSync("data.json", "utf-8"));
  }

  const existingIds = new Set(data.map((order) => order.orderId));

  const newOrders = orders.filter((order) => !existingIds.has(order.orderId));
  if (newOrders.length > 0) {
    data.push(...newOrders);
    fs.writeFileSync("data.json", JSON.stringify(data, null, 2), "utf-8");
  }
};
//it looks weird createCSVfilr does not return csv
export const createCSVFile = (opts, csv) => {
  let data = readFileSync("data.json", "utf-8");
  data = JSON.parse(data);
  const flat = flattenOrdersForCsv(data);
  csv = parse(flat, opts);
  return data;
};

export const saveFetchDateToFile = () => {
  fs.writeFileSync(
    "meta.json",
    JSON.stringify({ lastFetch: currentDate() }, null, 2)
  );
};

const currentDate = () => {
  const now = new Date();
  const formattedDate =
    now.getFullYear() +
    "-" +
    String(now.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(now.getDate()).padStart(2, "0") +
    " " +
    String(now.getHours()).padStart(2, "0") +
    ":" +
    String(now.getMinutes()).padStart(2, "0") +
    ":" +
    String(now.getSeconds()).padStart(2, "0");

  return formattedDate;
};

export const flattenOrdersForCsv = (orders) => {
  const rows = [];
  orders.forEach((order) => {
    if (order.products && order.products.length > 0) {
      order.products.forEach((product) => {
        rows.push({
          orderId: order.orderId,
          orderWorth: order.orderWorth,
          productId: product.productId,
          quantity: product.quantity,
        });
      });
    } else {
      rows.push({
        orderId: order.orderId,
        orderWorth: order.orderWorth,
        productId: "",
        quantity: "",
      });
    }
  });
  return rows;
};

export const sendCsvResponse = (res, data, fields) => {
  const csv = parse(data, { fields, delimiter: ";" });
  res.header("Content-Type", "text/csv");
  res.status(200);
  res.attachment("orders.csv");
  res.send(csv);
};

export const findOrderById = (orderId, data) => {
  return data.find((order) => order.orderId == orderId);
};

export const foundOrdersByAmount = (data, min, max) => {
  if (!min && !max) {
    return data;
  }

  const filteredData = data.filter(
    (data) => data.orderWorth >= min && data.orderWorth <= max
  );
  return filteredData;
};

export const validateMinAndMax = (min, max) => {
  if (!min && !max) {
    return true;
  }

  if ((min && !max) || (!min && max)) {
    return false;
  }

  min = Number(min);
  max = Number(max);

  if (isNaN(min) || isNaN(max)) {
    return false;
  }

  if (min >= max) {
    return false;
  }

  return true;
};
