// scripts/loanpaymentcalc-script.js

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
    const loanAmountInput = document.getElementById('loanAmount');
    const annualInterestRateInput = document.getElementById('annualInterestRate');
    const loanTermYearsInput = document.getElementById('loanTermYears');
    const calculateBtn = document.getElementById('calculateBtn');

    // --- Output elements ---
    const monthlyPaymentSpan = document.getElementById('monthlyPayment');
    const totalInterestSpan = document.getElementById('totalInterest');
    const totalCostSpan = document.getElementById('totalCost');
    const loanCostChartCanvas = document.getElementById('loanCostChart'); // Get the canvas element for the chart

    let loanCostChart; // Variable to hold the Chart.js instance

    // --- Core Calculation Function ---
    function calculateLoanPayment() {
        console.log('Calculating Loan Payment...'); // Debugging log

        const loanAmount = parseFloat(loanAmountInput.value) || 0;
        const annualInterestRate = parseFloat(annualInterestRateInput.value) || 0;
        const loanTermYears = parseFloat(loanTermYearsInput.value) || 0;

        console.log(`Inputs: Amount=${loanAmount}, Rate=${annualInterestRate}, Term=${loanTermYears}`); // Debugging logs

        // --- Input Validation ---
        if (isNaN(loanAmount) || loanAmount <= 0) {
            alert('Please enter a valid loan amount (must be greater than 0).');
            resetResults();
            return;
        }
        if (isNaN(annualInterestRate) || annualInterestRate < 0) {
            alert('Please enter a valid annual interest rate (non-negative).');
            resetResults();
            return;
        }
        if (isNaN(loanTermYears) || loanTermYears <= 0) {
            alert('Please enter a valid loan term in years (must be greater than 0).');
            resetResults();
            return;
        }

        const monthlyInterestRate = (annualInterestRate / 100) / 12;
        const numberOfPayments = loanTermYears * 12;

        let monthlyPayment = 0;
        let totalInterest = 0;
        let totalCost = 0; // Total Principal + Total Interest

        if (monthlyInterestRate === 0) {
            // Simple calculation for 0% interest loans
            monthlyPayment = loanAmount / numberOfPayments;
            totalInterest = 0;
            totalCost = loanAmount;
        } else {
            // Standard loan payment formula: M = P [ i(1 + i)^n ] / [ (1 + i)^n – 1]
            monthlyPayment = loanAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
            totalCost = monthlyPayment * numberOfPayments;
            totalInterest = totalCost - loanAmount;
        }

        // --- Display Results ---
        monthlyPaymentSpan.textContent = `$${monthlyPayment.toFixed(2)}`;
        totalInterestSpan.textContent = `$${totalInterest.toFixed(2)}`;
        totalCostSpan.textContent = `$${totalCost.toFixed(2)}`;

        // Update the chart with the new data
        updateLoanCostChart(loanAmount, totalInterest);
        console.log('Loan calculation complete.'); // Debugging log
    }

    // --- Chart Update Function ---
    function updateLoanCostChart(principal, interest) {
        console.log('Updating Loan Cost Chart with data:', { principal, interest });

        if (loanCostChart) {
            loanCostChart.destroy(); // Destroy existing chart before creating a new one
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
            filteredLabels.push('No Loan Cost');
            filteredColors.push('#CCCCCC');
        }

        loanCostChart = new Chart(loanCostChartCanvas, {
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
                maintainAspectRatio: true, // IMPORTANT: Set this to TRUE
                aspectRatio: 1, // IMPORTANT: Add this to force a 1:1 aspect ratio (square)
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
        console.log('Loan Cost Chart created/updated.');
    }

    // --- Helper function to reset results on invalid input ---
    function resetResults() {
        monthlyPaymentSpan.textContent = '$0.00';
        totalInterestSpan.textContent = '$0.00';
        totalCostSpan.textContent = '$0.00';
        updateLoanCostChart(0, 0); // Clear chart
    }

    // --- Event Listeners for Live Update and Button ---
    const debouncedCalculate = debounce(calculateLoanPayment, 300); // Debounce for 300ms

    // Attach 'input' listeners to all number fields for live updates
    loanAmountInput.addEventListener('input', debouncedCalculate);
    annualInterestRateInput.addEventListener('input', debouncedCalculate);
    loanTermYearsInput.addEventListener('input', debouncedCalculate);

    // Attach 'click' listener to the calculate button (for immediate calculation if preferred)
    calculateBtn.addEventListener('click', calculateLoanPayment);

    // Initial calculation on page load to display default values
    calculateLoanPayment();
});
