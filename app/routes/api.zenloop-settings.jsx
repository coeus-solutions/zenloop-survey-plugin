import { authenticate, apiVersion } from "../shopify.server";
import { prisma } from "../db.server";

export const loader = async ({ request }) => {
  await authenticate.public.checkout(request);
};

export const action = async ({ request }) => {
  const { cors, sessionToken } = await authenticate.public.checkout(request);
  const shopDomain = sessionToken?.input_data?.shop?.domain;

  if (!shopDomain) {
    return cors(Response.json({ error: "Shop domain not found" }, { status: 400 }));
  }

  try {
    const session = await prisma.session.findFirst({
      where: { shop: shopDomain }
    });

    if (!session || !session.accessToken) {
      console.error("Shop session not found for domain:", shopDomain);
      return cors(Response.json({ error: "Shop session not found" }, { status: 404 }));
    }
    const data = await fetchMetafields(shopDomain, session.accessToken);

    if (data.errors) {
      console.error("GraphQL errors:", data.errors);
      return cors(Response.json({ error: "Failed to fetch settings" }, { status: 500 }));
    }

    const settings = data.data?.shop?.metafield;

    if (!settings) {
      console.error("Settings metafield not found", data);
      return cors(Response.json({ error: "Settings not found" }, { status: 404 }));
    }

    try {
      const parsedSettings = settings.value ? JSON.parse(settings.value) : null;

      if (!('orgId' in parsedSettings) || !('surveyId' in parsedSettings)) {
        console.error("Settings JSON missing required fields:", parsedSettings);
        return cors(Response.json({ error: "Invalid settings format" }, { status: 400 }));
      }

      return cors(Response.json({ data: parsedSettings }));
    } catch (parseError) {
      console.error("Error parsing settings JSON:", parseError);
      return cors(Response.json({ error: "Failed to fetch settings" }, { status: 500 }));
    }
  } catch (error) {
    console.error("Error fetching Zenloop settings:", error);
    return cors(Response.json({ error: "Failed to fetch settings" }, { status: 500 }));
  }
};

async function fetchMetafields(shopDomain, accessToken) {
  const response = await fetch(`https://${shopDomain}/admin/api/${apiVersion}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken
    },
    body: JSON.stringify({
      query: `
        query getZenloopSettings($namespace: String!, $key: String!) {
          shop {
            metafield(namespace: $namespace, key: $key) {
              id
              value
              type
            }
          }
        }
      `,
      variables: {
        namespace: "zenloop",
        key: "settings",
      },
    })
  });

  return response.json();
}