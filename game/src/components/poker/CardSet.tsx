import { intToPlayingCard, PlayingCardInfo } from "@/types/game";
import PlayingCard from "./PlayingCard";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface CardSetProps {
    cards: number[];
    name: string,
    children?: React.ReactNode;
}

export default function CardSet({ cards, name, children }: CardSetProps) {
    const cardSet: PlayingCardInfo[] = cards.map(card => intToPlayingCard(card));
    return (
        <Card className="mt-2">
            <CardHeader>
                <CardTitle>{name.charAt(0).toUpperCase() + name.slice(1)} Cards</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex gap-2">
                    {cardSet.map((card, index) => (
                        <PlayingCard key={`card-${name}-${index}`} card={card} />
                    ))}
                </div>
            </CardContent>
            {children}
        </Card>
    );
}
