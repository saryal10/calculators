document.addEventListener('DOMContentLoaded', function() {
    const desiredCoverageMonthsInput = document.getElementById('desiredCoverageMonths');
    const expenseInputsContainer = document.getElementById('expenseInputs');
    const addExpenseBtn = document.getElementById('addExpenseBtn');

    const totalMonthlyExpensesSpan = document.getElementById('totalMonthlyExpenses');
    const recommendedEmergencyFundSpan = document.getElementById('recommendedEmergencyFund');
    const emergencyFundBarChartCanvas = document.getElementById('emergencyFundBarChart');

    let emergencyFundChart; // Variable to hold the Chart.js instance

    // Function to create a new expense input row
    function createExpenseInputRow(labelText = 'New Expense', value = '', removable = true) {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('expense-item');

        const label = document.createElement('label');
        label.textContent = labelText + ':';

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = labelText;
        nameInput.placeholder = `e.g., ${labelText}`;
        nameInput.addEventListener('input', calculateEmergencyFund); // Listen for name changes too

        const valueInput = document.createElement('input');
        valueInput.type = 'number';
        valueInput.classList.add('expense-value');
        valueInput.value = value;
        valueInput.placeholder = 'Amount ($)';
        valueInput.step = '0.01';
        valueInput.addEventListener('input', calculateEmergencyFund); // Real-time update for expense values

        const removeBtn = document.createElement('button');
        removeBtn.classList.add('remove-btn');
        removeBtn.textContent = 'Remove';
        removeBtn.style.visibility = removable ? 'visible' : 'hidden'; // Hide remove for initial non-removable items
        if (removable) {
            removeBtn.addEventListener('click', function() {
                itemDiv.remove();
                calculateEmergencyFund(); // Recalculate after removing
            });
        }

        itemDiv.appendChild(label);
        itemDiv.appendChild(nameInput);
        itemDiv.appendChild(valueInput);
        itemDiv.appendChild(removeBtn);

        return itemDiv;
    }

    // Add Expense Row Function
    addExpenseBtn.addEventListener('click', function() {
        // Create a new expense item with default values, and make it removable
        expenseInputsContainer.appendChild(createExpenseInputRow('Other Expense', '', true));
        calculateEmergencyFund();
    });

    // Function to calculate emergency fund and update chart
    function calculateEmergencyFund() {
        let totalMonthlyExpenses = 0;
        const expenseValues = [];
        const expenseLabels = [];

        document.querySelectorAll('.expense-item').forEach(itemDiv => {
            const nameInput = itemDiv.querySelector('input[type="text"]');
            const valueInput = itemDiv.querySelector('.expense-value');
            
            const value = parseFloat(valueInput.value);
            const label = nameInput ? nameInput.value : 'Unnamed Expense'; // Get label from text input

            if (!isNaN(value) && value > 0) { // Only add positive values to sum and chart
                totalMonthlyExpenses += value;
                expenseValues.push(value);
                expenseLabels.push(label);
            }
        });

        const desiredCoverageMonths = parseFloat(desiredCoverageMonthsInput.value);

        if (isNaN(desiredCoverageMonths) || desiredCoverageMonths < 1) {
            // Handle invalid months input gracefully
            totalMonthlyExpensesSpan.textContent = `$${totalMonthlyExpenses.toFixed(2)}`;
            recommendedEmergencyFundSpan.textContent = `$0.00`;
            updateChart(0, 0, 0); // Clear chart or show zero
            return;
        }

        const recommendedEmergencyFund = totalMonthlyExpenses * desiredCoverageMonths;

        // Display results
        totalMonthlyExpensesSpan.textContent = `$${totalMonthlyExpenses.toFixed(2)}`;
        recommendedEmergencyFundSpan.textContent = `$${recommendedEmergencyFund.toFixed(2)}`;

        // Update the chart
        updateChart(totalMonthlyExpenses, recommendedEmergencyFund, desiredCoverageMonths);
    }

    // Function to initialize or update the Chart.js Bar Chart
    function updateChart(totalExpenses, recommendedFund, months) {
        if (emergencyFundChart) {
            emergencyFundChart.destroy(); // Destroy previous chart instance if it exists
        }

        // Only create chart if there's valid data
        if (totalExpenses >= 0 && recommendedFund >= 0) {
            emergencyFundChart = new Chart(emergencyFundBarChartCanvas, {
                type: 'bar',
                data: {
                    labels: ['Total Monthly Expenses', `Recommended Fund (${months} Months)`],
                    datasets: [{
                        label: 'Amount ($)',
                        data: [totalExpenses, recommendedFund],
                        backgroundColor: [
                            'rgba(255, 159, 64, 0.7)', // Orange for Monthly Expenses
                            'rgba(75, 192, 192, 0.7)'  // Teal for Recommended Fund
                        ],
                        borderColor: [
                            'rgba(255, 159, 64, 1)',
                            'rgba(75, 192, 192, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false // We show labels directly on the bars
                        },
                        title: {
                            display: true,
                            text: 'Emergency Fund Overview',
                            font: {
                                size: 16
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.label}: $${context.raw.toFixed(2)}`;
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

    // Add event listeners for real-time updates
    desiredCoverageMonthsInput.addEventListener('input', calculateEmergencyFund);
    
    // Event delegation for dynamically added expense inputs
    // This catches 'input' events from any '.expense-value' inside expenseInputsContainer
    expenseInputsContainer.addEventListener('input', function(event) {
        if (event.target.classList.contains('expense-value') || event.target.type === 'text') {
            calculateEmergencyFund();
        }
    });

    // Initial calculation on page load
    calculateEmergencyFund();
});
