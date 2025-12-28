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
 * Format results as string
 */
function formatResults(stats: TestStats): string {
    let output = "";
    output += "\n" + "=".repeat(80) + "\n";
    output += "PHH DATASET TEST RESULTS\n";
    output += "=".repeat(80) + "\n";
    output += `\nTotal Hands Tested:    ${stats.totalHands}\n`;
    output += `Successful Hands:      ${stats.successfulHands}\n`;
    output += `Failed Hands:          ${stats.failedHands}\n`;
    output += `\nSuccess Rate:          ${stats.successRate.toFixed(2)}%\n`;
    output += `Failure Rate:          ${(100 - stats.successRate).toFixed(2)}%\n`;
    return output;
}

/**
 * Print detailed test results
 */
function printResults(stats: TestStats) {
    const output = formatResults(stats);
    console.log(output);

    let detailsOutput = "";

    if (stats.errors.size > 0) {
        detailsOutput += "\n" + "-".repeat(80) + "\n";
        detailsOutput += "ERROR BREAKDOWN\n";
        detailsOutput += "-".repeat(80) + "\n";

        // Sort errors by frequency
        const sortedErrors = Array.from(stats.errors.entries())
            .sort((a, b) => b[1] - a[1]);

        for (const [error, count] of sortedErrors) {
            const percentage = (count / stats.failedHands * 100).toFixed(1);
            detailsOutput += `\n[${count} occurrences - ${percentage}% of failures]\n`;
            detailsOutput += `  ${error}\n`;
        }
    }

    if (stats.failedHandDetails.length > 0) {
        detailsOutput += "\n" + "-".repeat(80) + "\n";
        detailsOutput += `FAILED HAND SAMPLES (showing first ${stats.failedHandDetails.length})\n`;
        detailsOutput += "-".repeat(80) + "\n";

        for (const detail of stats.failedHandDetails.slice(0, 10)) {
            detailsOutput += `\nFile: ${detail.file}\n`;
            detailsOutput += `  Actions: ${detail.actionsExecuted}/${detail.totalActions} executed\n`;
            detailsOutput += `  Error: ${detail.error}\n`;
        }

        if (stats.failedHandDetails.length > 10) {
            detailsOutput += `\n... and ${stats.failedHandDetails.length - 10} more failed hands\n`;
        }
    }

    detailsOutput += "\n" + "=".repeat(80) + "\n";
    console.log(detailsOutput);
}

/**
 * Generate markdown report with tables
 */
