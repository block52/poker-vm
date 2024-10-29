import { exampleState } from "@/types/game";
import { PageLayout } from "../layout/PageLayout";
import Game from "../poker/Game";

export default function GamePage() {

  return (
        <PageLayout>
            <Game state={exampleState} />
        </PageLayout>
    );
}
