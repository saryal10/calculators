document.addEventListener('DOMContentLoaded', function() {
    const loanAmountInput = document.getElementById('loanAmount');
    const interestRateInput = document.getElementById('interestRate');
    const loanTermInput = document.getElementById('loanTerm');
    const calculateBtn = document.getElementById('calculateBtn');
    const monthlyPaymentSpan = document.getElementById('monthlyPayment');
    const totalInterestSpan = document.getElementById('totalInterest');
    const totalCostSpan = document.getElementById('totalCost');

    calculateBtn.addEventListener('click', calculateMortgage);

    function calculateMortgage() {
        const loanAmount = parseFloat(loanAmountInput.value);
        const annualInterestRate = parseFloat(interestRateInput.value);
        const loanTermYears = parseFloat(loanTermInput.value);

        // Validate inputs
        if (isNaN(loanAmount) || loanAmount <= 0) {
            alert('Please enter a valid loan amount.');
            return;
        }
        if (isNaN(annualInterestRate) || annualInterestRate < 0) {
            alert('Please enter a valid annual interest rate.');
            return;
        }
        if (isNaN(loanTermYears) || loanTermYears <= 0) {
            alert('Please enter a valid loan term.');
            return;
        }

        const monthlyInterestRate = (annualInterestRate / 100) / 12;
        const numberOfPayments = loanTermYears * 12;

        let monthlyPayment = 0;
        let totalInterest = 0;
        let totalCost = 0;

        if (monthlyInterestRate === 0) {
            // Simple case for 0% interest
            monthlyPayment = loanAmount / numberOfPayments;
            totalInterest = 0;
            totalCost = loanAmount;
        } else {
            // Standard mortgage payment formula
            monthlyPayment = loanAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
            totalCost = monthlyPayment * numberOfPayments;
            totalInterest = totalCost - loanAmount;
        }

        monthlyPaymentSpan.textContent = `$${monthlyPayment.toFixed(2)}`;
        totalInterestSpan.textContent = `$${totalInterest.toFixed(2)}`;
        totalCostSpan.textContent = `$${totalCost.toFixed(2)}`;
    }

    // Initial calculation when the page loads with default values
    calculateMortgage();
});
