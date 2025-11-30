export interface CashFlow {
    amount: number;
    date: Date;
}

/**
 * Calculates the Extended Internal Rate of Return (XIRR) for a series of cash flows.
 * Uses the Newton-Raphson method to solve for the rate.
 * 
 * @param cashFlows Array of cash flows (amount and date). 
 *                  Negative amounts represent outflows (investments), 
 *                  positive amounts represent inflows (returns/current value).
 * @param guess Initial guess for the rate (default 0.1).
 * @returns The XIRR as a decimal (e.g., 0.10 for 10%), or null if it fails to converge.
 */
export function calculateXIRR(cashFlows: CashFlow[], guess: number = 0.1): number | null {
    if (cashFlows.length < 2) return null;

    // Check if we have at least one positive and one negative value
    const hasPositive = cashFlows.some(cf => cf.amount > 0);
    const hasNegative = cashFlows.some(cf => cf.amount < 0);
    if (!hasPositive || !hasNegative) return null;

    const maxIterations = 100;
    const tolerance = 1e-7;
    let rate = guess;

    const t0 = cashFlows[0].date.getTime(); // Reference date (first cash flow)
    const daysToYears = 1000 * 60 * 60 * 24 * 365;

    for (let i = 0; i < maxIterations; i++) {
        let fValue = 0;
        let fDerivative = 0;

        for (const cf of cashFlows) {
            const dt = (cf.date.getTime() - t0) / daysToYears;
            const factor = Math.pow(1 + rate, dt);

            fValue += cf.amount / factor;
            fDerivative -= (dt * cf.amount) / (factor * (1 + rate));
        }

        if (Math.abs(fValue) < tolerance) {
            return rate * 100; // Return as percentage
        }

        if (Math.abs(fDerivative) < tolerance) {
            return null; // Derivative too close to zero, Newton method fails
        }

        const newRate = rate - fValue / fDerivative;

        if (Math.abs(newRate - rate) < tolerance) {
            return newRate * 100; // Return as percentage
        }

        rate = newRate;
    }

    return null; // Failed to converge
}
