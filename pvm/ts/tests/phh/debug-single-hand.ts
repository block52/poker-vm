import { PhhRunner } from "../../src/testing/phhRunner";
import { PhhParser } from "../../src/testing/phhParser";
import * as fs from "fs";
import * as path from "path";

async function debugSingleHand() {
    // Test 1: Working fixture
    console.log("=== Test 1: Working pluribus fixture ===");
    const fixturePath = path.join(__dirname, "fixtures/pluribus-30-0.phh");
    const fixtureContent = fs.readFileSync(fixturePath, "utf-8");

    const runner1 = new PhhRunner();
    const result1 = await runner1.runHand(fixtureContent);
    console.log("Result:", {
        success: result1.success,
        error: result1.error,
        actionsExecuted: result1.actionsExecuted,
        totalActions: result1.totalActions
    });

    // Test 2: Dataset hand with single quotes
    console.log("\n=== Test 2: Dataset hand with single quotes ===");

    // First test parsing just the players line
    const testParser = new PhhParser();
    const testValue = "['MrBlue', 'MrPink', 'Bill', 'Eddie', 'Joe', 'Pluribus']";
    console.log("Testing parseStringArray with:", testValue);
    const testResult = (testParser as any).parseStringArray(testValue);
    console.log("Result:", testResult);

    const phhContent = `variant = 'NT'
ante_trimming_status = true
antes = [0, 0, 0, 0, 0, 0]
blinds_or_straddles = [50, 100, 0, 0, 0, 0]
min_bet = 100
starting_stacks = [10000, 10000, 10000, 10000, 10000, 10000]
actions = ['d dh p1 Jh8c', 'd dh p2 9d9c', 'd dh p3 4d2c', 'd dh p4 5s4s', 'd dh p5 2h3c', 'd dh p6 7sAs', 'p3 f', 'p4 f', 'p5 cbr 225', 'p6 f', 'p1 f', 'p2 f']
hand = 0
players = ['MrBlue', 'MrPink', 'Bill', 'Eddie', 'Joe', 'Pluribus']
finishing_stacks = [9950, 9900, 10000, 10000, 10150, 10000]`;

    const runner2 = new PhhRunner();

    // Debug: Parse the hand to see what we get
    const parser = new PhhParser();
    const parsed = parser.parse(phhContent);
    console.log("Parsed hand:");
    console.log("  Variant:", `'${parsed.hand.variant}'`);
    console.log("  Players:", parsed.hand.players);
    console.log("  Actions count:", parsed.actions.length);
    console.log("  Actions raw:", parsed.hand.actions.slice(0, 3));

    const result2 = await runner2.runHand(phhContent);
    console.log("\nResult:", {
        success: result2.success,
        error: result2.error,
        actionsExecuted: result2.actionsExecuted,
        totalActions: result2.totalActions
    });

    // Test 3: Actual dataset file
    console.log("\n=== Test 3: Actual dataset file ===");
    const datasetFile = "/Users/lucascullen/Github/block52/phh-dataset/0.phh";
    if (fs.existsSync(datasetFile)) {
        const datasetContent = fs.readFileSync(datasetFile, "utf-8");
        console.log("File content preview:");
        console.log(datasetContent.substring(0, 200));

        const runner3 = new PhhRunner();
        const result3 = await runner3.runHand(datasetContent);
        console.log("\nResult:", {
            success: result3.success,
            error: result3.error,
            actionsExecuted: result3.actionsExecuted,
            totalActions: result3.totalActions
        });
    } else {
        console.log("Dataset file not found");
    }
}

debugSingleHand();
