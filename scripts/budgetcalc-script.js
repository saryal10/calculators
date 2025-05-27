// scripts/budgetcalc-script.js

// --- DOM Elements ---
const incomeInputsDiv = document.getElementById('incomeInputs');
const expenseInputsDiv = document.getElementById('expenseInputs');
const addIncomeBtn = document.getElementById('addIncomeBtn');
const addExpenseBtn = document.getElementById('addExpenseBtn');
const totalIncomeElem = document.getElementById('totalIncome');
const totalExpensesElem = document.getElementById('totalExpenses');
const netBalanceElem = document.getElementById('netBalance');
const budgetChartCanvas = document.getElementById('budgetChart');
let budgetChart; // To hold the Chart.js instance

// --- Debounce Function ---
// Prevents a function from being called too frequently.
// Useful for input events to avoid excessive recalculations.
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

// --- Core Calculation and UI Update Function ---
function calculateBudget() {
    console.log('Calculating budget...'); // Debugging: Function called
    let totalIncome = 0;
    let totalExpenses = 0;
    const expenseDataForChart = []; // To store { label: 'Expense Name', value: amount }

    // Calculate Total Income
    document.querySelectorAll('.income-value').forEach((input, index) => {
        const incomeValue = parseFloat(input.value) || 0;
        totalIncome += incomeValue;
        console.log(`Income item ${index}: value='${input.value}', parsed=${incomeValue}, current totalIncome=${totalIncome}`); // Debugging
    });

    // Calculate Total Expenses and collect data for chart
    document.querySelectorAll('.expense-item').forEach((item, index) => {
        const nameInput = item.querySelector('input[type="text"]');
        const valueInput = item.querySelector('.expense-value');
        const expenseValue = parseFloat(valueInput.value) || 0;
        const expenseName = nameInput.value.trim() || 'Unnamed Expense';

        totalExpenses += expenseValue;
        console.log(`Expense item ${index}: name='${expenseName}', value='${valueInput.value}', parsed=${expenseValue}, current totalExpenses=${totalExpenses}`); // Debugging

        if (expenseValue > 0) { // Only add positive expenses to the chart
            expenseDataForChart.push({ label: expenseName, value: expenseValue });
            console.log(`Added to chart data: ${expenseName}, ${expenseValue}`); // Debugging
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
    console.log('Budget calculation complete. Total Income:', totalIncome, 'Total Expenses:', totalExpenses, 'Net Balance:', netBalance); // Debugging
    console.log('Expense Data for Chart:', expenseDataForChart); // Debugging
}

// --- Chart Update Function ---
function updateBudgetChart(expenseData) {
    console.log('Updating chart with data:', expenseData); // Debugging
    const labels = expenseData.map(item => item.label);
    const data = expenseData.map(item => item.value);
    const backgroundColors = data.map(() => getRandomColor());

    if (budgetChart) {
        budgetChart.destroy(); // Destroy existing chart before creating a new one
    }

    // Only create chart if there's data to display
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
                        position: 'right', // Place legend on the right for better readability
                    },
                    title: {
                        display: true,
                        text: 'Expense Breakdown' // Chart title
                    }
                }
            }
        });
    } else {
        // If no data, ensure canvas is clear or display a message
        const ctx = budgetChartCanvas.getContext('2d');
        ctx.clearRect(0, 0, budgetChartCanvas.width, budgetChartCanvas.height);
        console.log('No expense data to display for chart.'); // Debugging
    }
}

// --- Dynamic Item Creation Functions ---
function createItem(type, nameValue, amountValue, canRemove = true) {
    const itemDiv = document.createElement('div');
    itemDiv.classList.add(`${type}-item`);

    itemDiv.innerHTML = `
        <label>${nameValue}:</label>
        <input type="text" value="${nameValue}">
        <input type="number" class="${type}-value" value="${amountValue}">
        <button class="remove-btn">${canRemove ? 'Remove' : 'Remove'}</button>
    `;

    // Add event listeners to the new inputs (debounced)
    const nameInput = itemDiv.querySelector('input[type="text"]');
    const valueInput = itemDiv.querySelector('input[type="number"]');
    nameInput.addEventListener('input', debouncedCalculate);
    valueInput.addEventListener('input', debouncedCalculate);

    const removeButton = itemDiv.querySelector('.remove-btn');
    if (canRemove) {
        removeButton.addEventListener('click', () => {
            itemDiv.remove();
            calculateBudget(); // Recalculate after removing an item
        });
    } else {
        // Ensure the remove button is hidden for the first item
        // and doesn't have a click listener if it's not meant to be removed
        removeButton.style.visibility = 'hidden';
        // It's good practice to explicitly remove the listener if it was there,
        // though visibility hidden usually implies it's not interactive.
        // For default items, the listener is attached via DOMContentLoaded loop,
        // so this specific line for newly created non-removable items isn't strictly needed
        // unless you dynamically change `canRemove` for an existing item.
    }
    return itemDiv;
}

// --- Event Handlers for Add Buttons ---
addIncomeBtn.addEventListener('click', () => {
    const newItem = createItem('income', 'New Income', 0);
    incomeInputsDiv.appendChild(newItem);
    calculateBudget(); // Recalculate after adding a new item
});

addExpenseBtn.addEventListener('click', () => {
    const newItem = createItem('expense', 'New Expense', 0);
    expenseInputsDiv.appendChild(newItem);
    calculateBudget(); // Recalculate after adding a new item
});

// --- Initial Setup and Event Delegation for Existing Items ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded. Initializing...'); // Debugging

    // Attach input listeners to initial items (before adding new ones)
    // Select all inputs that are part of income or expense items
    document.querySelectorAll('.income-item input, .expense-item input').forEach(input => {
        input.addEventListener('input', debouncedCalculate);
    });

    // Attach remove listeners to initial remove buttons
    document.querySelectorAll('.remove-btn').forEach(button => {
        // Only attach if the button is not explicitly hidden (meaning it's removable)
        // This check is important for the first income/expense item's remove button
        if (button.style.visibility !== 'hidden') {
            button.addEventListener('click', () => {
                button.closest('.income-item, .expense-item').remove();
                calculateBudget(); // Recalculate after removing
            });
        }
    });

    // Initial calculation on page load
    calculateBudget();
});

// --- Main Calculate Button Event Listener (Immediate) ---
document.getElementById('calculateBtn').addEventListener('click', calculateBudget);

// Create a debounced version of the main calculation function
const debouncedCalculate = debounce(calculateBudget, 500); // 500ms debounce delay
