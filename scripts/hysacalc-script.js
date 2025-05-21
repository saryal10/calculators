document.addEventListener('DOMContentLoaded', function() {
    const initialDepositInput = document.getElementById('initialDeposit');
    const monthlyDepositInput = document.getElementById('monthlyDeposit');
    const annualInterestRateInput = document.getElementById('annualInterestRate');
    const compoundingFrequencySelect = document.getElementById('compoundingFrequency');
    const calculationPeriodInput = document.getElementById('calculationPeriod');
    const calculateBtn = document.getElementById('calculateBtn');

    const totalPrincipalSpan = document.getElementById('totalPrincipal');
    const totalInterestSpan = document.getElementById('totalInterest');
    const endingBalanceSpan = document.getElementById('endingBalance');

    calculateBtn.addEventListener('click', calculateHYSA);

    function calculateHYSA() {
        let initialDeposit = parseFloat(initialDepositInput.value);
        let monthlyDeposit = parseFloat(monthlyDepositInput.value);
        let annualInterestRate = parseFloat(annualInterestRateInput.value);
        const compoundingFrequency = compoundingFrequencySelect.value;
        let calculationPeriodYears = parseFloat(calculationPeriodInput.value);

        // Validate inputs
        if (isNaN(initialDeposit) || initialDeposit < 0) {
            alert('Please enter a valid initial deposit.');
            return;
        }
        if (isNaN(monthlyDeposit) || monthlyDeposit < 0) {
            alert('Please enter a valid monthly deposit.');
            return;
        }
        if (isNaN(annualInterestRate) || annualInterestRate < 0) {
            alert('Please enter a valid annual interest rate.');
            return;
        }
        if (isNaN(calculationPeriodYears) || calculationPeriodYears <= 0) {
            alert('Please enter a valid calculation period in years.');
            return;
        }

        const rate = annualInterestRate / 100;
        const totalMonths = calculationPeriodYears * 12;

        let totalPrincipal = initialDeposit + (monthlyDeposit * totalMonths);
        let endingBalance = initialDeposit;
        let totalInterest = 0;

        let compoundingPeriodsPerYear;
        switch (compoundingFrequency) {
            case 'monthly':
                compoundingPeriodsPerYear = 12;
                break;
            case 'quarterly':
                compoundingPeriodsPerYear = 4;
                break;
            case 'annually':
                compoundingPeriodsPerYear = 1;
                break;
            default:
                compoundingPeriodsPerYear = 12; // Default to monthly
        }

        const effectiveMonthlyRate = rate / compoundingPeriodsPerYear;
        const paymentsPerCompoundingPeriod = 12 / compoundingPeriodsPerYear; // How many monthly deposits per compounding period

        for (let i = 1; i <= totalMonths; i++) {
            endingBalance += monthlyDeposit; // Add monthly deposit

            // Apply interest at each compounding period
            if (i % paymentsPerCompoundingPeriod === 0) { // Check if it's a compounding period
                endingBalance *= (1 + effectiveMonthlyRate);
            }
        }
        totalInterest = endingBalance - totalPrincipal;


        totalPrincipalSpan.textContent = `$${totalPrincipal.toFixed(2)}`;
        totalInterestSpan.textContent = `$${totalInterest.toFixed(2)}`;
        endingBalanceSpan.textContent = `$${endingBalance.toFixed(2)}`;
    }

    // Initial calculation when the page loads with default values
    calculateHYSA();
});
