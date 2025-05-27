// scripts/retirementcalc-script.js

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

document.addEventListener('DOMContentLoaded', function() {
    // --- Input elements ---
    const currentAgeInput = document.getElementById('currentAge');
    const retirementAgeInput = document.getElementById('retirementAge');
    const currentSavingsInput = document.getElementById('currentSavings');
    const annualContributionInput = document.getElementById('annualContribution');
    const annualReturnRateInput = document.getElementById('annualReturnRate');
    const annualInflationRateInput = document.getElementById('annualInflationRate');
    const calculateBtn = document.getElementById('calculateBtn');

    // --- Output elements ---
    const yearsUntilRetirementSpan = document.getElementById('yearsUntilRetirement');
    const totalPrincipalInvestedSpan = document.getElementById('totalPrincipalInvested');
    const totalInterestEarnedSpan = document.getElementById('totalInterestEarned');
    const projectedNominalBalanceSpan = document.getElementById('projectedNominalBalance');
    const projectedRealBalanceSpan = document.getElementById('projectedRealBalance');
    const retirementChartCanvas = document.getElementById('retirementChart'); // Get the canvas element

    let retirementChart; // Variable to hold the Chart.js instance

    // --- Core Calculation Function ---
    function calculateRetirementSavings() {
        console.log('Calculating Retirement Savings...'); // Debugging log

        const currentAge = parseInt(currentAgeInput.value) || 0;
        const retirementAge = parseInt(retirementAgeInput.value) || 0;
        let currentSavings = parseFloat(currentSavingsInput.value) || 0;
        const annualContribution = parseFloat(annualContributionInput.value) || 0;
        const annualReturnRate = parseFloat(annualReturnRateInput.value) / 100 || 0;
        const annualInflationRate = parseFloat(annualInflationRateInput.value) / 100 || 0;

        console.log(`Inputs: CurrentAge=${currentAge}, RetAge=${retirementAge}, Savings=${currentSavings}, Cont=${annualContribution}, ReturnRate=${annualReturnRate}, InflationRate=${annualInflationRate}`); // Debugging logs

        // --- Input Validation ---
        if (isNaN(currentAge) || currentAge < 18 || isNaN(retirementAge) || retirementAge <= currentAge ||
            isNaN(currentSavings) || currentSavings < 0 || isNaN(annualContribution) || annualContribution < 0 ||
            isNaN(annualReturnRate) || annualReturnRate < 0 || isNaN(annualInflationRate) || annualInflationRate < 0) {
            console.error('Please enter valid, non-negative values for all inputs. Current Age must be 18+, Retirement Age must be greater than Current Age.');
            yearsUntilRetirementSpan.textContent = 'N/A';
            totalPrincipalInvestedSpan.textContent = '$0.00';
            totalInterestEarnedSpan.textContent = '$0.00';
            projectedNominalBalanceSpan.textContent = '$0.00';
            projectedRealBalanceSpan.textContent = '$0.00';
            updateChart(0, 0); // Clear chart
            return;
        }

        const yearsToRetirement = retirementAge - currentAge;

        let projectedNominalBalance = currentSavings;
        let totalPrincipalInvested = currentSavings; // Tracks initial + all future contributions

        // Loop through each year
        for (let i = 0; i < yearsToRetirement; i++) {
            // Add annual contribution at the beginning of each year (then it compounds for the full year)
            projectedNominalBalance += annualContribution;
            totalPrincipalInvested += annualContribution;

            // Apply annual return
            projectedNominalBalance *= (1 + annualReturnRate);
        }

        let totalInterestEarned = projectedNominalBalance - totalPrincipalInvested;
        if (totalInterestEarned < 0) { // Prevent negative interest if returns are very low/negative
            totalInterestEarned = 0;
        }

        // Adjust for inflation (convert future nominal value to today's real value)
        const projectedRealBalance = projectedNominalBalance / Math.pow(1 + annualInflationRate, yearsToRetirement);

        // --- Display Results ---
        yearsUntilRetirementSpan.textContent = yearsToRetirement;
        totalPrincipalInvestedSpan.textContent = `$${totalPrincipalInvested.toFixed(2)}`;
        totalInterestEarnedSpan.textContent = `$${totalInterestEarned.toFixed(2)}`;
        projectedNominalBalanceSpan.textContent = `$${projectedNominalBalance.toFixed(2)}`;
        projectedRealBalanceSpan.textContent = `$${projectedRealBalance.toFixed(2)}`;

        // Update the chart with the new data
        updateChart(totalPrincipalInvested, totalInterestEarned);
        console.log('Retirement Savings calculation complete. Principal:', totalPrincipalInvested, 'Interest:', totalInterestEarned, 'Nominal Balance:', projectedNominalBalance, 'Real Balance:', projectedRealBalance); // Debugging log
    }

    // --- Chart Update Function ---
    function updateChart(principal, interest) {
        console.log('Updating chart with data:', { principal, interest }); // Debugging: Chart data received

        if (retirementChart) {
            retirementChart.destroy(); // Destroy existing chart before creating a new one
        }

        // Only create chart if there's data to display
        if (principal > 0 || interest > 0) {
            retirementChart = new Chart(retirementChartCanvas, {
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
            console.log('Retirement Chart created.'); // Debugging log
        } else {
            // Clear canvas if no data (e.g., all inputs are zero or invalid)
            const ctx = retirementChartCanvas.getContext('2d');
            ctx.clearRect(0, 0, retirementChartCanvas.width, retirementChartCanvas.height);
            console.log('No data for Retirement Chart, canvas cleared.'); // Debugging log
        }
    }

    // --- Event Listeners for Live Update and Button ---
    const debouncedCalculate = debounce(calculateRetirementSavings, 300); // Debounce for 300ms

    // Attach 'input' listeners to all number fields for live updates
    currentAgeInput.addEventListener('input', debouncedCalculate);
    retirementAgeInput.addEventListener('input', debouncedCalculate);
    currentSavingsInput.addEventListener('input', debouncedCalculate);
    annualContributionInput.addEventListener('input', debouncedCalculate);
    annualReturnRateInput.addEventListener('input', debouncedCalculate);
    annualInflationRateInput.addEventListener('input', debouncedCalculate);

    // Attach 'click' listener to the calculate button (for immediate calculation if preferred)
    calculateBtn.addEventListener('click', calculateRetirementSavings);

    // Initial calculation on page load to display default values
    calculateRetirementSavings();
});
