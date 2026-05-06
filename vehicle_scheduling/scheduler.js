/**
 * Solves the 0/1 Knapsack problem to maximize impact within mechanic hours.
 * @param {Array} vehicles - Array of objects { TaskID, Duration, Impact }
 * @param {number} budget - Max mechanic hours available
 * @returns {Object} - { selectedTasks: Array, totalImpact: number, totalDuration: number }
 */
function solveKnapsack(vehicles, budget) {
    const n = vehicles.length;
    // dp[i][w] will be the maximum impact that can be attained with weight w using first i items
    const dp = Array.from({ length: n + 1 }, () => Array(budget + 1).fill(0));

    for (let i = 1; i <= n; i++) {
        const { Duration, Impact } = vehicles[i - 1];
        for (let w = 0; w <= budget; w++) {
            if (Duration <= w) {
                dp[i][w] = Math.max(Impact + dp[i - 1][w - Duration], dp[i - 1][w]);
            } else {
                dp[i][w] = dp[i - 1][w];
            }
        }
    }

    // Backtrack to find selected tasks
    const selectedTasks = [];
    let w = budget;
    let totalImpact = dp[n][budget];
    let totalDuration = 0;

    for (let i = n; i > 0 && w > 0; i--) {
        if (dp[i][w] !== dp[i - 1][w]) {
            const task = vehicles[i - 1];
            selectedTasks.push(task);
            w -= task.Duration;
            totalDuration += task.Duration;
        }
    }

    return {
        selectedTasks: selectedTasks.reverse(),
        totalImpact,
        totalDuration
    };
}

module.exports = { solveKnapsack };
