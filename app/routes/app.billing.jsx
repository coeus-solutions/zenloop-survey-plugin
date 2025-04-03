import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { billing } = await authenticate.admin(request);

  // This creates a recurring charge
  const billingConfig = {
    recurring: {
      interval: "EVERY_30_DAYS",
      chargeName: "Zenloop Surveys Subscription",
      amount: 9.99, // Monthly subscription fee
      currencyCode: "USD",
      trialDays: 14,
    },
    replacement: true,
    test: process.env.NODE_ENV === "development",
  };

  const response = await billing.require(billingConfig);
  return json(response);
};

export default function Billing() {
  const data = useLoaderData();
  return null; // This route only handles the billing requirement
} 