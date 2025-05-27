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

    // --- Chart elements ---
    const interestChartCanvas = document.getElementById('interestChart');
    const payoffTimeChartCanvas = document.getElementById('payoffTimeChart');

    let interestChart; // Variable to hold the Chart.js instance for interest comparison
    let payoffTimeChart; // Variable to hold the Chart.js instance for payoff time comparison

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

            while (tempBalance > 0) {
                const interestThisMonth = tempBalance * monthlyRate;
                totalInterest += interestThisMonth;

                let principalPaid = monthlyPayment - interestThisMonth;

                // Safeguard against payments that don't cover interest (after initial validation)
                if (principalPaid <= 0 && tempBalance > 0 && monthlyRate > 0) {
                    return { months: Infinity, totalInterest: Infinity }; // Debt will never be paid off
                }

                tempBalance -= principalPaid;
                months++;

                // If balance becomes negative (paid off), adjust last payment and interest
                if (tempBalance <= 0) {
                    // The actual principal paid in the last month is the remaining balance
                    const actualPrincipalPaidLastMonth = balance - (totalInterest - interestThisMonth);
                    const lastMonthInterest = tempBalance + monthlyPayment - actualPrincipalPaidLastMonth;
                    totalInterest = totalInterest - interestThisMonth + lastMonthInterest;
                    
                    // Recalculate based on the exact amount paid in the last month
                    // This often requires a more precise iterative calculation or a formula for number of payments
                    // For simplicity and common use cases, we'll keep the current approximation,
                    // or for very high precision, one might need a different algorithm.
                    // For most cases, the current interest calculation is "good enough" for simulation.
                    break; // Debt is paid off
                }

                // Prevent extremely long loops for very small payments or high interest (e.g., 100 years max)
                if (months > 12000) { // 12000 months = 1000 years. If it's not paid by then, it's effectively never.
                    return { months: Infinity, totalInterest: Infinity };
                }
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

        // Update the charts with the new data
        updateInterestChart(minPayoff.totalInterest, extraPayoff.totalInterest);
        updatePayoffTimeChart(minPayoff.months, extraPayoff.months);

        console.log('Debt payoff calculation complete.'); // Debugging log
    }

    // --- Chart Update Function for Interest Comparison (Bar Chart) ---
    function updateInterestChart(minInterest, extraInterest) {
        console.log('Updating Interest Chart with data:', { minInterest, extraInterest });

        if (interestChart) {
            interestChart.destroy(); // Destroy existing chart before creating a new one
        }

        const dataValues = [
            minInterest === Infinity ? 0 : minInterest, // Treat Infinity as 0 for chart display
            extraInterest === Infinity ? 0 : extraInterest
        ];

        const labels = [
            'Min. Payment',
            'Extra Payment'
        ];
        const backgroundColors = [
            '#dc3545', // Red for higher interest
            '#28a745'  // Green for lower interest
        ];

        // Determine max value for Y-axis, handle cases where inputs are 0 or NaN
        const maxValue = Math.max(...dataValues, 100); // Ensure min height for chart if all zero

        interestChart = new Chart(interestChartCanvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total Interest Paid',
                    data: dataValues,
                    backgroundColor: backgroundColors,
                    borderColor: backgroundColors.map(color => color.replace('0.7', '1')), // Darker border
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y', // Makes it a horizontal bar chart
                plugins: {
                    legend: {
                        display: false // No need for legend as labels are clear
                    },
                    title: {
                        display: false,
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.raw);
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Interest Amount ($)'
                        },
                        ticks: {
                            callback: function(value, index, values) {
                                return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
                            }
                        }
                    },
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
        console.log('Interest Chart created/updated.');
    }

    // --- Chart Update Function for Payoff Time Comparison (Bar Chart) ---
    function updatePayoffTimeChart(minMonths, extraMonths) {
        console.log('Updating Payoff Time Chart with data:', { minMonths, extraMonths });

        if (payoffTimeChart) {
            payoffTimeChart.destroy(); // Destroy existing chart before creating a new one
        }

        const dataValues = [
            minMonths === Infinity ? 0 : minMonths, // Treat Infinity as 0 for chart display
            extraMonths === Infinity ? 0 : extraMonths
        ];

        const labels = [
            'Min. Payment',
            'Extra Payment'
        ];
        const backgroundColors = [
            '#007bff', // Blue for longer time
            '#ffc107'  // Orange for shorter time
        ];

        // Determine max value for Y-axis, handle cases where inputs are 0 or NaN
        const maxValue = Math.max(...dataValues, 12); // Ensure min height for chart if all zero (e.g., 1 year)

        payoffTimeChart = new Chart(payoffTimeChartCanvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Time to Payoff (Months)',
                    data: dataValues,
                    backgroundColor: backgroundColors,
                    borderColor: backgroundColors.map(color => color.replace('0.7', '1')), // Darker border
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y', // Makes it a horizontal bar chart
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: false,
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                const totalMonths = context.raw;
                                const years = Math.floor(totalMonths / 12);
                                const months = totalMonths % 12;
                                return `${label}${years} Years, ${months} Months`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Time to Payoff (Months)'
                        },
                        ticks: {
                            callback: function(value, index, values) {
                                // Display in years and months for readability
                                const years = Math.floor(value / 12);
                                const months = value % 12;
                                if (years > 0 && months > 0) {
                                    return `${years}y ${months}m`;
                                } else if (years > 0) {
                                    return `${years}y`;
                                } else if (months > 0) {
                                    return `${months}m`;
                                }
                                return '0m';
                            }
                        }
                    },
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
        console.log('Payoff Time Chart created/updated.');
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
        updateInterestChart(0, 0); // Clear interest chart
        updatePayoffTimeChart(0, 0); // Clear payoff time chart
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
