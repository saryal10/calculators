// scripts/budgetcalc-script.js

// --- Debounce Function ---
function debounce(func, delay) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

// --- Helper to Generate Random Colors for Chart ---
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// All DOM manipulation and event listener setup should happen after the DOM is fully loaded.
document.addEventListener('DOMContentLoaded', function() {
    // --- DOM Elements ---
    const incomeInputsDiv = document.getElementById('incomeInputs');
    const expenseInputsDiv = document.getElementById('expenseInputs');
    const addIncomeBtn = document.getElementById('addIncomeBtn');
    const addExpenseBtn = document.getElementById('addExpenseBtn');
    const totalIncomeElem = document.getElementById('totalIncome');
    const totalExpensesElem = document.getElementById('totalExpenses');
    const netBalanceElem = document.getElementById('netBalance');
    const budgetChartCanvas = document.getElementById('budgetChart');
    // Removed calculateBtn since the page automatically calculates on input change and doesn't have an explicit 'Calculate' button anymore.

    let budgetChart; // To hold the Chart.js instance

    // --- Core Calculation and UI Update Function ---
    function calculateBudget() {
        let totalIncome = 0;
        let totalExpenses = 0;
        const expenseDataForChart = [];

        // Calculate Total Income
        document.querySelectorAll('.income-value').forEach((input) => {
            const incomeValue = parseFloat(input.value) || 0;
            totalIncome += incomeValue;
        });

        // Calculate Total Expenses and collect data for chart
        document.querySelectorAll('.expense-item').forEach((item) => {
            const nameInput = item.querySelector('input[type="text"]');
            const valueInput = item.querySelector('.expense-value');
            const expenseValue = parseFloat(valueInput.value) || 0;
            const expenseName = nameInput.value.trim() || 'Unnamed Expense';

            totalExpenses += expenseValue;

            if (expenseValue > 0) {
                expenseDataForChart.push({ label: expenseName, value: expenseValue });
            }
        });

        const netBalance = totalIncome - totalExpenses;

        // Update summary display
        totalIncomeElem.textContent = `$${totalIncome.toFixed(2)}`;
        totalExpensesElem.textContent = `$${totalExpenses.toFixed(2)}`;
        netBalanceElem.textContent = `$${netBalance.toFixed(2)}`;

        // Apply color based on net balance
        netBalanceElem.classList.remove('positive', 'negative');
        if (netBalance >= 0) {
            netBalanceElem.classList.add('positive');
        } else {
            netBalanceElem.classList.add('negative');
        }

        // Update the Expense Breakdown Chart
        updateBudgetChart(expenseDataForChart);
    }

    // --- Chart Update Function ---
    function updateBudgetChart(expenseData) {
        const labels = expenseData.map(item => item.label);
        const data = expenseData.map(item => item.value);
        const backgroundColors = data.map(() => getRandomColor());

        if (budgetChart) {
            budgetChart.destroy();
        }

        if (data.length > 0) {
            budgetChart = new Chart(budgetChartCanvas, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: backgroundColors,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                        },
                        title: {
                            display: true,
                            text: 'Expense Breakdown'
                        }
                    }
                }
            });
        } else {
            const ctx = budgetChartCanvas.getContext('2d');
            ctx.clearRect(0, 0, budgetChartCanvas.width, budgetChartCanvas.height);
        }
    }

    // --- Dynamic Item Creation Functions ---
    function createItem(type, namePlaceholder, amountValue, canRemove = true) {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add(`${type}-item`);

        itemDiv.innerHTML = `
            <label>${namePlaceholder}:</label>
            <input type="text" value="${namePlaceholder}">
            <input type="number" class="${type}-value" value="${amountValue}">
            <button class="remove-btn">${canRemove ? 'Remove' : ''}</button> `;

        const nameInput = itemDiv.querySelector('input[type="text"]');
        const valueInput = itemDiv.querySelector('input[type="number"]');
        nameInput.addEventListener('input', debouncedCalculate);
        valueInput.addEventListener('input', debouncedCalculate);

        const removeButton = itemDiv.querySelector('.remove-btn');
        if (canRemove) {
            removeButton.addEventListener('click', () => {
                itemDiv.remove();
                calculateBudget();
            });
        } else {
            removeButton.style.display = 'none';
            removeButton.classList.add('initial-item');
        }
        return itemDiv;
    }

    // --- Event Handlers for Add Buttons ---
    addIncomeBtn.addEventListener('click', () => {
        const newItem = createItem('income', 'New Income', 0);
        incomeInputsDiv.appendChild(newItem);
        calculateBudget();
    });

    addExpenseBtn.addEventListener('click', () => {
        const newItem = createItem('expense', 'New Expense', 0);
        expenseInputsDiv.appendChild(newItem);
        calculateBudget();
    });

    // --- Event Listeners for existing items ---
    const debouncedCalculate = debounce(calculateBudget, 500);

    // Attach input listeners to all existing items
    document.querySelectorAll('.income-item input, .expense-item input').forEach(input => {
        input.addEventListener('input', debouncedCalculate);
    });

    // Attach remove listeners to existing remove buttons, excluding those with 'initial-item' class
    document.querySelectorAll('.remove-btn:not(.initial-item)').forEach(button => {
        button.addEventListener('click', () => {
            button.closest('.income-item, .expense-item').remove();
            calculateBudget();
        });
    });

    // Initial setup of remove button visibility and content for default items on page load
    document.querySelectorAll('.remove-btn.initial-item').forEach(button => {
        button.style.display = 'none';
        button.textContent = ''; // Ensure no text is visible if hidden
    });

    // Initial calculation on page load
    calculateBudget();
});
