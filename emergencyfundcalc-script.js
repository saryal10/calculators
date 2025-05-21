document.addEventListener('DOMContentLoaded', function() {
    const desiredCoverageMonthsInput = document.getElementById('desiredCoverageMonths');
    const expenseInputsContainer = document.getElementById('expenseInputs');
    const addExpenseBtn = document.getElementById('addExpenseBtn');

    const totalMonthlyExpensesSpan = document.getElementById('totalMonthlyExpenses');
    const recommendedEmergencyFundSpan = document.getElementById('recommendedEmergencyFund');

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

        const valueInput = document.createElement('input');
        valueInput.type = 'number';
        valueInput.classList.add('expense-value');
        valueInput.value = value;
        valueInput.placeholder = 'Amount ($)';
        valueInput.step = '0.01';

        const removeBtn = document.createElement('button');
        removeBtn.classList.add('remove-btn');
        removeBtn.textContent = 'Remove';
        removeBtn.style.visibility = removable ? 'visible' : 'hidden'; // Hide remove for initial items
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
        expenseInputsContainer.appendChild(createExpenseInputRow('Other', '', true));
        calculateEmergencyFund();
    });

    // Function to calculate emergency fund
    function calculateEmergencyFund() {
        let totalMonthlyExpenses = 0;
        document.querySelectorAll('.expense-value').forEach(input => {
            const value = parseFloat(input.value);
            if (!isNaN(value)) {
                totalMonthlyExpenses += value;
            }
        });

        const desiredCoverageMonths = parseFloat(desiredCoverageMonthsInput.value);

        if (isNaN(desiredCoverageMonths) || desiredCoverageMonths < 1) {
            // Fallback or alert for invalid months input
            totalMonthlyExpensesSpan.textContent = `$${totalMonthlyExpenses.toFixed(2)}`;
            recommendedEmergencyFundSpan.textContent = `$0.00`;
            return;
        }

        const recommendedEmergencyFund = totalMonthlyExpenses * desiredCoverageMonths;

        // Display results
        totalMonthlyExpensesSpan.textContent = `$${totalMonthlyExpenses.toFixed(2)}`;
        recommendedEmergencyFundSpan.textContent = `$${recommendedEmergencyFund.toFixed(2)}`;
    }

    // Add event listeners using event delegation for dynamically added inputs
    expenseInputsContainer.addEventListener('input', function(event) {
        if (event.target.classList.contains('expense-value')) {
            calculateEmergencyFund();
        }
    });

    desiredCoverageMonthsInput.addEventListener('input', calculateEmergencyFund);

    // Initial calculation on page load
    calculateEmergencyFund();
});
