export const formatData = (result) => {
  const formattedData = [];
  for (let x = 0; x < result.length; x++) {
    for (let y = 0; y < result[x].Results.length; y++) {
      let orderId = result[x].Results[y].orderId;
      let products = [];

      let order = result[x].Results[y].orderDetails.payments.orderBaseCurrency;

      let total =
        order.orderProductsCost +
        order.orderDeliveryCost +
        order.orderPayformCost +
        order.orderInsuranceCost +
        order.orderDeliveryVat +
        order.orderPayformVat +
        order.orderInsuranceVat;

      let productResults = result[x].Results[y].orderDetails.productsResults;

      for (let j = 0; j < productResults.length; j++) {
        const prod = productResults[j];
        products.push({
          productId: prod.productId,
          quantity: prod.productQuantity,
        });
      }

      let data = {
        orderId: orderId,
        products: products,
        orderWorth: total,
      };

      formattedData.push(data);
    }
  }
  return formattedData;
};

export const setPromises = (API_KEY, postUrl, totalPages, result) => {
  let fetchPromises = [];
  for (let x = 1; x <= totalPages; x++) {
    const pageOptions = {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "X-API-KEY": API_KEY,
      },
      body: JSON.stringify({ params: { resultsPage: x, resultsLimit: 100 } }),
    };

    const fetchPromise = fetch(postUrl, pageOptions)
      .then((response) => response.json())
      .then((data) => {
        if (data && data.Results) {
          result.push(data);
        }
      })
      .catch((err) => {
        console.error(`Can not get the page number ${x}:`, err);
      });

    fetchPromises.push(fetchPromise);
  }
  return fetchPromises;
};
