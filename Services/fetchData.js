import { setPromises } from "./serviceHelper.js";
import { configDotenv } from "dotenv";
import { postUrl } from "./config.js";
import { readFileSync, existsSync } from "fs";
configDotenv();

const API_KEY = process.env.API_KEY;

let lastFetch;

if (existsSync("meta.json")) {
  lastFetch = JSON.parse(readFileSync("meta.json", "utf-8"));
  lastFetch = lastFetch.lastFetch;
} else {
  lastFetch = undefined;
}

export const fetchData = async () => {
  let fetchPromises = [];
  const result = [];
  const options = {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "X-API-KEY": API_KEY,
    },
    body: JSON.stringify({
      params: {
        resultsPage: 0,
        resultsLimit: 100,
        ordersRange: {
          ordersDateRange: {
            ordersDateType: "add",
            ordersDateBegin: lastFetch ?? "1000-01-01 00:00:00",
          },
        },
      },
    }),
  };

  const firstPageResponse = await fetch(postUrl, options);
  const response = await firstPageResponse.json();

  if (firstPageResponse.status === 207 && response.errors) {
    console.error(response.errors.faultString);
    return [];
  }

  if (firstPageResponse.status !== 200 && firstPageResponse.status !== 207) {
    console.error("Can not get the first page:", firstPageResponse.status);
    return [];
  }

  if (!response) {
    console.log("No data received from the first page");
    return [];
  }
  result.push(response);
  const totalPages = response.resultsNumberPage;

  if (totalPages > 0) {
    fetchPromises.push(...setPromises(API_KEY, postUrl, totalPages, result));
  }

  const results = await Promise.allSettled(fetchPromises);
  results.forEach((res, idx) => {
    if (res.status === "rejected") {
      console.error(`Error on page ${idx + 1}:`, res.reason);
    }
  });

  return result;
};
