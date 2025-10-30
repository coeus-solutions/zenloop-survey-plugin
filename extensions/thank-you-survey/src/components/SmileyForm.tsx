import { Text, Pressable, InlineStack } from "@shopify/ui-extensions-react/checkout"
import { useState } from "react";

type ScoreItemProps = {
  emojis: string[],
  key: number,
  rating: number,
  surveyUrl: string
}

export const SmileyForm = ({ surveyUrl, rateCount }: { surveyUrl: string, rateCount: number }) => {
  const emojis = getEmojisForRating(rateCount);

  return (
    <InlineStack blockAlignment={"baseline"} inlineAlignment={"center"} spacing={"extraTight"}>
      {Array.from({ length: rateCount }, (_, i) => (
        <ScoreItem emojis={emojis} key={i} rating={(i + 1)} surveyUrl={surveyUrl} />
      ))}
    </InlineStack>
  )
}

function ScoreItem({ emojis, key, rating, surveyUrl }: ScoreItemProps) {
  const [isHover, setIsHover] = useState(false);

  return (
    <Pressable
      key={key}
      to={surveyUrl + `&satisfaction_level=${rating}`}
      border={"dotted"}
      background={isHover ? "subdued" : "base"}
      onPointerEnter={() => setIsHover(true)}
      onPointerLeave={() => setIsHover(false)}
      padding={"extraTight"}
    >
      <Text appearance={"decorative"} size={"large"}>{emojis[rating - 1]}</Text>
    </Pressable>
  )
}

function getEmojisForRating(rateCount: number): string[] {
  switch (rateCount) {
    case 10:
      return ["😡", "😠", "😖", "☹️", "😕", "😐", "🙂", "😊", "😃", "🤩"];
    case 9:
      return ["😠", "😖", "☹️", "😕", "😐", "🙂", "😊", "😃", "🤩"]
    case 8:
      return ["😖", "☹️", "😕", "😐", "🙂", "😊", "😃", "🤩"]
    case 7:
      return ["😖", "☹️", "😕", "😐", "🙂", "😊", "😃"]
    case 6:
      return ["☹️", "😕", "😐", "🙂", "😊", "😃"]
    case 5:
      return ["☹️", "😕", "😐", "🙂", "😊"]
    case 4:
      return ["☹️", "😐", "🙂", "😊"]
    case 3:
      return ["☹️", "😐", "😊"]
    default:
      return ["☹️", "😊"]
  }
}