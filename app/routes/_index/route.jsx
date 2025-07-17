import { redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { login } from "../../shopify.server";
import styles from "./styles.module.css";

export const links = () => [
  { rel: "stylesheet", href: styles },
];

export const loader = async ({ request }) => {
  const url = new URL(request.url);

  // Let Shopify handle the installation flow including plan selection
  // Don't redirect directly to /app - let managed pricing work
  
  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData();

  return (
    <div className={styles.index}>
      <div className={styles.content}>
        <h1 className={styles.heading}>Zenloop Customer Experience Surveys</h1>
        <p className={styles.text}>
          Boost your customer satisfaction by collecting valuable feedback with Zenloop's powerful NPS and customer experience platform.
        </p>
        {showForm && (
          <Form className={styles.form} method="post" action="/auth/login">
            <label className={styles.label}>
              <span>Shop domain</span>
              <input className={styles.input} type="text" name="shop" />
              <span>e.g: my-shop-domain.myshopify.com</span>
            </label>
            <button className={styles.button} type="submit">
              Log in
            </button>
          </Form>
        )}
        <ul className={styles.list}>
          <li>
            <strong>Post-Purchase Surveys</strong>. Automatically collect customer feedback right after purchase to understand their shopping experience and measure satisfaction.
          </li>
          <li>
            <strong>NPS Tracking</strong>. Track and analyze your Net Promoter Score to identify promoters and areas for improvement in your customer experience.
          </li>
          <li>
            <strong>Seamless Integration</strong>. Easy setup with your Shopify store - just connect your Zenloop account and start gathering valuable customer insights.
          </li>
        </ul>
      </div>
      <footer className={styles.footer}>
        <div className={styles["footer-content"]}>
          <div className={styles.copyright}>
            © {new Date().getFullYear()} SaaS.group zenloop GmbH
          </div>
          <div className={styles["legal-links"]}>
            <a href="https://www.zenloop.com/en/legal/terms-of-service/" target="_blank" rel="noopener noreferrer">
              Terms and Conditions
            </a>
            <a href="https://www.zenloop.com/en/legal/privacy/" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
