// scripts/ccpayoffcalc-script.js

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
    const currentBalanceInput = document.getElementById('currentBalance');
    const annualInterestRateInput = document.getElementById('annualInterestRate');
    const monthlyPaymentInput = document.getElementById('monthlyPayment');
    const extraMonthlyPaymentInput = document.getElementById('extraMonthlyPayment');
    const calculateBtn = document.getElementById('calculateBtn');

    const displayMinPaymentElem = document.getElementById('displayMinPayment');
    const minPaymentTimeElem = document.getElementById('minPaymentTime');
    const minPaymentInterestElem = document.getElementById('minPaymentInterest');
    const minPaymentTotalElem = document.getElementById('minPaymentTotal');

    const displayTotalPaymentElem = document.getElementById('displayTotalPayment');
    const extraPaymentTimeElem = document.getElementById('extraPaymentTime');
    const extraPaymentInterestElem = document.getElementById('extraPaymentInterest');
    const extraPaymentTotalElem = document.getElementById('extraPaymentTotal');

    const interestSavedElem = document.getElementById('interestSaved');
    const timeSavedElem = document.getElementById('timeSaved');

    const currentPaymentChartCanvas = document.getElementById('currentPaymentChart');
    const interestSavingsChartCanvas = document.getElementById('interestSavingsChart');

    let currentPaymentChart; // Chart.js instance for current payment breakdown
    let interestSavingsChart; // Chart.js instance for interest savings comparison


    // --- Helper Function to Calculate Payoff ---
    // Returns an object with payoff details (time, total interest, total paid)
    function calculatePayoff(balance, annualRate, monthlyPaymentAmount) {
        let remainingBalance = balance;
        let totalInterestPaid = 0;
        let months = 0;
        const monthlyRate = (annualRate / 100) / 12;

        // --- Input Validation specific to this helper ---
        if (monthlyPaymentAmount <= 0) {
            return { months: Infinity, totalInterest: Infinity, totalPaid: Infinity };
        }
        // Check if payment is less than monthly interest to prevent infinite loop
        if (balance > 0 && monthlyPaymentAmount <= (balance * monthlyRate) && annualRate > 0) {
             return { months: Infinity, totalInterest: Infinity, totalPaid: Infinity };
        }

        const MAX_MONTHS = 1200; // Cap calculation at 100 years

        while (remainingBalance > 0 && months < MAX_MONTHS) {
            months++;
            const interestForMonth = remainingBalance * monthlyRate;
            totalInterestPaid += interestForMonth;
            remainingBalance -= (monthlyPaymentAmount - interestForMonth);

            // Adjust for last payment if it overshoots
            if (remainingBalance < 0) {
                // The actual interest paid in the last month will be slightly less than interestForMonth
                // because the balance becomes 0 before the full payment applies interest to the full original amount.
                // This adjustment ensures totalInterestPaid is accurate up to cents.
                totalInterestPaid = totalInterestPaid + remainingBalance; // Subtract the "overshot" principal from totalInterest
                remainingBalance = 0; // Set balance to 0 as it's paid off
            }
        }

        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        const totalPaid = balance + totalInterestPaid; // Total paid is always principal + total interest

        return {
            months: months,
            years: years,
            remainingMonths: remainingMonths,
            totalInterest: totalInterestPaid,
            totalPaid: totalPaid
        };
    }

    // --- Main Calculation and UI Update Function ---
    function calculateCreditCardPayoff() {
        console.log('Calculating payoff...'); // Debugging log

        const currentBalance = parseFloat(currentBalanceInput.value) || 0;
        const annualInterestRate = parseFloat(annualInterestRateInput.value) || 0;
        const monthlyPayment = parseFloat(monthlyPaymentInput.value) || 0;
        const extraMonthlyPayment = parseFloat(extraMonthlyPaymentInput.value) || 0;

        console.log(`Inputs: Balance=${currentBalance}, Rate=${annualInterestRate}, Monthly=${monthlyPayment}, Extra=${extraMonthlyPayment}`); // Debugging logs

        // --- Input Validation and Edge Cases ---
        if (currentBalance < 0 || annualInterestRate < 0 || monthlyPayment < 0 || extraMonthlyPayment < 0) {
            // Using console.error instead of alert to avoid blocking UI
            console.error('Please enter non-negative values for all fields.');
            // Optionally, clear results if inputs are invalid
            minPaymentTimeElem.textContent = 'Invalid Input';
            minPaymentInterestElem.textContent = '$N/A';
            minPaymentTotalElem.textContent = '$N/A';
            extraPaymentTimeElem.textContent = 'Invalid Input';
            extraPaymentInterestElem.textContent = '$N/A';
            extraPaymentTotalElem.textContent = '$N/A';
            interestSavedElem.textContent = '$N/A';
            timeSavedElem.textContent = 'N/A';
            displayMinPaymentElem.textContent = '0.00';
            displayTotalPaymentElem.textContent = '0.00';
            updateCharts(0, 0, 0); // Clear charts
            return;
        }
         if (currentBalance === 0) {
            // If balance is 0, nothing to pay off
            minPaymentTimeElem.textContent = '0 Years, 0 Months';
            minPaymentInterestElem.textContent = '$0.00';
            minPaymentTotalElem.textContent = '$0.00';
            extraPaymentTimeElem.textContent = '0 Years, 0 Months';
            extraPaymentInterestElem.textContent = '$0.00';
            extraPaymentTotalElem.textContent = '$0.00';
            interestSavedElem.textContent = '$0.00';
            timeSavedElem.textContent = '0 Years, 0 Months';
            displayMinPaymentElem.textContent = '0.00';
            displayTotalPaymentElem.textContent = '0.00';
            updateCharts(0, 0, 0); // Clear charts
            return;
        }


        // Scenario 1: With current monthly payment
        const minPayoff = calculatePayoff(currentBalance, annualInterestRate, monthlyPayment);

        // Scenario 2: With extra monthly payment
        const totalMonthlyPayment = monthlyPayment + extraMonthlyPayment;
        const extraPayoff = calculatePayoff(currentBalance, annualInterestRate, totalMonthlyPayment);

        // --- Update UI for Scenario 1 ---
        displayMinPaymentElem.textContent = monthlyPayment.toFixed(2);
        if (minPayoff.months === Infinity) {
            minPaymentTimeElem.textContent = 'Never (Payment too low)';
            minPaymentInterestElem.textContent = '$N/A';
            minPaymentTotalElem.textContent = '$N/A';
        } else {
            minPaymentTimeElem.textContent = `${minPayoff.years} Years, ${minPayoff.remainingMonths} Months`;
            minPaymentInterestElem.textContent = `$${minPayoff.totalInterest.toFixed(2)}`;
            minPaymentTotalElem.textContent = `$${minPayoff.totalPaid.toFixed(2)}`;
        }

        // --- Update UI for Scenario 2 ---
        displayTotalPaymentElem.textContent = totalMonthlyPayment.toFixed(2);
        if (extraPayoff.months === Infinity) {
            extraPaymentTimeElem.textContent = 'Never (Payment too low)';
            extraPaymentInterestElem.textContent = '$N/A';
            extraPaymentTotalElem.textContent = '$N/A';
        } else {
            extraPaymentTimeElem.textContent = `${extraPayoff.years} Years, ${extraPayoff.remainingMonths} Months`;
            extraPaymentInterestElem.textContent = `$${extraPayoff.totalInterest.toFixed(2)}`;
            extraPaymentTotalElem.textContent = `$${extraPayoff.totalPaid.toFixed(2)}`;
        }

        // --- Calculate Savings ---
        let savedInterest = 0;
        let savedMonths = 0;

        if (minPayoff.months === Infinity && extraPayoff.months === Infinity) {
            savedInterest = 0;
            savedMonths = 0;
            interestSavedElem.textContent = '$0.00';
            timeSavedElem.textContent = '0 Years, 0 Months';
        } else if (minPayoff.months === Infinity) {
            // Current payment never pays off, but extra payment does - significant savings
            // For chart purposes, use a large number if 'Significant!' is not numeric
            savedInterest = currentBalance * annualInterestRate / 100 * 10; // Placeholder large value
            savedMonths = 1200; // Max months
            interestSavedElem.textContent = 'Significant!';
            timeSavedElem.textContent = 'Significant!';
        } else {
            savedInterest = minPayoff.totalInterest - extraPayoff.totalInterest;
            savedMonths = minPayoff.months - extraPayoff.months;

            interestSavedElem.textContent = `$${savedInterest.toFixed(2)}`;
            const savedYears = Math.floor(savedMonths / 12);
            const savedRemainingMonths = savedMonths % 12;
            timeSavedElem.textContent = `${savedYears} Years, ${savedRemainingMonths} Months`;
        }

        // --- Update Charts ---
        // Pass the actual numeric values to updateCharts
        updateCharts(currentBalance, minPayoff.totalInterest, extraPayoff.totalInterest);
        console.log('Chart update initiated.'); // Debugging log
    }


    // --- Chart Update Function ---
    function updateCharts(balance, minInterest, extraInterest) {
        console.log('Updating chart with data:', { balance, minInterest, extraInterest }); // Debugging: Chart data received

        // Chart 1: Principal vs. Interest (Current Payment)
        if (currentPaymentChart) {
            currentPaymentChart.destroy();
        }
        // Only create chart if there's valid data to display
        if (balance > 0 || minInterest > 0) {
            currentPaymentChart = new Chart(currentPaymentChartCanvas, {
                type: 'pie',
                data: {
                    labels: ['Principal Paid', 'Interest Paid'],
                    datasets: [{
                        data: [balance, minInterest],
                        backgroundColor: ['#007bff', '#dc3545'], // Blue for Principal, Red for Interest
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                        },
                        title: {
                            display: false, // Title handled by HTML h3
                        }
                    }
                }
            });
            console.log('Current Payment Chart created.'); // Debugging log
        } else {
            // Clear canvas if no data
            const ctx = currentPaymentChartCanvas.getContext('2d');
            ctx.clearRect(0, 0, currentPaymentChartCanvas.width, currentPaymentChartCanvas.height);
            console.log('No data for Current Payment Chart, canvas cleared.'); // Debugging log
        }


        // Chart 2: Interest Savings Comparison
        if (interestSavingsChart) {
            interestSavingsChart.destroy();
        }
        // Only create chart if there's valid data to display
        const totalInterestSaved = minInterest - extraInterest;
        if (minInterest > 0 && totalInterestSaved > 0) { // Ensure there's something to compare and savings exist
             interestSavingsChart = new Chart(interestSavingsChartCanvas, {
                type: 'pie',
                data: {
                    labels: ['Interest Saved', 'Interest Paid (with Extra Payment)'],
                    datasets: [{
                        data: [totalInterestSaved, extraInterest],
                        backgroundColor: ['#28a745', '#ffc107'], // Green for Saved, Orange for Paid
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                        },
                        title: {
                            display: false, // Title handled by HTML h3
                        }
                    }
                }
            });
            console.log('Interest Savings Chart created.'); // Debugging log
        } else {
            // Clear canvas if no data
            const ctx = interestSavingsChartCanvas.getContext('2d');
            ctx.clearRect(0, 0, interestSavingsChartCanvas.width, interestSavingsChartCanvas.height);
            console.log('No data for Interest Savings Chart, canvas cleared.'); // Debugging log
        }
    }


    // --- Event Listeners ---
    const debouncedCalculate = debounce(calculateCreditCardPayoff, 500); // Debounce for 500ms

    // Attach input listeners to all relevant input fields
    currentBalanceInput.addEventListener('input', debouncedCalculate);
    annualInterestRateInput.addEventListener('input', debouncedCalculate);
    monthlyPaymentInput.addEventListener('input', debouncedCalculate);
    extraMonthlyPaymentInput.addEventListener('input', debouncedCalculate);

    // Explicit calculate button click (immediate)
    calculateBtn.addEventListener('click', calculateCreditCardPayoff);

    // Initial calculation on page load
    calculateCreditCardPayoff(); // Call once on DOMContentLoaded
});
