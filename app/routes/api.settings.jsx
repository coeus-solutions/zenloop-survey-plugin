import { json } from "@remix-run/node";
import { prisma } from "../db.server";

export const loader = async ({ request }) => {
  // Handle preflight request
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Max-Age": "86400"
      }
    });
  }

  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return json({ error: "Shop parameter is required" }, { 
      status: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "*"
      }
    });
  }

  try {
    const settings = await prisma.merchantSettings.findUnique({
      where: { shop },
    });

    if (!settings) {
      return json({ error: "Settings not found" }, { 
        status: 404,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "*"
        }
      });
    }

    return json(settings, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "*",
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return json({ error: "Failed to fetch settings" }, { 
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "*"
      }
    });
  }
}; 