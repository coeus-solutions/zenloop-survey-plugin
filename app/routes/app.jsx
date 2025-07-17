import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";
import { useEffect } from "react";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }) => {
  try {
    // Replace with the "app_handle" from your shopify.app.toml file
    const appHandle = "zenloop-surveys-1";

    console.log("Starting authentication...");
    // Authenticate with Shopify credentials to handle server-side queries
    const { billing, session } = await authenticate.admin(request);
    console.log("Authentication successful");

    // Get URL parameters to check if user is returning from plan selection
    const url = new URL(request.url);
    const chargeId = url.searchParams.get('charge_id');
    const planParam = url.searchParams.get('plan');
    
    // If user is returning from plan selection, they should have active payment now
    if (chargeId || planParam) {
      console.log("User returning from plan selection:", { chargeId, planParam });
      // Give some time for the subscription to activate
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log("Checking billing status...");
    // Check whether the store has an active subscription
    const { hasActivePayment } = await billing.check();
    console.log("Billing check completed");

    // Extract the store handle from the shop domain
    const shop = session.shop; // e.g., "cool-shop.myshopify.com"
    const storeHandle = shop.replace('.myshopify.com', '');
    
    console.log("Billing check results:", { hasActivePayment, storeHandle, appHandle });
    
    // If there's no active subscription, return billing info for frontend redirect
    if (!hasActivePayment) {
      console.log("No active payment - will redirect via App Bridge");
      return json({ 
        apiKey: process.env.SHOPIFY_API_KEY || "",
        needsBilling: true,
        planSelectionUrl: `https://admin.shopify.com/store/${storeHandle}/charges/${appHandle}/pricing_plans`
      });
    }

    console.log("Active subscription found - loading app normally");
    return json({ 
      apiKey: process.env.SHOPIFY_API_KEY || "",
      needsBilling: false,
      planSelectionUrl: null
    });
  } catch (error) {
    console.error("Error in app loader:", error);
    return json({ 
      apiKey: process.env.SHOPIFY_API_KEY || "",
      needsBilling: false,
      planSelectionUrl: null,
      error: error.message
    }, { status: 500 });
  }
};

export default function App() {
  const { apiKey, needsBilling, planSelectionUrl, error } = useLoaderData();
  console.log("app.jsx component loading:", { needsBilling, planSelectionUrl, error });

  // If there's an error, display it
  if (error) {
    return (
      <div style={{ padding: "20px", color: "red" }}>
        <h2>Error</h2>
        <p>{error}</p>
        <p>Please refresh the page or contact support.</p>
      </div>
    );
  }

  // If billing is needed, redirect using window.open as fallback
  useEffect(() => {
    if (needsBilling && planSelectionUrl) {
      console.log("Redirecting to plan selection:", planSelectionUrl);
      // Use window.open with _top to break out of iframe
      window.open(planSelectionUrl, '_top');
    }
  }, [needsBilling, planSelectionUrl]);

  // Show loading message while redirecting
  if (needsBilling && planSelectionUrl) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Redirecting to Plan Selection...</h2>
        <p>Please wait while we redirect you to select a plan.</p>
      </div>
    );
  }

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
