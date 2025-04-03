import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }) => {
  const { billing, admin } = await authenticate.admin(request);

  // Check if billing is required
  await billing.require({
    recurring: {
      interval: "EVERY_30_DAYS",
      chargeName: "Zenloop Surveys Subscription",
      amount: 9.99,
      currencyCode: "USD",
      trialDays: 14,
    },
    replacement: true,
    test: process.env.NODE_ENV === "development",
  });

  return json({ apiKey: process.env.SHOPIFY_API_KEY });
};

export default function App() {
  const { apiKey } = useLoaderData();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <NavMenu>
        <Link to="/app" rel="home">
          Home
        </Link>
      </NavMenu>
      <Outlet />
    </AppProvider>
  );
}

// Catch any errors
export function ErrorBoundary() {
  const error = useRouteError();
  return (
    <AppProvider isEmbeddedApp>
      <div style={{ padding: "1rem" }}>
        <h1>Error</h1>
        <p>{error.message}</p>
      </div>
    </AppProvider>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
