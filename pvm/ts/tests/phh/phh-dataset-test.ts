/**
 * PHH Dataset Test Runner
 * Tests TexasHoldem engine against hands from the phh-dataset repository
 * Repository: https://github.com/block52/phh-dataset
 */

import { PhhRunner, PhhRunResult } from "../../src/testing/phhRunner";
import * as fs from "fs";
import * as path from "path";

interface TestStats {
    totalHands: number;
    successfulHands: number;
    failedHands: number;
    successRate: number;
    errors: Map<string, number>; // Error message -> count
    failedHandDetails: Array<{
        file: string;
        error: string;
        actionsExecuted: number;
        totalActions: number;
    }>;
}

/**
 * Find all .phh files in a directory recursively
 */
function findPhhFiles(dir: string, limit: number = Infinity): string[] {
    const phhFiles: string[] = [];

    function traverse(currentDir: string) {
        if (phhFiles.length >= limit) return;

        try {
            const entries = fs.readdirSync(currentDir, { withFileTypes: true });

            for (const entry of entries) {
                if (phhFiles.length >= limit) return;

                const fullPath = path.join(currentDir, entry.name);

                if (entry.isDirectory()) {
                    traverse(fullPath);
                } else if (entry.isFile() && entry.name.endsWith(".phh")) {
                    phhFiles.push(fullPath);
                }
            }
        } catch (err) {
            console.warn(`Warning: Could not read directory ${currentDir}:`, err);
        }
    }

    traverse(dir);
    return phhFiles;
}

/**
 * Run tests on PHH dataset
 */
async function testPhhDataset(datasetPath: string, maxHands: number = 1000): Promise<TestStats> {
    const runner = new PhhRunner();

    const stats: TestStats = {
        totalHands: 0,
        successfulHands: 0,
        failedHands: 0,
        successRate: 0,
        errors: new Map(),
        failedHandDetails: []
    };

    console.log(`\nSearching for PHH files in: ${datasetPath}`);
    const phhFiles = findPhhFiles(datasetPath, maxHands);

    console.log(`Found ${phhFiles.length} PHH files (limit: ${maxHands})`);
    console.log(`\nTesting hands...\n`);

    const progressInterval = Math.max(1, Math.floor(phhFiles.length / 20)); // 5% increments

    for (let i = 0; i < phhFiles.length; i++) {
        const file = phhFiles[i];

        try {
            const content = fs.readFileSync(file, "utf-8");
            const result: PhhRunResult = await runner.runHand(content);

            stats.totalHands++;

            if (result.success) {
                stats.successfulHands++;
            } else {
                stats.failedHands++;

                // Track error types
                const errorMsg = result.error || "Unknown error";
                stats.errors.set(errorMsg, (stats.errors.get(errorMsg) || 0) + 1);

                // Store failed hand details (limit to first 50 for readability)
                if (stats.failedHandDetails.length < 50) {
                    stats.failedHandDetails.push({
                        file: path.basename(file),
                        error: errorMsg,
                        actionsExecuted: result.actionsExecuted,
                        totalActions: result.totalActions
                    });
                }
            }

            // Progress indicator
            if ((i + 1) % progressInterval === 0 || i === phhFiles.length - 1) {
                const progress = ((i + 1) / phhFiles.length * 100).toFixed(1);
                const currentSuccessRate = stats.totalHands > 0
                    ? (stats.successfulHands / stats.totalHands * 100).toFixed(2)
                    : "0.00";
                console.log(
                    `Progress: ${i + 1}/${phhFiles.length} (${progress}%) | ` +
                    `Success: ${stats.successfulHands} | ` +
                    `Failed: ${stats.failedHands} | ` +
                    `Rate: ${currentSuccessRate}%`
                );
            }
        } catch (err) {
            console.error(`Error processing file ${file}:`, err);
            stats.failedHands++;
            stats.totalHands++;
        }
    }

    // Calculate final success rate
    stats.successRate = stats.totalHands > 0
        ? (stats.successfulHands / stats.totalHands * 100)
        : 0;

    return stats;
}

/**
 * Print detailed test results
 */
function printResults(stats: TestStats) {
    console.log("\n" + "=".repeat(80));
    console.log("PHH DATASET TEST RESULTS");
    console.log("=".repeat(80));
    console.log(`\nTotal Hands Tested:    ${stats.totalHands}`);
    console.log(`Successful Hands:      ${stats.successfulHands}`);
    console.log(`Failed Hands:          ${stats.failedHands}`);
    console.log(`\nSuccess Rate:          ${stats.successRate.toFixed(2)}%`);
    console.log(`Failure Rate:          ${(100 - stats.successRate).toFixed(2)}%`);

    if (stats.errors.size > 0) {
        console.log("\n" + "-".repeat(80));
        console.log("ERROR BREAKDOWN");
        console.log("-".repeat(80));

        // Sort errors by frequency
        const sortedErrors = Array.from(stats.errors.entries())
            .sort((a, b) => b[1] - a[1]);

        for (const [error, count] of sortedErrors) {
            const percentage = (count / stats.failedHands * 100).toFixed(1);
            console.log(`\n[${count} occurrences - ${percentage}% of failures]`);
            console.log(`  ${error}`);
        }
    }

    if (stats.failedHandDetails.length > 0) {
        console.log("\n" + "-".repeat(80));
        console.log(`FAILED HAND SAMPLES (showing first ${stats.failedHandDetails.length})`);
        console.log("-".repeat(80));

        for (const detail of stats.failedHandDetails.slice(0, 10)) {
            console.log(`\nFile: ${detail.file}`);
            console.log(`  Actions: ${detail.actionsExecuted}/${detail.totalActions} executed`);
            console.log(`  Error: ${detail.error}`);
        }

        if (stats.failedHandDetails.length > 10) {
            console.log(`\n... and ${stats.failedHandDetails.length - 10} more failed hands`);
        }
    }

    console.log("\n" + "=".repeat(80));
}

/**
 * Main execution
 */
async function main() {
    const args = process.argv.slice(2);
    const datasetPath = args[0] || path.join(__dirname, "../../../phh-dataset");
    const maxHands = args[1] ? parseInt(args[1]) : 1000;

    console.log("PHH Dataset Test Runner");
    console.log("=".repeat(80));
    console.log(`Dataset Path: ${datasetPath}`);
    console.log(`Max Hands: ${maxHands}`);

    // Check if dataset exists
    if (!fs.existsSync(datasetPath)) {
        console.error(`\nError: Dataset directory not found at: ${datasetPath}`);
        console.error("\nPlease clone the dataset first:");
        console.error("  git clone https://github.com/block52/phh-dataset.git");
        console.error("\nOr specify a custom path:");
        console.error("  npm run test:phh-dataset /path/to/phh-dataset [max-hands]");
        process.exit(1);
    }

    try {
        const stats = await testPhhDataset(datasetPath, maxHands);
        printResults(stats);

        // Exit with error code if success rate is below threshold
        const threshold = 90.0;
        if (stats.successRate < threshold) {
            console.log(`\nWarning: Success rate ${stats.successRate.toFixed(2)}% is below threshold ${threshold}%`);
            process.exit(1);
        }
    } catch (err) {
        console.error("Fatal error during testing:", err);
        process.exit(1);
    }
}

// Run if executed directly
if (require.main === module) {
    main();
}

export { testPhhDataset, findPhhFiles, printResults };
