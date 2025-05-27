// scripts/debtpayoffcalc-script.js

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
    const currentBalanceInput = document.getElementById('currentBalance');
    const annualInterestRateInput = document.getElementById('annualInterestRate');
    const minimumMonthlyPaymentInput = document.getElementById('minimumMonthlyPayment');
    const extraMonthlyPaymentInput = document.getElementById('extraMonthlyPayment');
    const calculateBtn = document.getElementById('calculateBtn');

    // --- Output elements ---
    const displayExtraPaymentSpan = document.getElementById('displayExtraPayment');
    const minPaymentTimeSpan = document.getElementById('minPaymentTime');
    const minPaymentInterestSpan = document.getElementById('minPaymentInterest');
    const extraPaymentTimeSpan = document.getElementById('extraPaymentTime');
    const extraPaymentInterestSpan = document.getElementById('extraPaymentInterest');
    const interestSavedSpan = document.getElementById('interestSaved');
    const timeSavedSpan = document.getElementById('timeSaved');

    // --- Chart element ---
    const debtCostChartCanvas = document.getElementById('debtCostChart');
    let debtCostChart; // Variable to hold the Chart.js instance for the pie chart

    // --- Core Calculation Function ---
    function calculateDebtPayoff() {
        console.log('Calculating Debt Payoff...'); // Debugging log

        let currentBalance = parseFloat(currentBalanceInput.value) || 0;
        const annualInterestRate = parseFloat(annualInterestRateInput.value) || 0;
        const minimumMonthlyPayment = parseFloat(minimumMonthlyPaymentInput.value) || 0;
        const extraMonthlyPayment = parseFloat(extraMonthlyPaymentInput.value) || 0;

        console.log(`Inputs: Balance=${currentBalance}, Rate=${annualInterestRate}, MinPay=${minimumMonthlyPayment}, ExtraPay=${extraMonthlyPayment}`); // Debugging logs

        // --- Input Validation ---
        if (isNaN(currentBalance) || currentBalance <= 0) {
            alert('Please enter a valid current debt balance (must be greater than 0).');
            resetResults();
            return;
        }
        if (isNaN(annualInterestRate) || annualInterestRate < 0) {
            alert('Please enter a valid annual interest rate (non-negative).');
            resetResults();
            return;
        }
        if (isNaN(minimumMonthlyPayment) || minimumMonthlyPayment <= 0) {
            alert('Please enter a valid minimum monthly payment (must be greater than 0).');
            resetResults();
            return;
        }
        if (isNaN(extraMonthlyPayment) || extraMonthlyPayment < 0) {
            alert('Please enter a valid extra monthly payment (can be 0 or positive).');
            resetResults();
            return;
        }

        const monthlyInterestRate = (annualInterestRate / 100) / 12;

        // Ensure minimum payment is more than just interest on the balance
        if (monthlyInterestRate > 0 && minimumMonthlyPayment <= (currentBalance * monthlyInterestRate)) {
            alert('Your minimum payment is too low. It must be greater than the monthly interest on the balance, or you will never pay off the debt.');
            resetResults();
            return;
        }

        // --- Calculation Function (helper) ---
        function calculatePayoffDetails(balance, monthlyPayment, monthlyRate) {
            let months = 0;
            let totalInterest = 0;
            let tempBalance = balance;

            if (monthlyPayment <= 0) { // Avoid infinite loops if payment is zero or negative
                return { months: Infinity, totalInterest: Infinity };
            }

            // Cap the iterations to prevent extremely long loops for very small payments or high interest
            const maxMonths = 1200; // 100 years. If not paid by then, effectively infinite.

            while (tempBalance > 0 && months < maxMonths) {
                const interestThisMonth = tempBalance * monthlyRate;
                totalInterest += interestThisMonth;

                let principalPaid = monthlyPayment - interestThisMonth;

                // Safeguard against payments that don't cover interest (after initial validation)
                if (principalPaid <= 0 && tempBalance > 0 && monthlyRate > 0) {
                    return { months: Infinity, totalInterest: Infinity }; // Debt will never be paid off
                }

                tempBalance -= principalPaid;
                months++;
            }
            
            // If the loop finished because months hit maxMonths, debt is not paid off
            if (tempBalance > 0) {
                return { months: Infinity, totalInterest: Infinity };
            }

            // Adjust total interest if balance went negative in the last payment
            if (tempBalance < 0) {
                totalInterest += tempBalance; // Subtract the overpayment from interest
            }

            return { months: months, totalInterest: totalInterest };
        }

        // --- Calculate with Minimum Payment ---
        const minPayoff = calculatePayoffDetails(currentBalance, minimumMonthlyPayment, monthlyInterestRate);
        const minPayoffYears = Math.floor(minPayoff.months / 12);
        const minPayoffMonths = minPayoff.months % 12;

        // --- Calculate with Extra Payment ---
        const totalMonthlyPayment = minimumMonthlyPayment + extraMonthlyPayment;
        const extraPayoff = calculatePayoffDetails(currentBalance, totalMonthlyPayment, monthlyInterestRate);
        const extraPayoffYears = Math.floor(extraPayoff.months / 12);
        const extraPayoffMonths = extraPayoff.months % 12;

        // --- Calculate Savings ---
        let totalInterestSaved = 0;
        let totalMonthsSaved = 0;

        if (minPayoff.totalInterest !== Infinity && extraPayoff.totalInterest !== Infinity) {
            totalInterestSaved = minPayoff.totalInterest - extraPayoff.totalInterest;
            totalMonthsSaved = minPayoff.months - extraPayoff.months;
        } else if (minPayoff.totalInterest === Infinity && extraPayoff.totalInterest !== Infinity) {
            // If min payment never pays off but extra payment does, savings are effectively infinite
            totalInterestSaved = Infinity;
            totalMonthsSaved = Infinity;
        } // If both are infinity, savings are N/A (remain 0)

        const savedYears = Math.floor(totalMonthsSaved / 12);
        const savedMonths = totalMonthsSaved % 12;

        // --- Display Results ---
        displayExtraPaymentSpan.textContent = (minimumMonthlyPayment + extraMonthlyPayment).toFixed(2);

        // Display results for Minimum Payment Scenario
        if (minPayoff.months === Infinity) {
            minPaymentTimeSpan.textContent = "Never (Payment too low)";
            minPaymentInterestSpan.textContent = "N/A";
        } else {
            minPaymentTimeSpan.textContent = `${minPayoffYears} Years, ${minPayoffMonths} Months`;
            minPaymentInterestSpan.textContent = `$${minPayoff.totalInterest.toFixed(2)}`;
        }

        // Display results for Extra Payment Scenario
        if (extraPayoff.months === Infinity) {
            extraPaymentTimeSpan.textContent = "Never (Payment too low)";
            extraPaymentInterestSpan.textContent = "N/A";
        } else {
            extraPaymentTimeSpan.textContent = `${extraPayoffYears} Years, ${extraPayoffMonths} Months`;
            extraPaymentInterestSpan.textContent = `$${extraPayoff.totalInterest.toFixed(2)}`;
        }

        // Display Total Savings
        if (totalInterestSaved === Infinity) {
            interestSavedSpan.textContent = "Significant Savings!";
        } else {
            interestSavedSpan.textContent = `$${Math.max(0, totalInterestSaved).toFixed(2)}`; // Ensure non-negative display
        }
        if (totalMonthsSaved === Infinity) {
            timeSavedSpan.textContent = "Significant Time!";
        } else {
            timeSavedSpan.textContent = `${Math.max(0, savedYears)} Years, ${Math.max(0, savedMonths)} Months`; // Ensure non-negative display
        }

        // Update the pie chart with data from the "Extra Payment" scenario
        // Use currentBalance as principal and extraPayoff.totalInterest as interest
        updateDebtCostChart(currentBalance, extraPayoff.totalInterest);

        console.log('Debt payoff calculation complete.'); // Debugging log
    }

    // --- Chart Update Function for Debt Cost Breakdown (Pie Chart) ---
    function updateDebtCostChart(principal, interest) {
        console.log('Updating Debt Cost Chart with data:', { principal, interest });

        if (debtCostChart) {
            debtCostChart.destroy(); // Destroy existing chart before creating a new one
        }

        const dataValues = [
            principal,
            interest
        ].map(val => Math.max(0, val)); // Ensure no negative values go into the chart

        const labels = [
            'Total Principal Paid',
            'Total Interest Paid'
        ];
        const backgroundColors = [
            '#6f42c1', // A distinct color for Principal
            '#fd7e14'  // A distinct color for Interest
        ];

        // Filter out zero values for a cleaner chart, unless all values are zero
        const filteredData = [];
        const filteredLabels = [];
        const filteredColors = [];
        let allZero = true;

        for (let i = 0; i < dataValues.length; i++) {
            if (dataValues[i] > 0) {
                filteredData.push(dataValues[i]);
                filteredLabels.push(labels[i]);
                filteredColors.push(backgroundColors[i]);
                allZero = false;
            }
        }

        if (allZero) {
            // If all values are zero, show a single "No Data" slice
            filteredData.push(1); // Small dummy value to display a slice
            filteredLabels.push('No Debt Cost');
            filteredColors.push('#CCCCCC');
        }


        debtCostChart = new Chart(debtCostChartCanvas, {
            type: 'pie',
            data: {
                labels: filteredLabels,
                datasets: [{
                    data: filteredData,
                    backgroundColor: filteredColors,
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
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.raw);
                                return label;
                            }
                        }
                    }
                }
            }
        });
        console.log('Debt Cost Pie Chart created/updated.');
    }

    // --- Helper function to reset results on invalid input ---
    function resetResults() {
        displayExtraPaymentSpan.textContent = '0.00';
        minPaymentTimeSpan.textContent = '0 Years, 0 Months';
        minPaymentInterestSpan.textContent = '$0.00';
        extraPaymentTimeSpan.textContent = '0 Years, 0 Months';
        extraPaymentInterestSpan.textContent = '$0.00';
        interestSavedSpan.textContent = '$0.00';
        timeSavedSpan.textContent = '0 Years, 0 Months';
        updateDebtCostChart(0, 0); // Clear chart
    }

    // --- Event Listeners for Live Update and Button ---
    const debouncedCalculate = debounce(calculateDebtPayoff, 300); // Debounce for 300ms

    // Attach 'input' listeners to all number fields for live updates
    currentBalanceInput.addEventListener('input', debouncedCalculate);
    annualInterestRateInput.addEventListener('input', debouncedCalculate);
    minimumMonthlyPaymentInput.addEventListener('input', debouncedCalculate);
    extraMonthlyPaymentInput.addEventListener('input', debouncedCalculate);

    // Attach 'click' listener to the calculate button (for immediate calculation if preferred)
    calculateBtn.addEventListener('click', calculateDebtPayoff);

    // Initial calculation on page load to display default values
    calculateDebtPayoff();
});
