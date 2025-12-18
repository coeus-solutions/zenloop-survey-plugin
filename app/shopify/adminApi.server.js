export async function getShopId(admin) {
  const shopResponse = await admin.graphql(
    `#graphql
      query getShopId {
        shop {
          id
        }
      }`
  );

  const shopData = await shopResponse.json();
  const shopId = shopData.data?.shop?.id;

  if (!shopId) {
    throw new Error("Could not retrieve shop ID");
  }

  return shopId;
}

export async function getMetafield(admin, namespace, key) {
  const response = await admin.graphql(
    `#graphql
      query getShopMetafield($namespace: String!, $key: String!) {
        shop {
          id
          metafield(namespace: $namespace, key: $key) {
            id
            value
          }
        }
      }`,
    {
      variables: {
        namespace,
        key,
      },
    }
  );

  const data = await response.json();
  const shop = data.data?.shop;
  const metafield = shop?.metafield;

  let parsedValue = null;
  if (metafield?.value) {
    try {
      parsedValue = JSON.parse(metafield.value);
    } catch (e) {
      console.error("Failed to parse metafield value:", e);
    }
  }

  return {
    shopId: shop?.id,
    value: parsedValue,
  };
}

export async function setMetafield(admin, namespace, key, value, shopId) {
  const response = await admin.graphql(
    `#graphql
      mutation CreateMetafield($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            id
            namespace
            key
            value
          }
          userErrors {
            field
            message
          }
        }
      }`,
    {
      variables: {
        metafields: [
          {
            namespace,
            key,
            type: "json",
            value: JSON.stringify(value),
            ownerId: shopId,
          },
        ],
      },
    }
  );

  const result = await response.json();
  const userErrors = result.data?.metafieldsSet?.userErrors;

  if (userErrors && userErrors.length > 0) {
    throw new Error(userErrors.map((e) => e.message).join(", "));
  }

  return result.data?.metafieldsSet?.metafields?.[0];
}