document.addEventListener('DOMContentLoaded', function() {
    const incomeInputsContainer = document.getElementById('incomeInputs');
    const expenseInputsContainer = document.getElementById('expenseInputs');
    const addIncomeBtn = document.getElementById('addIncomeBtn');
    const addExpenseBtn = document.getElementById('addExpenseBtn');

    const totalIncomeSpan = document.getElementById('totalIncome');
    const totalExpensesSpan = document.getElementById('totalExpenses');
    const netBalanceSpan = document.getElementById('netBalance');

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
    }

    // Add event listeners using event delegation for dynamically added inputs
    incomeInputsContainer.addEventListener('input', function(event) {
        if (event.target.classList.contains('income-value')) {
            calculateBudget();
        }
    });

    expenseInputsContainer.addEventListener('input', function(event) {
        if (event.target.classList.contains('expense-value')) {
            calculateBudget();
        }
    });

    // Initial calculation on page load
    calculateBudget();
});
