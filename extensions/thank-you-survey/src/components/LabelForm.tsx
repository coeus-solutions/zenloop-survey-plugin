import { Text, Pressable, InlineStack } from "@shopify/ui-extensions-react/checkout"
import { useState } from "react";

export const LabelForm = ({ surveyUrl, rateCount }: { surveyUrl: string, rateCount: number }) => {
  return (
    <InlineStack blockAlignment={"baseline"} inlineAlignment={"center"} spacing={"tight"} >
      {Array.from({ length: rateCount }, (_, i) => (
        <ScoreItem key={i} rating={(i + 1)} surveyUrl={surveyUrl} />
      ))}
    </InlineStack>
  )
}

function ScoreItem({ key, rating, surveyUrl }: { key: number, rating: number, surveyUrl: string }) {
  const [isHover, setIsHover] = useState(false);

  const paddedRating = (rating: number): string => {
    const space = "\u00A0";
    if (rating > 9) {
      return `${space}${rating}${space}`;
    }

    return `${space}${space}${rating}${space}${space}`;
  }

  return (
    <Pressable
      to={surveyUrl + `&satisfaction_level=${rating}`}
      border={"base"}
      padding={"tight"}
      cornerRadius={"fullyRounded"}
      background={isHover ? "subdued" : "base"}
      onPointerEnter={() => setIsHover(true)}
      onPointerLeave={() => setIsHover(false)}
    >
      <Text appearance={"decorative"} size={"small"}>{paddedRating(rating)}</Text>
    </Pressable>
  )
}