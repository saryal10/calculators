document.addEventListener('DOMContentLoaded', function() {
    const annualRateInput = document.getElementById('annualRateInput');
    const yearsToDoubleInput = document.getElementById('yearsToDoubleInput');

    const yearsToDoubleSpan = document.getElementById('yearsToDouble');
    const requiredRateSpan = document.getElementById('requiredRate');
    const rule72ChartCanvas = document.getElementById('rule72Chart');

    let rule72Chart; // Variable to hold the Chart.js instance

    // Function to clear all text results and chart
    function clearResults() {
        yearsToDoubleSpan.textContent = '---';
        requiredRateSpan.textContent = '---';
        updateChart('Select an input', 0, ''); // Clear chart with a placeholder
    }

    // Function to update the Chart.js Bar Chart
    function updateChart(label, value, unit) {
        if (rule72Chart) {
            rule72Chart.destroy(); // Destroy previous chart instance if it exists
        }

        // Only create chart if a valid value is provided
        if (value > 0) {
            rule72Chart = new Chart(rule72ChartCanvas, {
                type: 'bar',
                data: {
                    labels: [label],
                    datasets: [{
                        label: 'Value',
                        data: [value],
                        backgroundColor: 'rgba(0, 123, 255, 0.7)', // Blue
                        borderColor: 'rgba(0, 123, 255, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false // No legend needed for a single bar
                        },
                        title: {
                            display: true,
                            text: 'Calculated Result',
                            font: {
                                size: 16
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.label}: ${context.raw.toFixed(2)}${unit}`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: unit === '%' ? 'Rate (%)' : 'Years' // Dynamic Y-axis label
                            },
                            ticks: {
                                callback: function(value) {
                                    return value.toLocaleString() + unit; // Add unit to tick labels
                                }
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        } else {
            // Display a message or blank chart if no valid input
            rule72Chart = new Chart(rule72ChartCanvas, {
                type: 'bar', // Still a bar chart type for consistency, but with no data
                data: {
                    labels: ['No Data'],
                    datasets: [{
                        label: 'Value',
                        data: [0], // Show a zero bar
                        backgroundColor: 'rgba(200, 200, 200, 0.5)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        title: { display: true, text: 'Enter a value to see the result', font: { size: 16 } }
                    },
                    scales: {
                        y: { beginAtZero: true, display: false }, // Hide axis if no data
                        x: { display: false }
                    }
                }
            });
        }
    }

    // Listener for annual rate input
    annualRateInput.addEventListener('input', function() {
        const rate = parseFloat(annualRateInput.value);

        // Clear the other input and its result
        yearsToDoubleInput.value = '';
        requiredRateSpan.textContent = '---';

        if (!isNaN(rate) && rate > 0) {
            const years = 72 / rate;
            yearsToDoubleSpan.textContent = `${years.toFixed(2)} years`;
            updateChart('Years to Double', years, ' years');
        } else if (annualRateInput.value === '') {
            clearResults(); // If input is truly empty, clear everything
        } else {
            yearsToDoubleSpan.textContent = 'Invalid input';
            updateChart('Invalid Input', 0, ''); // Clear chart or show invalid state
        }
    });

    // Listener for years to double input
    yearsToDoubleInput.addEventListener('input', function() {
        const years = parseFloat(yearsToDoubleInput.value);

        // Clear the other input and its result
        annualRateInput.value = '';
        yearsToDoubleSpan.textContent = '---';

        if (!isNaN(years) && years > 0) {
            const rate = 72 / years;
            requiredRateSpan.textContent = `${rate.toFixed(2)}%`;
            updateChart('Required Rate', rate, '%');
        } else if (yearsToDoubleInput.value === '') {
            clearResults(); // If input is truly empty, clear everything
        } else {
            requiredRateSpan.textContent = 'Invalid input';
            updateChart('Invalid Input', 0, ''); // Clear chart or show invalid state
        }
    });

    // Initial state (cleared results and chart)
    clearResults();
});
