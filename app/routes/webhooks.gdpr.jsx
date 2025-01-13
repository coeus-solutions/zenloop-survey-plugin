import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  const { topic, shop, session } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  switch (topic) {
    case "customers/data_request":
      // Since we don't store customer data, we can return an empty response
      return new Response(JSON.stringify({ message: "No customer data stored" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    case "customers/redact":
      // Since we don't store customer data, we can return success
      return new Response(JSON.stringify({ message: "No customer data to erase" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    case "shop/redact":
      // Delete shop's metafield data
      if (session) {
        const { admin } = await authenticate.admin(request);
        try {
          await admin.graphql(`
            mutation metafieldDelete($input: MetafieldsDeleteInput!) {
              metafieldsDelete(input: $input) {
                deletedId
                userErrors {
                  field
                  message
                }
              }
            }
          `, {
            variables: {
              input: {
                namespace: "zenloop",
                key: "settings",
                ownerType: "SHOP"
              }
            }
          });
        } catch (error) {
          console.error('Error deleting metafield:', error);
        }
      }

      return new Response(JSON.stringify({ message: "Shop data erased" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    default:
      return new Response(JSON.stringify({ message: "Unhandled topic" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
  }
}; 