import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Winner } from "@/types/game";

const WinnerList: React.FC<{ winners: Winner[] }> = ({ winners }) => {
    return (
        <Card className="mt-2">
            <CardHeader>
                <CardTitle>Winner(s)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-2">
                    {winners.map((winner) => (
                        <div><span className="font-bold">{winner.address}:</span> ${winner.amount}</div>
                    ))}
                </div>
            </CardContent>
        </Card>);
};


export default WinnerList;
