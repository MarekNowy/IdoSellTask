import { parse } from "json2csv";

export const sendCsvResponse = (res, data) => {
  const csv = parse(data);
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
