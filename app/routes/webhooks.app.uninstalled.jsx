import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";

export const action = async ({ request }) => {
  const { shop, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  try {
    // Delete all sessions for this shop
    await prisma.session.deleteMany({ 
      where: { shop } 
    });
    
    return new Response(null, {
      status: 200,
    });
  } catch (error) {
    console.error('Error handling app uninstall:', error);
    return new Response(null, {
      status: 500,
    });
  }
};
