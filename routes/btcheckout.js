// checkout.js - sever side 
const express = require("express");
const braintree = require("braintree");
const { resolve } = require("path");
const { rejects } = require("assert");
const dotenv = require("dotenv").config();

const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: process.env.BT_MERCHANT_ID,
  publicKey: process.env.BT_PUBLIC_KEY,
  privateKey: process.env.BT_PRIVATE_KEY,
});

const router = express.Router();

// GET Token API to reteive client token
router.get("/", (req, res) => {
  gateway.clientToken.generate({merchantAccountId: "liv_app" }, (err, response) => {
    if (err) {
      console.error("clientToken.generate error:", err);
      return res.status(500).send({ error: err.message || err });
    }
    return res.send(response.clientToken);
  });
});

// POST transcation.sale API to make sale
router.post("/",  express.json(), (req, res) => {
  const { paymentMethodNonce, deviceData, amount, storeInVault, lineItems } = req.body;

  gateway.transaction.sale(
    {
      deviceData,
      paymentMethodNonce,
      amount,
      ...(lineItems && { lineItems }), // include lineItems if provided
      merchantAccountId: "liv_app",
      options: {
        submitForSettlement: true,
        storeInVaultOnSuccess: !!storeInVault, // vault only when asked
      },
    },
    (error, result) => {
      if (error || !result?.success) {
        return res.status(500).send({
          success: false,
          error: error?.message || result?.message || error,
          result,
        });
      }

      // For vaulted payments - stores values in storage
      const paymentMethodToken =
        result.transaction?.creditCard?.token ||
        result.transaction?.paypalAccount?.token ||
        null;

      const customerId =
        result.transaction?.customer?.id ||
        result.transaction?.customerId ||
        null;

      return res.send({
        success: true,
        transactionId: result.transaction.id,
        paymentMethodToken,
        customerId,
        result,
      });
    }
  );
});

// POST transcation.sale API with vaulted payment method to make sale
router.post("/vaultedPayment", express.json(), (req, res) => {
  const { paymentMethodToken, deviceData, amount, lineItems } = req.body;

  gateway.transaction.sale(
    {
      deviceData,
      paymentMethodToken,       // the permanent vault token, not a nonce
      amount,
      ...(lineItems && { lineItems }),
      merchantAccountId: "liv_app",
      options: {
        submitForSettlement: true,
      },
    },
    (error, result) => {
      if (error || !result?.success) {
        return res.status(500).send({
          success: false,
          error: error?.message || result?.message || error,
          result,
        });
      }

      return res.send({
        success: true,
        transactionId: result.transaction.id,
        paymentMethodToken: result.transaction.paymentMethodToken,
        customerId: result.transaction.customer?.id,
        result,
      });
    }
  );
});


module.exports = router;