document.addEventListener('DOMContentLoaded', function() {
    const incomeInputsContainer = document.getElementById('incomeInputs');
    const expenseInputsContainer = document.getElementById('expenseInputs');
    const addIncomeBtn = document.getElementById('addIncomeBtn');
    const addExpenseBtn = document.getElementById('addExpenseBtn');

    const totalIncomeSpan = document.getElementById('totalIncome');
    const totalExpensesSpan = document.getElementById('totalExpenses');
    const netBalanceSpan = document.getElementById('netBalance');

    const budgetChartCanvas = document.getElementById('budgetChart'); // Get the canvas element
    let budgetChart; // Variable to hold the Chart.js instance

    // Function to create a new input row
    function createInputRow(type, labelText = '', value = '', removable = true) {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add(`${type}-item`);

        const label = document.createElement('label');
        label.textContent = labelText;

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = labelText; // Pre-fill with labelText
        nameInput.placeholder = `e.g., ${labelText}`; // Placeholder for clarity

        const valueInput = document.createElement('input');
        valueInput.type = 'number';
        valueInput.classList.add(`${type}-value`);
        valueInput.value = value;
        valueInput.placeholder = 'Amount ($)';
        valueInput.step = '0.01'; // Allow cents

        const removeBtn = document.createElement('button');
        removeBtn.classList.add('remove-btn');
        removeBtn.textContent = 'Remove';
        removeBtn.style.visibility = removable ? 'visible' : 'hidden'; // Hide remove for initial items
        if (removable) {
            removeBtn.addEventListener('click', function() {
                itemDiv.remove();
                calculateBudget(); // Recalculate after removing
            });
        }

        itemDiv.appendChild(label);
        itemDiv.appendChild(nameInput); // Name input
        itemDiv.appendChild(valueInput); // Value input
        itemDiv.appendChild(removeBtn);

        return itemDiv;
    }

    // Add Income/Expense Row Functions
    addIncomeBtn.addEventListener('click', function() {
        incomeInputsContainer.appendChild(createInputRow('income', 'New Income', '', true));
        calculateBudget();
    });

    addExpenseBtn.addEventListener('click', function() {
        expenseInputsContainer.appendChild(createInputRow('expense', 'New Expense', '', true));
        calculateBudget();
    });

    // Function to calculate the budget totals
    function calculateBudget() {
        let totalIncome = 0;
        document.querySelectorAll('.income-value').forEach(input => {
            const value = parseFloat(input.value);
            if (!isNaN(value)) {
                totalIncome += value;
            }
        });

        let totalExpenses = 0;
        document.querySelectorAll('.expense-value').forEach(input => {
            const value = parseFloat(input.value);
            if (!isNaN(value)) {
                totalExpenses += value;
            }
        });

        const netBalance = totalIncome - totalExpenses;

        // Display results
        totalIncomeSpan.textContent = `$${totalIncome.toFixed(2)}`;
        totalExpensesSpan.textContent = `$${totalExpenses.toFixed(2)}`;
        netBalanceSpan.textContent = `$${netBalance.toFixed(2)}`;

        // Apply color based on net balance
        netBalanceSpan.classList.remove('positive', 'negative');
        if (netBalance >= 0) {
            netBalanceSpan.classList.add('positive');
        } else {
            netBalanceSpan.classList.add('negative');
        }

        // Update the pie chart
        updatePieChart(totalIncome, totalExpenses);
    }

    // Add event listeners using event delegation for dynamically added inputs
    incomeInputsContainer.addEventListener('input', function(event) {
        // Only trigger recalculation if a value input was changed
        if (event.target.classList.contains('income-value') || event.target.type === 'text') {
            calculateBudget();
        }
    });

    expenseInputsContainer.addEventListener('input', function(event) {
        // Only trigger recalculation if a value input was changed
        if (event.target.classList.contains('expense-value') || event.target.type === 'text') {
            calculateBudget();
        }
    });

    // Function to create or update the pie chart
    function updatePieChart(income, expenses) {
        const ctx = budgetChartCanvas.getContext('2d');

        // Destroy existing chart instance if it exists to prevent multiple charts rendering
        if (budgetChart) {
            budgetChart.destroy();
        }

        // Only show chart if there's some income or expense to avoid empty pie
        if (income > 0 || expenses > 0) {
            budgetChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: ['Total Income', 'Total Expenses'],
                    datasets: [{
                        data: [income, expenses],
                        backgroundColor: [
                            '#28a745', // Green for Income
                            '#dc3545'  // Red for Expenses
                        ],
                        hoverBackgroundColor: [
                            '#218838',
                            '#c82333'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false, // Allows the chart to fill its container
                    plugins: {
                        title: {
                            display: false, // We added a separate H3 title in HTML
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed !== null) {
                                        label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed);
                                    }
                                    return label;
                                }
                            }
                        },
                        legend: {
                            position: 'bottom', // Place legend at the bottom
                            labels: {
                                font: {
                                    size: 12
                                }
                            }
                        }
                    }
                }
            });
        } else {
            // If no data, ensure no chart is displayed or show a message
            ctx.clearRect(0, 0, budgetChartCanvas.width, budgetChartCanvas.height); // Clear canvas
            // You could also add a message to the canvas or its container
        }
    }

    // Initial calculation on page load to display results and chart immediately
    calculateBudget();
});
