import { setPromises } from "./serviceHelper.js";
import { configDotenv } from "dotenv";
import { postUrl } from "./config.js";
configDotenv();

const API_KEY = process.env.API_KEY;

export const fetchData = async () => {
  const fetchPromises = [];
  const result = [];
  const options = {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "X-API-KEY": API_KEY,
    },
    body: JSON.stringify({ params: { resultsPage: 0, resultsLimit: 100 } }),
  };

  const firstPageResponse = await fetch(postUrl, options);
  if (firstPageResponse.status !== 200) {
    console.error("Can not get the first page:", firstPageResponse.status);
    return;
  }

  const firstPageData = await firstPageResponse.json();
  result.push(firstPageData);
  const totalPages = firstPageData.resultsNumberPage;

  if (totalPages > 0) {
    setPromises(API_KEY, postUrl, fetchPromises, totalPages, result);
  }

  await Promise.all(fetchPromises);

  return result;
};
