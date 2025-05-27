// scripts/compoundinterestcalc-script.js

// --- Debounce Function ---
// Prevents a function from being called too frequently, useful for input events.
function debounce(func, delay) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

// All DOM manipulation and event listener setup should happen after the DOM is fully loaded.
document.addEventListener('DOMContentLoaded', function() {
    // --- DOM Elements ---
    const initialInvestmentInput = document.getElementById('initialInvestment');
    const annualContributionInput = document.getElementById('annualContribution');
    const annualInterestRateInput = document.getElementById('annualInterestRate');
    const compoundingFrequencySelect = document.getElementById('compoundingFrequency');
    const investmentPeriodInput = document.getElementById('investmentPeriod');
    const calculateBtn = document.getElementById('calculateBtn');

    const totalPrincipalInvestedSpan = document.getElementById('totalPrincipalInvested');
    const totalInterestEarnedSpan = document.getElementById('totalInterestEarned');
    const endingBalanceSpan = document.getElementById('endingBalance');
    const compoundChartCanvas = document.getElementById('compoundChart'); // Get the canvas element

    let compoundChart; // Variable to hold the Chart.js instance

    // --- Core Calculation Function ---
    function calculateCompoundInterest() {
        console.log('Calculating Compound Interest...'); // Debugging log

        let initialInvestment = parseFloat(initialInvestmentInput.value) || 0;
        let annualContribution = parseFloat(annualContributionInput.value) || 0;
        const annualInterestRate = parseFloat(annualInterestRateInput.value) || 0;
        const compoundingFrequency = compoundingFrequencySelect.value;
        const investmentPeriodYears = parseFloat(investmentPeriodInput.value) || 0;

        console.log(`Inputs: Initial=${initialInvestment}, AnnualCont=${annualContribution}, Rate=${annualInterestRate}, Freq=${compoundingFrequency}, Years=${investmentPeriodYears}`); // Debugging logs

        // --- Input Validation ---
        if (initialInvestment < 0 || annualContribution < 0 || annualInterestRate < 0 || investmentPeriodYears <= 0) {
            console.error('Please enter valid, non-negative values for all inputs. Investment Period must be greater than 0.');
            totalPrincipalInvestedSpan.textContent = '$0.00';
            totalInterestEarnedSpan.textContent = '$0.00';
            endingBalanceSpan.textContent = '$0.00';
            updateChart(0, 0); // Clear chart
            return;
        }

        const rate = annualInterestRate / 100;

        let compoundingPeriodsPerYear;
        switch (compoundingFrequency) {
            case 'annually':
                compoundingPeriodsPerYear = 1;
                break;
            case 'quarterly':
                compoundingPeriodsPerYear = 4;
                break;
            case 'monthly':
                compoundingPeriodsPerYear = 12;
                break;
            case 'daily':
                compoundingPeriodsPerYear = 365; // Assuming 365 days
                break;
            default:
                compoundingPeriodsPerYear = 1; // Default to annually if somehow not set
        }

        const totalCompoundingPeriods = investmentPeriodYears * compoundingPeriodsPerYear;
        const periodicRate = rate / compoundingPeriodsPerYear;
        const periodicContribution = annualContribution / compoundingPeriodsPerYear;

        let currentBalance = initialInvestment;
        // Total principal includes initial investment plus all contributions over the period
        let totalPrincipalAdded = initialInvestment;

        for (let i = 1; i <= totalCompoundingPeriods; i++) {
            // Add periodic contribution at the start of each period before compounding
            currentBalance += periodicContribution;
            // Accumulate principal for tracking. Note: This adds *all* potential contributions.
            // If interest is only applied on the existing balance, the "principal added" calculation
            // is simpler for a final summary.
            if (i > 1) { // Initial investment is already counted
                totalPrincipalAdded += periodicContribution;
            }

            // Apply interest to the current balance
            currentBalance *= (1 + periodicRate);
        }

        // The interest earned is the final balance minus the total amount of money *put in*
        let totalInterestEarned = currentBalance - totalPrincipalAdded;

        // Ensure interest is not negative due to floating point errors or if initial/contributions are 0
        if (totalInterestEarned < 0) {
            totalInterestEarned = 0;
        }

        // --- Display Results ---
        totalPrincipalInvestedSpan.textContent = `$${totalPrincipalAdded.toFixed(2)}`;
        totalInterestEarnedSpan.textContent = `$${totalInterestEarned.toFixed(2)}`;
        endingBalanceSpan.textContent = `$${currentBalance.toFixed(2)}`;

        // Update the chart with the new data
        updateChart(totalPrincipalAdded, totalInterestEarned);
        console.log('Compound Interest calculation complete. Principal:', totalPrincipalAdded, 'Interest:', totalInterestEarned, 'Ending Balance:', currentBalance); // Debugging log
    }

    // --- Chart Update Function ---
    function updateChart(principal, interest) {
        console.log('Updating chart with data:', { principal, interest }); // Debugging: Chart data received

        if (compoundChart) {
            compoundChart.destroy(); // Destroy existing chart before creating a new one
        }

        // Only create chart if there's data to display
        if (principal > 0 || interest > 0) {
            compoundChart = new Chart(compoundChartCanvas, {
                type: 'pie',
                data: {
                    labels: ['Total Principal Invested', 'Total Interest Earned'],
                    datasets: [{
                        data: [principal, interest],
                        backgroundColor: ['#007bff', '#28a745'], // Blue for Principal, Green for Interest
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom', // Place legend below the chart
                        },
                        title: {
                            display: false, // Title handled by HTML h3
                        }
                    }
                }
            });
            console.log('Compound Chart created.'); // Debugging log
        } else {
            // Clear canvas if no data (e.g., all inputs are zero or invalid)
            const ctx = compoundChartCanvas.getContext('2d');
            ctx.clearRect(0, 0, compoundChartCanvas.width, compoundChartCanvas.height);
            console.log('No data for Compound Chart, canvas cleared.'); // Debugging log
        }
    }

    // --- Event Listeners for Live Update and Button ---
    const debouncedCalculate = debounce(calculateCompoundInterest, 300); // Debounce for 300ms

    // Attach 'input' listeners to number fields for live updates
    initialInvestmentInput.addEventListener('input', debouncedCalculate);
    annualContributionInput.addEventListener('input', debouncedCalculate);
    annualInterestRateInput.addEventListener('input', debouncedCalculate);
    investmentPeriodInput.addEventListener('input', debouncedCalculate);

    // Attach 'change' listener to the select element for live updates
    compoundingFrequencySelect.addEventListener('change', debouncedCalculate);

    // Attach 'click' listener to the calculate button (for immediate calculation if preferred)
    calculateBtn.addEventListener('click', calculateCompoundInterest);

    // Initial calculation on page load to display default values
    calculateCompoundInterest();
});
