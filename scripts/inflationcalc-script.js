document.addEventListener('DOMContentLoaded', function() {
    // Input elements
    const initialAmountInput = document.getElementById('initialAmount');
    const annualInflationRateInput = document.getElementById('annualInflationRate');
    const numberOfYearsInput = document.getElementById('numberOfYears');
    const calculateBtn = document.getElementById('calculateBtn'); // Keeping button reference for clarity

    // Output elements
    const displayYearsSpan = document.getElementById('displayYears');
    const futureCostSpan = document.getElementById('futureCost');
    const purchasingPowerSpan = document.getElementById('purchasingPower');
    const inflationBarChartCanvas = document.getElementById('inflationBarChart');

    let inflationChart; // Variable to hold the Chart.js instance

    // Function to calculate inflation and update UI/Chart
    function calculateInflation() {
        const initialAmount = parseFloat(initialAmountInput.value);
        const annualInflationRate = parseFloat(annualInflationRateInput.value);
        const numberOfYears = parseInt(numberOfYearsInput.value);

        // --- Input Validation ---
        // Basic validation - check for valid numbers and reasonable ranges
        if (isNaN(initialAmount) || initialAmount < 0) {
            futureCostSpan.textContent = '$0.00';
            purchasingPowerSpan.textContent = '$0.00';
            updateChart([], []); // Clear chart
            return; // Stop calculation
        }
        if (isNaN(annualInflationRate)) { // Allow negative inflation (deflation)
            futureCostSpan.textContent = '$0.00';
            purchasingPowerSpan.textContent = '$0.00';
            updateChart([], []); // Clear chart
            return; // Stop calculation
        }
        if (isNaN(numberOfYears) || numberOfYears <= 0) {
            futureCostSpan.textContent = '$0.00';
            purchasingPowerSpan.textContent = '$0.00';
            updateChart([], []); // Clear chart
            return; // Stop calculation
        }

        const inflationFactor = 1 + (annualInflationRate / 100);

        // Calculate Future Cost: How much money you'll need in the future to buy what 'initialAmount' buys today.
        const futureCost = initialAmount * Math.pow(inflationFactor, numberOfYears);

        // Calculate Purchasing Power: What 'initialAmount' today will be effectively worth in future dollars.
        const purchasingPower = initialAmount / Math.pow(inflationFactor, numberOfYears);

        // --- Display Results ---
        displayYearsSpan.textContent = numberOfYears;
        futureCostSpan.textContent = `$${futureCost.toFixed(2)}`;
        purchasingPowerSpan.textContent = `$${purchasingPower.toFixed(2)}`;

        // --- Update Chart ---
        const chartLabels = ["Initial Amount", `Future Cost (in ${numberOfYears} years)`];
        const chartData = [initialAmount, futureCost];
        
        updateChart(chartLabels, chartData, numberOfYears);
    }

    // Function to initialize or update the Chart.js Bar Chart
    function updateChart(labels, data, years) {
        if (inflationChart) {
            inflationChart.destroy(); // Destroy previous chart instance if it exists
        }

        // Only create chart if there's valid data
        if (data.length > 0 && data[0] >= 0 && data[1] >= 0) {
            inflationChart = new Chart(inflationBarChartCanvas, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: `Value`,
                        data: data,
                        backgroundColor: [
                            'rgba(75, 192, 192, 0.6)', // Color for Initial Amount
                            'rgba(255, 99, 132, 0.6)'  // Color for Future Cost
                        ],
                        borderColor: [
                            'rgba(75, 192, 192, 1)',
                            'rgba(255, 99, 132, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false, // Allows chart to take specified height/width
                    plugins: {
                        title: {
                            display: true,
                            text: `Inflation Impact Over ${years} Years`,
                            font: {
                                size: 16
                            }
                        },
                        legend: {
                            display: false // We only have one dataset, so legend isn't crucial
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.dataset.label}: $${context.raw.toFixed(2)}`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Amount ($)'
                            },
                            ticks: {
                                callback: function(value) {
                                    return '$' + value.toLocaleString(); // Format Y-axis labels as currency
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
    }

    // --- Real-time Update Setup ---
    // Attach input event listeners to all relevant input fields
    initialAmountInput.addEventListener('input', calculateInflation);
    annualInflationRateInput.addEventListener('input', calculateInflation);
    numberOfYearsInput.addEventListener('input', calculateInflation);

    // Initial calculation on page load to display default values and chart
    calculateInflation();

    // Optionally, you can still keep the button listener if you want a manual trigger
    // calculateBtn.addEventListener('click', calculateInflation);
});
