// scripts/mortgagecalc-script.js

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
    const downPaymentInput = document.getElementById('downPayment');
    const interestRateInput = document.getElementById('interestRate');
    const loanTermInput = document.getElementById('loanTerm');
    const propertyTaxInput = document.getElementById('propertyTax');
    const hoaInput = document.getElementById('hoa');
    const calculateBtn = document.getElementById('calculateBtn');

    // --- Output elements ---
    const monthlyPaymentSpan = document.getElementById('monthlyPayment');
    const monthlyPropertyTaxSpan = document.getElementById('monthlyPropertyTax');
    const monthlyHoaSpan = document.getElementById('monthlyHoa');
    const monthlyPmiSpan = document.getElementById('monthlyPmi');
    const totalMonthlyPaymentSpan = document.getElementById('totalMonthlyPayment');
    const totalInterestSpan = document.getElementById('totalInterest');
    const totalCostSpan = document.getElementById('totalCost');

    const mortgageChartCanvas = document.getElementById('mortgageChart'); // Get the canvas element for monthly breakdown
    const totalCostChartCanvas = document.getElementById('totalCostChart'); // Get the canvas element for total cost breakdown

    let mortgageChart; // Variable to hold the Chart.js instance for monthly breakdown
    let totalCostChart; // Variable to hold the Chart.js instance for total cost breakdown

    // --- Core Calculation Function ---
    function calculateMortgage() {
        console.log('Calculating Mortgage...'); // Debugging log

        const loanAmount = parseFloat(loanAmountInput.value) || 0;
        const downPayment = parseFloat(downPaymentInput.value) || 0;
        const annualInterestRate = parseFloat(interestRateInput.value) || 0;
        const loanTermYears = parseFloat(loanTermInput.value) || 0;
        const annualPropertyTax = parseFloat(propertyTaxInput.value) || 0;
        const monthlyHoa = parseFloat(hoaInput.value) || 0;

        console.log(`Inputs: Loan=${loanAmount}, Down=${downPayment}, Rate=${annualInterestRate}, Term=${loanTermYears}, Tax=${annualPropertyTax}, HOA=${monthlyHoa}`); // Debugging logs

        // --- Input Validation ---
        if (isNaN(loanAmount) || loanAmount <= 0) {
            alert('Please enter a valid loan amount (must be greater than 0).');
            resetResults();
            return;
        }
        if (isNaN(downPayment) || downPayment < 0 || downPayment >= loanAmount) {
            alert('Please enter a valid down payment (non-negative and less than loan amount).');
            resetResults();
            return;
        }
        const principal = loanAmount - downPayment;
        if (principal <= 0) {
            alert('The loan principal must be greater than zero. Adjust loan amount or down payment.');
            resetResults();
            return;
        }
        if (isNaN(annualInterestRate) || annualInterestRate < 0) {
            alert('Please enter a valid annual interest rate (non-negative).');
            resetResults();
            return;
        }
        if (isNaN(loanTermYears) || loanTermYears <= 0) {
            alert('Please enter a valid loan term (must be greater than 0 years).');
            resetResults();
            return;
        }
        if (isNaN(annualPropertyTax) || annualPropertyTax < 0) {
            alert('Please enter a valid annual property tax (non-negative).');
            resetResults();
            return;
        }
        if (isNaN(monthlyHoa) || monthlyHoa < 0) {
            alert('Please enter a valid monthly HOA fee (non-negative).');
            resetResults();
            return;
        }

        const monthlyInterestRate = (annualInterestRate / 100) / 12;
        const numberOfPayments = loanTermYears * 12;
        const monthlyPropertyTax = annualPropertyTax / 12;

        let monthlyPrincipalInterest = 0;
        let totalInterest = 0;
        let totalPrincipalPaid = principal; // This will be the initial principal loan amount
        let monthlyPmi = 0;

        if (monthlyInterestRate === 0) {
            monthlyPrincipalInterest = principal / numberOfPayments;
            totalInterest = 0;
        } else {
            // Formula for fixed monthly payment (M)
            // M = P [ i(1 + i)^n ] / [ (1 + i)^n – 1]
            // Where:
            // P = Principal loan amount
            // i = Monthly interest rate
            // n = Number of payments (loan term in months)
            const i_plus_1_pow_n = Math.pow(1 + monthlyInterestRate, numberOfPayments);
            monthlyPrincipalInterest = principal * (monthlyInterestRate * i_plus_1_pow_n) / (i_plus_1_pow_n - 1);
            totalInterest = (monthlyPrincipalInterest * numberOfPayments) - principal;
        }

        // Calculate PMI if down payment is less than 20%
        if ((downPayment / loanAmount) < 0.20) {
            monthlyPmi = (Math.ceil(principal / 100000) * 100); // Annual $100 per $100k of principal, divided by 12
        } else {
            monthlyPmi = 0;
        }

        const totalMonthlyPayment = monthlyPrincipalInterest + monthlyPropertyTax + monthlyHoa + monthlyPmi;
        const overallTotalCostOfLoan = principal + totalInterest + (monthlyPropertyTax * numberOfPayments) + (monthlyHoa * numberOfPayments) + (monthlyPmi * numberOfPayments);


        // --- Display Results ---
        monthlyPaymentSpan.textContent = `$${monthlyPrincipalInterest.toFixed(2)}`;
        monthlyPropertyTaxSpan.textContent = `$${monthlyPropertyTax.toFixed(2)}`;
        monthlyHoaSpan.textContent = `$${monthlyHoa.toFixed(2)}`;
        monthlyPmiSpan.textContent = `$${monthlyPmi.toFixed(2)}`;
        totalMonthlyPaymentSpan.textContent = `$${totalMonthlyPayment.toFixed(2)}`;
        totalInterestSpan.textContent = `$${totalInterest.toFixed(2)}`;
        // For total cost, we typically mean Principal + Total Interest
        // If "Total Cost of Loan" means P+I + Property Tax + HOA + PMI over term, then use overallTotalCostOfLoan
        // Based on typical mortgage calculators, it's usually P + I
        totalCostSpan.textContent = `$${(principal + totalInterest).toFixed(2)}`;

        // Update the charts with the new data
        updateMortgageChart(monthlyPrincipalInterest, monthlyPropertyTax, monthlyHoa, monthlyPmi);
        updateTotalCostChart(totalPrincipalPaid, totalInterest);

        console.log('Mortgage calculation complete.'); // Debugging log
    }

    // --- Chart Update Function for Monthly Breakdown ---
    function updateMortgageChart(principalInterest, propertyTax, hoa, pmi) {
        console.log('Updating Monthly Mortgage Chart with data:', { principalInterest, propertyTax, hoa, pmi });

        if (mortgageChart) {
            mortgageChart.destroy();
        }

        const dataValues = [
            principalInterest,
            propertyTax,
            hoa,
            pmi
        ].map(val => Math.max(0, val)); // Ensure no negative values go into the chart

        const labels = [
            'Principal & Interest',
            'Property Tax',
            'HOA Fees',
            'PMI'
        ];
        const backgroundColors = [
            '#007bff', // Blue
            '#28a745', // Green
            '#ffc107', // Yellow/Orange
            '#dc3545'  // Red
        ];

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
            filteredData.push(1);
            filteredLabels.push('No Monthly Components');
            filteredColors.push('#CCCCCC');
        }

        mortgageChart = new Chart(mortgageChartCanvas, {
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
                        position: 'bottom',
                    },
                    title: {
                        display: false,
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
        console.log('Monthly Mortgage Chart created/updated.');
    }

    // --- Chart Update Function for Total Cost Breakdown ---
    function updateTotalCostChart(principalPaid, totalInterestPaid) {
        console.log('Updating Total Cost Chart with data:', { principalPaid, totalInterestPaid });

        if (totalCostChart) {
            totalCostChart.destroy();
        }

        const dataValues = [
            principalPaid,
            totalInterestPaid
        ].map(val => Math.max(0, val));

        const labels = [
            'Total Principal Paid',
            'Total Interest Paid'
        ];
        const backgroundColors = [
            '#6f42c1', // Purple for Principal
            '#fd7e14'  // Orange for Interest
        ];

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
            filteredData.push(1);
            filteredLabels.push('No Loan Cost');
            filteredColors.push('#CCCCCC');
        }

        totalCostChart = new Chart(totalCostChartCanvas, {
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
                        position: 'bottom',
                    },
                    title: {
                        display: false,
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
        console.log('Total Cost Chart created/updated.');
    }


    // --- Helper function to reset results on invalid input ---
    function resetResults() {
        monthlyPaymentSpan.textContent = '$0.00';
        monthlyPropertyTaxSpan.textContent = '$0.00';
        monthlyHoaSpan.textContent = '$0.00';
        monthlyPmiSpan.textContent = '$0.00';
        totalMonthlyPaymentSpan.textContent = '$0.00';
        totalInterestSpan.textContent = '$0.00';
        totalCostSpan.textContent = '$0.00';
        updateMortgageChart(0, 0, 0, 0); // Clear monthly chart
        updateTotalCostChart(0, 0); // Clear total cost chart
    }

    // --- Event Listeners for Live Update and Button ---
    const debouncedCalculate = debounce(calculateMortgage, 300); // Debounce for 300ms

    // Attach 'input' listeners to all number fields for live updates
    loanAmountInput.addEventListener('input', debouncedCalculate);
    downPaymentInput.addEventListener('input', debouncedCalculate);
    interestRateInput.addEventListener('input', debouncedCalculate);
    loanTermInput.addEventListener('input', debouncedCalculate);
    propertyTaxInput.addEventListener('input', debouncedCalculate);
    hoaInput.addEventListener('input', debouncedCalculate);

    // Attach 'click' listener to the calculate button (for immediate calculation if preferred)
    calculateBtn.addEventListener('click', calculateMortgage);

    // Initial calculation on page load to display default values
    calculateMortgage();
});
