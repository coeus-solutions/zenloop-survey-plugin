import {
  BlockStack,
  View,
  Link,
  TextBlock,
  Heading,
  Button,
} from "@shopify/ui-extensions-react/checkout";

export const SingleLink = ({ surveyUrl }: { surveyUrl: string }) => {
  return (
    <View
      border="base"
      padding="loose"
      cornerRadius="base"
      background="subdued"
    >
      <BlockStack spacing="loose" inlineAlignment="center">
        <Heading level={2}>Your Opinion Matters</Heading>
        <TextBlock size="medium">
          How was your shopping experience with us?
        </TextBlock>

        <BlockStack spacing="tight" inlineAlignment="center">
          <Link to={surveyUrl} external>
            <Button kind="primary">
              Share Your Feedback
            </Button>
          </Link>


          <TextBlock size="small" appearance="subdued">
            Takes less than 2 minutes • Your feedback is anonymous
          </TextBlock>
        </BlockStack>
      </BlockStack>
    </View>
  );
}