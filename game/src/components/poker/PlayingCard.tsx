import { PlayingCardEnum, PlayingCardInfo, Suit } from "@/types/game";

interface PlayingCardProps {
    card?: PlayingCardInfo | undefined;
    hidden?: boolean;
    className?: string;
}

const PlayingCard: React.FC<PlayingCardProps> = ({
    card,
    hidden = false,
    className = ""
}) => {
    if (!card) {
        return null;
    }

    const suitToColor: Record<Suit, string> = {
        [Suit.HEARTS]: "text-red-500",
        [Suit.DIAMONDS]: "text-red-500",
        [Suit.CLUBS]: "text-black",
        [Suit.SPADES]: "text-black",
        [Suit.UNKNOWN]: "text-blue-900"
    };

    const color = suitToColor[card.suit];

    return (
        <div
            className={`
        ${color}
        inline-flex
        items-center
        justify-center
        w-16
        h-18
        content-center
        pb-2
        bg-white
        text-8xl
        ${hidden ? "bg-blue-900 text-opacity-0" : "hover:shadow-lg"}
        transition-shadow
        ${className}
      `}
        >
            {card?.unicode}
        </div>
    );
};

export default PlayingCard;
