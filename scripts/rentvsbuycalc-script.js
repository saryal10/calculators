document.addEventListener('DOMContentLoaded', function() {
    // Input elements
    const inputElements = document.querySelectorAll(
        '#comparisonPeriod, #currentMonthlyRent, #annualRentIncrease, ' +
        '#homePurchasePrice, #downPaymentAmount, #annualInterestRate, ' +
        '#loanTermYears, #closingCosts, #annualPropertyTax, ' +
        '#annualHomeInsurance, #monthlyHoa, #annualMaintenance, #annualAppreciationRate'
    );
    const calculateBtn = document.getElementById('calculateBtn'); // Keeping button for manual trigger if desired, but auto-updates will handle most cases

    // Output elements
    const displayComparisonPeriodSpan = document.getElementById('displayComparisonPeriod');
    const totalRentingCostSpan = document.getElementById('totalRentingCost');
    const totalBuyingCostSpan = document.getElementById('totalBuyingCost');
    const recommendationParagraph = document.getElementById('recommendation');

    // Chart elements
    const costComparisonChartCanvas = document.getElementById('costComparisonChart');
    let costComparisonChart; // To hold the Chart.js instance

    // Attach input event listeners to all input fields for real-time updates
    inputElements.forEach(input => {
        input.addEventListener('input', calculateRentVsBuy);
    });

    // Optionally, keep the button listener for explicit calculation
    calculateBtn.addEventListener('click', calculateRentVsBuy);

    function calculateRentVsBuy() {
        // Get values and parse them
        const comparisonPeriodYears = parseFloat(document.getElementById('comparisonPeriod').value);
        let currentMonthlyRent = parseFloat(document.getElementById('currentMonthlyRent').value);
        const annualRentIncrease = parseFloat(document.getElementById('annualRentIncrease').value) / 100;

        const homePurchasePrice = parseFloat(document.getElementById('homePurchasePrice').value);
        const downPaymentAmount = parseFloat(document.getElementById('downPaymentAmount').value);
        const annualInterestRate = parseFloat(document.getElementById('annualInterestRate').value) / 100;
        const loanTermYears = parseFloat(document.getElementById('loanTermYears').value);
        const closingCosts = parseFloat(document.getElementById('closingCosts').value);
        const annualPropertyTax = parseFloat(document.getElementById('annualPropertyTax').value);
        const annualHomeInsurance = parseFloat(document.getElementById('annualHomeInsurance').value);
        const monthlyHoa = parseFloat(document.getElementById('monthlyHoa').value);
        const annualMaintenance = parseFloat(document.getElementById('annualMaintenance').value);
        const annualAppreciationRate = parseFloat(document.getElementById('annualAppreciationRate').value) / 100;

        // --- Input Validation (simplified for real-time, consider more robust UX) ---
        // Basic check for positive values where applicable.
        // A more advanced approach might show inline error messages.
        if (
            isNaN(comparisonPeriodYears) || comparisonPeriodYears <= 0 ||
            isNaN(currentMonthlyRent) || currentMonthlyRent < 0 ||
            isNaN(annualRentIncrease) || annualRentIncrease < 0 ||
            isNaN(homePurchasePrice) || homePurchasePrice <= 0 ||
            isNaN(downPaymentAmount) || downPaymentAmount < 0 ||
            downPaymentAmount >= homePurchasePrice || // Down payment check
            isNaN(annualInterestRate) || annualInterestRate < 0 ||
            isNaN(loanTermYears) || loanTermYears <= 0 ||
            isNaN(closingCosts) || closingCosts < 0 ||
            isNaN(annualPropertyTax) || annualPropertyTax < 0 ||
            isNaN(annualHomeInsurance) || annualHomeInsurance < 0 ||
            isNaN(monthlyHoa) || monthlyHoa < 0 ||
            isNaN(annualMaintenance) || annualMaintenance < 0 ||
            isNaN(annualAppreciationRate) || annualAppreciationRate < 0
        ) {
            // Display default or error state if inputs are invalid
            totalRentingCostSpan.textContent = '$0.00';
            totalBuyingCostSpan.textContent = '$0.00';
            recommendationParagraph.textContent = 'Please enter valid numbers for all fields.';
            recommendationParagraph.classList.remove('highlight', 'warning');
            updateChart([], []); // Clear or show empty chart
            return;
        }

        // --- Calculate Renting Costs ---
        let totalRentingCost = 0;
        let monthlyRent = currentMonthlyRent;
        for (let year = 1; year <= comparisonPeriodYears; year++) {
            totalRentingCost += monthlyRent * 12; // Add 12 months of rent for the current year
            monthlyRent *= (1 + annualRentIncrease); // Increase rent for the next year
        }

        // --- Calculate Buying Costs ---
        let totalBuyingExpenses = 0; // This will accumulate out-of-pocket expenses
        let totalPrincipalPaid = 0; // To track equity built through mortgage payments
        let currentLoanBalance = homePurchasePrice - downPaymentAmount;

        // Initial Costs
        totalBuyingExpenses += downPaymentAmount; // Down payment is an upfront cost
        totalBuyingExpenses += closingCosts;

        // Mortgage Principal & Interest (P&I)
        const principalBorrowed = homePurchasePrice - downPaymentAmount;
        const monthlyInterestRate = annualInterestRate / 12;
        const numberOfPaymentsTotal = loanTermYears * 12;
        let monthlyPayment = 0;

        if (monthlyInterestRate === 0) {
            monthlyPayment = principalBorrowed / numberOfPaymentsTotal; // Avoid division by zero for 0% interest
        } else {
            monthlyPayment = principalBorrowed * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPaymentsTotal)) / (Math.pow(1 + monthlyInterestRate, numberOfPaymentsTotal) - 1);
        }

        // PMI Calculation (if down payment is less than 20%)
        let monthlyPmi = 0;
        if ((downPaymentAmount / homePurchasePrice) < 0.20 && principalBorrowed > 0) { // Ensure principalBorrowed > 0 to avoid division by zero if homePrice = dp
            monthlyPmi = (0.005 * principalBorrowed) / 12; // A common PMI rate is around 0.5% of the loan amount annually
        }

        // Accumulate monthly costs over the comparison period
        for (let month = 1; month <= comparisonPeriodYears * 12; month++) {
            // Only add mortgage P&I if loan is not paid off and within loan term
            if (currentLoanBalance > 0 && month <= numberOfPaymentsTotal) {
                const interestPayment = currentLoanBalance * monthlyInterestRate;
                let principalPayment = monthlyPayment - interestPayment;

                if (principalPayment > currentLoanBalance) { // Cap principal payment at remaining balance
                    principalPayment = currentLoanBalance;
                }

                totalBuyingExpenses += monthlyPayment; // Add full P&I payment
                currentLoanBalance -= principalPayment;
                totalPrincipalPaid += principalPayment;
            } else {
                 // If loan is paid off or term ended, no more P&I or PMI
                monthlyPayment = 0;
                monthlyPmi = 0;
            }

            // Other recurring monthly costs (always apply within comparison period)
            totalBuyingExpenses += annualPropertyTax / 12;
            totalBuyingExpenses += annualHomeInsurance / 12;
            totalBuyingExpenses += monthlyHoa;
            totalBuyingExpenses += annualMaintenance / 12;
            totalBuyingExpenses += monthlyPmi; // PMI continues until LTV reaches 80% or loan is paid off (simplified here)
        }

        // Calculate estimated home value at the end of the period
        const estimatedHomeValueAtEnd = homePurchasePrice * Math.pow(1 + annualAppreciationRate, comparisonPeriodYears);
        const totalAppreciation = estimatedHomeValueAtEnd - homePurchasePrice;

        // Calculate the *net* cost of buying
        // Total expenses incurred MINUS the value gained from equity and appreciation
        // (This assumes you recover the equity and appreciation if you sell at the end of the period)
        // Note: This simplified calculation doesn't include potential selling costs (realtor fees, etc.)
        // which would increase the netBuyingCost if included.
        let netBuyingCost = totalBuyingExpenses - totalPrincipalPaid - totalAppreciation;

        // --- Display Results ---
        displayComparisonPeriodSpan.textContent = comparisonPeriodYears;
        totalRentingCostSpan.textContent = `$${totalRentingCost.toFixed(2)}`;
        totalBuyingCostSpan.textContent = `$${netBuyingCost.toFixed(2)}`;

        // --- Recommendation ---
        recommendationParagraph.classList.remove('highlight', 'warning'); // Reset classes

        if (totalRentingCost < netBuyingCost) {
            recommendationParagraph.textContent = `Over ${comparisonPeriodYears} years, Renting is likely more cost-effective by $${(netBuyingCost - totalRentingCost).toFixed(2)}.`;
            recommendationParagraph.classList.add('highlight');
        } else if (netBuyingCost < totalRentingCost) {
            recommendationParagraph.textContent = `Over ${comparisonPeriodYears} years, Buying is likely more cost-effective by $${(totalRentingCost - netBuyingCost).toFixed(2)}.`;
            recommendationParagraph.classList.add('highlight');
        } else {
            recommendationParagraph.textContent = `Over ${comparisonPeriodYears} years, Renting and Buying cost about the same.`;
        }

        // --- Update Chart ---
        updateChart([totalRentingCost, netBuyingCost]);
    }

    // Function to update the Chart.js bar chart
    function updateChart(dataValues) {
        if (costComparisonChart) {
            costComparisonChart.destroy(); // Destroy existing chart before creating a new one
        }

        costComparisonChart = new Chart(costComparisonChartCanvas, {
            type: 'bar',
            data: {
                labels: ['Total Renting Cost', 'Total Buying Cost (Net)'],
                datasets: [{
                    label: 'Cost Over Period',
                    data: dataValues,
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.6)', // Blue for Renting
                        'rgba(255, 99, 132, 0.6)'  // Red for Buying
                    ],
                    borderColor: [
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 99, 132, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false // No need for legend as bars are labeled
                    },
                    title: {
                        display: true,
                        text: 'Cost Comparison Over Period',
                        font: {
                            size: 16
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Total Cost ($)'
                        },
                        ticks: {
                            callback: function(value) {
                                return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false // Hide x-axis grid lines
                        }
                    }
                }
            }
        });
    }

    // Initial calculation when the page loads with default values
    calculateRentVsBuy();
});
