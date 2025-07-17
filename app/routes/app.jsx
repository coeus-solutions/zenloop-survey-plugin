import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }) => {
  // Replace with the "app_handle" from your shopify.app.toml file
  const appHandle = "zenloop-surveys-1";

  // Authenticate with Shopify credentials to handle server-side queries
  const { billing, redirect, session } = await authenticate.admin(request);

  // Check whether the store has an active subscription
  const { hasActivePayment } = await billing.check();

  // Extract the store handle from the shop domain
  const shop = session.shop; // e.g., "cool-shop.myshopify.com"
  const storeHandle = shop.replace('.myshopify.com', '');

  // If there's no active subscription, redirect to the plan selection page
  if (!hasActivePayment) {
    return redirect(`https://admin.shopify.com/store/${storeHandle}/charges/${appHandle}/pricing_plans`, {
      target: "_top", // required since the URL is outside the embedded app scope
    });
  }

  return json({ apiKey: process.env.SHOPIFY_API_KEY || "" });
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
