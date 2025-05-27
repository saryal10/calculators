// scripts/hysacalc-script.js

// --- Debounce Function ---
// Prevents a function from being called too frequently.
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
    const initialDepositInput = document.getElementById('initialDeposit');
    const monthlyDepositInput = document.getElementById('monthlyDeposit');
    const annualInterestRateInput = document.getElementById('annualInterestRate');
    const compoundingFrequencySelect = document.getElementById('compoundingFrequency');
    const calculationPeriodInput = document.getElementById('calculationPeriod');
    const calculateBtn = document.getElementById('calculateBtn');

    const totalPrincipalSpan = document.getElementById('totalPrincipal');
    const totalInterestSpan = document.getElementById('totalInterest');
    const endingBalanceSpan = document.getElementById('endingBalance');
    const hysaChartCanvas = document.getElementById('hysaChart'); // THIS IS CRUCIAL FOR THE CHART

    let hysaChart; // To hold the Chart.js instance

    // --- Core Calculation Function ---
    function calculateHYSA() {
        console.log('Calculating HYSA...'); // Debugging log

        let initialDeposit = parseFloat(initialDepositInput.value) || 0;
        let monthlyDeposit = parseFloat(monthlyDepositInput.value) || 0;
        let annualInterestRate = parseFloat(annualInterestRateInput.value) || 0;
        const compoundingFrequency = compoundingFrequencySelect.value;
        let calculationPeriodYears = parseFloat(calculationPeriodInput.value) || 0;

        console.log(`Inputs: Initial=${initialDeposit}, Monthly=${monthlyDeposit}, Rate=${annualInterestRate}, Freq=${compoundingFrequency}, Years=${calculationPeriodYears}`); // Debugging logs

        // Validate inputs
        if (initialDeposit < 0 || monthlyDeposit < 0 || annualInterestRate < 0 || calculationPeriodYears <= 0) {
            console.error('Please enter valid, non-negative values for all inputs. Calculation Period must be greater than 0.');
            totalPrincipalSpan.textContent = '$0.00';
            totalInterestSpan.textContent = '$0.00';
            endingBalanceSpan.textContent = '$0.00';
            updateChart(0, 0); // Clear chart
            return;
        }

        const rate = annualInterestRate / 100;
        const totalMonths = calculationPeriodYears * 12;

        let totalPrincipalInvested = initialDeposit + (monthlyDeposit * totalMonths);
        let endingBalance = initialDeposit;

        let compoundingPeriodsPerYear;
        switch (compoundingFrequency) {
            case 'monthly':
                compoundingPeriodsPerYear = 12;
                break;
            case 'quarterly':
                compoundingPeriodsPerYear = 4;
                break;
            case 'annually':
                compoundingPeriodsPerYear = 1;
                break;
            default:
                compoundingPeriodsPerYear = 12; // Default to monthly
        }

        const ratePerCompoundingPeriod = rate / compoundingPeriodsPerYear;
        const monthsPerCompoundingPeriod = 12 / compoundingPeriodsPerYear;

        for (let i = 1; i <= totalMonths; i++) {
            endingBalance += monthlyDeposit; // Add monthly deposit at the beginning of each month

            // Apply interest at each compounding period
            if (i % monthsPerCompoundingPeriod === 0) {
                endingBalance *= (1 + ratePerCompoundingPeriod);
            }
        }

        let totalInterestEarned = endingBalance - totalPrincipalInvested;

        // Ensure interest is not negative due to floating point errors or if initial deposit is 0 and monthly is 0
        if (totalInterestEarned < 0) {
            totalInterestEarned = 0;
        }

        // Display results
        totalPrincipalSpan.textContent = `$${totalPrincipalInvested.toFixed(2)}`;
        totalInterestSpan.textContent = `$${totalInterestEarned.toFixed(2)}`;
        endingBalanceSpan.textContent = `$${endingBalance.toFixed(2)}`;

        // Update the chart
        updateChart(totalPrincipalInvested, totalInterestEarned);
        console.log('HYSA calculation complete. Principal:', totalPrincipalInvested, 'Interest:', totalInterestEarned, 'Ending Balance:', endingBalance); // Debugging log
    }

    // --- Chart Update Function ---
    function updateChart(principal, interest) {
        console.log('Updating chart with data:', { principal, interest }); // Debugging: Chart data received

        if (hysaChart) {
            hysaChart.destroy(); // Destroy existing chart before creating a new one
        }

        // Only create chart if there's data to display
        if (principal > 0 || interest > 0) {
            hysaChart = new Chart(hysaChartCanvas, {
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
            console.log('HYSA Chart created.'); // Debugging log
        } else {
            // Clear canvas if no data
            const ctx = hysaChartCanvas.getContext('2d');
            ctx.clearRect(0, 0, hysaChartCanvas.width, hysaChartCanvas.height);
            console.log('No data for HYSA Chart, canvas cleared.'); // Debugging log
        }
    }

    // --- Event Listeners ---
    const debouncedCalculate = debounce(calculateHYSA, 500); // Debounce for 500ms

    // Attach input listeners to all relevant input fields
    initialDepositInput.addEventListener('input', debouncedCalculate);
    monthlyDepositInput.addEventListener('input', debouncedCalculate);
    annualInterestRateInput.addEventListener('input', debouncedCalculate);
    compoundingFrequencySelect.addEventListener('change', debouncedCalculate); // 'change' for select elements
    calculationPeriodInput.addEventListener('input', debouncedCalculate);

    // Explicit calculate button click (immediate)
    calculateBtn.addEventListener('click', calculateHYSA);

    // Initial calculation on page load
    calculateHYSA(); // Call once on DOMContentLoaded
});
