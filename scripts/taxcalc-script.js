document.addEventListener('DOMContentLoaded', function() {
    // Define hypothetical progressive tax brackets
    // Each object represents an upper limit of a bracket and its marginal rate.
    // This example is purely illustrative and does NOT represent real tax law.
    const hypotheticalTaxBrackets = [
        { upperLimit: 15000, rate: 0.00 }, // 0% on income up to $15,000
        { upperLimit: 50000, rate: 0.10 }, // 10% on income between $15,001 and $50,000
        { upperLimit: 100000, rate: 0.20 },// 20% on income between $50,001 and $100,000
        { upperLimit: Infinity, rate: 0.25 } // 25% on income above $100,000
    ];

    // Input elements
    const grossIncomeInput = document.getElementById('grossIncome');
    const totalDeductionsInput = document.getElementById('totalDeductions');
    const calculateBtn = document.getElementById('calculateBtn'); // Keeping button reference for clarity

    // Output elements
    const taxableIncomeSpan = document.getElementById('taxableIncome');
    const estimatedTaxSpan = document.getElementById('estimatedTax');
    const afterTaxIncomeSpan = document.getElementById('afterTaxIncome');
    const taxDistributionChartCanvas = document.getElementById('taxDistributionChart');

    let taxChart; // Variable to hold the Chart.js instance

    // Function to calculate tax and update UI/Chart
    function calculateTax() {
        const grossIncome = parseFloat(grossIncomeInput.value);
        const totalDeductions = parseFloat(totalDeductionsInput.value);

        // --- Input Validation ---
        // Basic validation - ensure inputs are numbers and non-negative
        if (isNaN(grossIncome) || grossIncome < 0) {
            taxableIncomeSpan.textContent = '$0.00';
            estimatedTaxSpan.textContent = '$0.00';
            afterTaxIncomeSpan.textContent = '$0.00';
            updateChart([], []); // Clear chart
            return; // Stop calculation
        }
        if (isNaN(totalDeductions) || totalDeductions < 0) {
            taxableIncomeSpan.textContent = '$0.00';
            estimatedTaxSpan.textContent = '$0.00';
            afterTaxIncomeSpan.textContent = '$0.00';
            updateChart([], []); // Clear chart
            return; // Stop calculation
        }

        // Calculate taxable income
        let taxableIncome = Math.max(0, grossIncome - totalDeductions); // Taxable income cannot be negative

        let estimatedTax = 0;
        let previousBracketUpper = 0;

        // Calculate tax based on progressive brackets
        for (const bracket of hypotheticalTaxBrackets) {
            if (taxableIncome > previousBracketUpper) {
                // Amount of income falling within the current bracket
                const incomeInThisBracket = Math.min(taxableIncome, bracket.upperLimit) - previousBracketUpper;
                estimatedTax += incomeInThisBracket * bracket.rate;
            } else {
                // No more taxable income left for higher brackets
                break;
            }
            previousBracketUpper = bracket.upperLimit;
        }

        const afterTaxIncome = grossIncome - estimatedTax;

        // --- Display Results ---
        taxableIncomeSpan.textContent = `$${taxableIncome.toFixed(2)}`;
        estimatedTaxSpan.textContent = `$${estimatedTax.toFixed(2)}`;
        afterTaxIncomeSpan.textContent = `$${afterTaxIncome.toFixed(2)}`;

        // --- Update Chart ---
        // We'll chart the distribution of Gross Income: Deductions, Tax Paid, and What's Left (After-Tax)
        const chartLabels = ["Deductions", "Estimated Tax", "After-Tax Income"];
        const chartData = [totalDeductions, estimatedTax, afterTaxIncome];
        
        // Filter out categories that are zero or negative for a cleaner chart, unless all are zero.
        const filteredLabels = [];
        const filteredData = [];
        
        if (totalDeductions > 0 || estimatedTax > 0 || afterTaxIncome > 0) { // Only show chart if there's positive income/tax/deductions
            if (totalDeductions > 0) {
                filteredLabels.push("Deductions");
                filteredData.push(totalDeductions);
            }
            if (estimatedTax > 0) {
                filteredLabels.push("Estimated Tax");
                filteredData.push(estimatedTax);
            }
            if (afterTaxIncome > 0) {
                filteredLabels.push("After-Tax Income");
                filteredData.push(afterTaxIncome);
            }
        }
        
        updateChart(filteredLabels, filteredData);
    }

    // Function to initialize or update the Chart.js Pie Chart
    function updateChart(labels, data) {
        if (taxChart) {
            taxChart.destroy(); // Destroy previous chart instance if it exists
        }

        // Only create chart if there's valid data to display
        if (data.length > 0 && data.some(val => val > 0)) { // Ensure there's at least one positive slice
            taxChart = new Chart(taxDistributionChartCanvas, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: [
                            'rgba(153, 102, 255, 0.7)', // Purple for Deductions
                            'rgba(255, 99, 132, 0.7)',  // Red for Estimated Tax
                            'rgba(75, 192, 192, 0.7)'   // Green for After-Tax Income
                        ],
                        borderColor: '#fff', // White border between slices
                        borderWidth: 1,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false, // Allows chart to take specified height/width
                    plugins: {
                        legend: {
                            position: 'right', // Position legend on the right
                        },
                        title: {
                            display: true,
                            text: 'Gross Income Distribution',
                            font: {
                                size: 16
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const value = context.parsed;
                                    const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
                                    const percentage = total > 0 ? (value / total * 100).toFixed(1) : 0;
                                    return `${context.label}: $${value.toFixed(2)} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    // --- Real-time Update Setup ---
    // Attach input event listeners to all relevant input fields
    grossIncomeInput.addEventListener('input', calculateTax);
    totalDeductionsInput.addEventListener('input', calculateTax);

    // Initial calculation on page load to display default values and chart
    calculateTax();

    // Optionally, you can still keep the button listener if you want a manual trigger
    // calculateBtn.addEventListener('click', calculateTax);
});
