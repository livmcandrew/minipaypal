// app.js
process.argv
const integrationArg = process.argv.find(arg => arg.startsWith("int="));
const integration = integrationArg?.split("=")[1];
const express = require("express");
const path = require("path");
const btcheckout = require("./routes/btcheckout");
const { json, urlencoded } = require("body-parser");
const braintree = require("braintree");
require("dotenv").config();
const app = express();
//console.log(integration)


app.use(json());
app.use(urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

// Include your idempotency key when you make an API request.
const requestOptions = { idempotencyKey: "YOUR_IDEMPOTENCY_KEY" };

app.use("/btcheckout", btcheckout);

// run server 
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(3000, () => {
  console.log("App listening on port 3000");
});

module.exports = app;
const gateway = new braintree.BraintreeGateway({
    environment: braintree.Environment.Sandbox,
    merchantId: process.env.BT_MERCHANT_ID,
    publicKey: process.env.BT_PUBLIC_KEY,
    privateKey: process.env.BT_PRIVATE_KEY,
});
exports.gateway = gateway;



//to run app either choose:
//node app.js int=bt
//node app.js int=pp