function generateMarkdownReport(stats: TestStats, datasetPath: string, maxHands: number): string {
    const timestamp = new Date().toISOString();
    let md = `# PHH Dataset Test Report\n\n`;
    md += `**Generated:** ${timestamp}\n\n`;
    md += `**Dataset:** \`${datasetPath}\`\n\n`;
    md += `**Max Hands:** ${maxHands}\n\n`;

    md += `---\n\n`;

    // Summary table
    md += `## Summary\n\n`;
    md += `| Metric | Value | Percentage |\n`;
    md += `|--------|------:|----------:|\n`;
    md += `| Total Hands Tested | ${stats.totalHands} | 100.00% |\n`;
    md += `| Successful Hands | ${stats.successfulHands} | ${stats.successRate.toFixed(2)}% |\n`;
    md += `| Failed Hands | ${stats.failedHands} | ${(100 - stats.successRate).toFixed(2)}% |\n\n`;

    // Success rate visualization
    const successBars = Math.round(stats.successRate / 2);
    const failBars = 50 - successBars;
    md += `### Success Rate: ${stats.successRate.toFixed(2)}%\n\n`;
    md += `\`\`\`\n`;
    md += `[${'█'.repeat(successBars)}${'░'.repeat(failBars)}]\n`;
    md += `\`\`\`\n\n`;

    if (stats.errors.size > 0) {
        md += `---\n\n`;
        md += `## Error Breakdown\n\n`;
        md += `| Error | Count | % of Failures |\n`;
        md += `|-------|------:|--------------:|\n`;

        const sortedErrors = Array.from(stats.errors.entries())
            .sort((a, b) => b[1] - a[1]);

        for (const [error, count] of sortedErrors) {
            const percentage = (count / stats.failedHands * 100).toFixed(1);
            // Escape pipe characters in error messages
            const escapedError = error.replace(/\|/g, '\\|');
            md += `| ${escapedError} | ${count} | ${percentage}% |\n`;
        }
        md += `\n`;

        // Error category chart
        md += `### Top Error Categories\n\n`;
        const topErrors = sortedErrors.slice(0, 5);
        for (const [error, count] of topErrors) {
            const barLength = Math.round((count / stats.failedHands) * 40);
            const percentage = (count / stats.failedHands * 100).toFixed(1);
            md += `**${error.substring(0, 60)}${error.length > 60 ? '...' : ''}**\n`;
            md += `\`\`\`\n`;
            md += `[${'█'.repeat(barLength)}${' '.repeat(40 - barLength)}] ${count} (${percentage}%)\n`;
            md += `\`\`\`\n\n`;
        }
    }

    if (stats.failedHandDetails.length > 0) {
        md += `---\n\n`;
        md += `## Failed Hands Details\n\n`;
        md += `Total failed hands: **${stats.failedHandDetails.length}**\n\n`;

        // Group by error type
        const groupedByError = new Map<string, typeof stats.failedHandDetails>();
        for (const detail of stats.failedHandDetails) {
            const errorKey = detail.error;
            if (!groupedByError.has(errorKey)) {
                groupedByError.set(errorKey, []);
            }
            groupedByError.get(errorKey)!.push(detail);
        }

        for (const [error, hands] of groupedByError) {
            md += `### ${error}\n\n`;
            md += `**Count:** ${hands.length} hands\n\n`;
            md += `| File | Actions Executed | Total Actions |\n`;
            md += `|------|----------------:|-------------:|\n`;

            // Show first 10 of each error type
            const samplesToShow = hands.slice(0, 10);
            for (const hand of samplesToShow) {
                md += `| ${hand.file} | ${hand.actionsExecuted} | ${hand.totalActions} |\n`;
            }

            if (hands.length > 10) {
                md += `\n*... and ${hands.length - 10} more hands with this error*\n`;
            }
            md += `\n`;
        }
    }

    md += `---\n\n`;
    md += `## Test Configuration\n\n`;
    md += `- **Test Runner:** PHH Dataset Test\n`;
    md += `- **Dataset Path:** \`${datasetPath}\`\n`;
    md += `- **Max Hands:** ${maxHands}\n`;
    md += `- **Success Threshold:** 90.00%\n`;
    md += `- **Test Passed:** ${stats.successRate >= 90.0 ? '✅ Yes' : '❌ No'}\n\n`;

    return md;
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

        // Save results to file
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const reportPath = path.join(__dirname, `../../test-results/phh-test-${timestamp}.txt`);

        // Ensure directory exists
        const reportDir = path.dirname(reportPath);
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }

        // Build full report
        let fullReport = `PHH Dataset Test Report\n`;
        fullReport += `Generated: ${new Date().toISOString()}\n`;
        fullReport += `Dataset: ${datasetPath}\n`;
        fullReport += `Max Hands: ${maxHands}\n`;
        fullReport += formatResults(stats);

        // Add error breakdown
        if (stats.errors.size > 0) {
            fullReport += "\n" + "-".repeat(80) + "\n";
            fullReport += "ERROR BREAKDOWN\n";
            fullReport += "-".repeat(80) + "\n";

            const sortedErrors = Array.from(stats.errors.entries())
                .sort((a, b) => b[1] - a[1]);

            for (const [error, count] of sortedErrors) {
                const percentage = (count / stats.failedHands * 100).toFixed(1);
                fullReport += `\n[${count} occurrences - ${percentage}% of failures]\n`;
                fullReport += `  ${error}\n`;
            }
        }

        // Add all failed hands
        if (stats.failedHandDetails.length > 0) {
            fullReport += "\n" + "-".repeat(80) + "\n";
            fullReport += `ALL FAILED HANDS (${stats.failedHandDetails.length} total)\n`;
            fullReport += "-".repeat(80) + "\n";

            for (const detail of stats.failedHandDetails) {
                fullReport += `\nFile: ${detail.file}\n`;
                fullReport += `  Actions: ${detail.actionsExecuted}/${detail.totalActions} executed\n`;
                fullReport += `  Error: ${detail.error}\n`;
            }
        }

        fullReport += "\n" + "=".repeat(80) + "\n";

        fs.writeFileSync(reportPath, fullReport);
        console.log(`\nText report saved to: ${reportPath}`);

        // Generate markdown report
        const mdReportPath = reportPath.replace('.txt', '.md');
        const mdReport = generateMarkdownReport(stats, datasetPath, maxHands);
        fs.writeFileSync(mdReportPath, mdReport);
        console.log(`Markdown report saved to: ${mdReportPath}`);

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
