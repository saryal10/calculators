document.addEventListener('DOMContentLoaded', function() {
    const loanAmountInput = document.getElementById('loanAmount');
    const annualInterestRateInput = document.getElementById('annualInterestRate');
    const loanTermYearsInput = document.getElementById('loanTermYears');
    const calculateBtn = document.getElementById('calculateBtn');

    const monthlyPaymentSpan = document.getElementById('monthlyPayment');
    const totalInterestSpan = document.getElementById('totalInterest');
    const totalCostSpan = document.getElementById('totalCost');

    calculateBtn.addEventListener('click', calculateLoanPayment);

    function calculateLoanPayment() {
        const loanAmount = parseFloat(loanAmountInput.value);
        const annualInterestRate = parseFloat(annualInterestRateInput.value);
        const loanTermYears = parseFloat(loanTermYearsInput.value);

        // --- Input Validation ---
        if (isNaN(loanAmount) || loanAmount <= 0) {
            alert('Please enter a valid loan amount.');
            return;
        }
        if (isNaN(annualInterestRate) || annualInterestRate < 0) {
            alert('Please enter a valid annual interest rate.');
            return;
        }
        if (isNaN(loanTermYears) || loanTermYears <= 0) {
            alert('Please enter a valid loan term in years.');
            return;
        }

        const monthlyInterestRate = (annualInterestRate / 100) / 12;
        const numberOfPayments = loanTermYears * 12;

        let monthlyPayment = 0;
        let totalInterest = 0;
        let totalCost = 0;

        if (monthlyInterestRate === 0) {
            // Simple calculation for 0% interest loans
            monthlyPayment = loanAmount / numberOfPayments;
            totalInterest = 0;
            totalCost = loanAmount;
        } else {
            // Standard loan payment formula: M = P [ i(1 + i)^n ] / [ (1 + i)^n – 1]
            monthlyPayment = loanAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
            totalCost = monthlyPayment * numberOfPayments;
            totalInterest = totalCost - loanAmount;
        }

        // --- Display Results ---
        monthlyPaymentSpan.textContent = `$${monthlyPayment.toFixed(2)}`;
        totalInterestSpan.textContent = `$${totalInterest.toFixed(2)}`;
        totalCostSpan.textContent = `$${totalCost.toFixed(2)}`;
    }

    // Initial calculation when the page loads with default values
    calculateLoanPayment();
});
