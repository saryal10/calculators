document.addEventListener('DOMContentLoaded', function() {
    const loanAmountInput = document.getElementById('loanAmount');
    const downPaymentInput = document.getElementById('downPayment');
    const interestRateInput = document.getElementById('interestRate');
    const loanTermInput = document.getElementById('loanTerm');
    const propertyTaxInput = document.getElementById('propertyTax');
    const hoaInput = document.getElementById('hoa');
    const calculateBtn = document.getElementById('calculateBtn');
    const monthlyPaymentSpan = document.getElementById('monthlyPayment');
    const monthlyPropertyTaxSpan = document.getElementById('monthlyPropertyTax');
    const monthlyHoaSpan = document.getElementById('monthlyHoa');
    const monthlyPmiSpan = document.getElementById('monthlyPmi');
    const totalMonthlyPaymentSpan = document.getElementById('totalMonthlyPayment');
    const totalInterestSpan = document.getElementById('totalInterest');
    const totalCostSpan = document.getElementById('totalCost');

    calculateBtn.addEventListener('click', calculateMortgage);

    function calculateMortgage() {
        const loanAmount = parseFloat(loanAmountInput.value);
        const downPayment = parseFloat(downPaymentInput.value);
        const annualInterestRate = parseFloat(interestRateInput.value);
        const loanTermYears = parseFloat(loanTermInput.value);
        const annualPropertyTax = parseFloat(propertyTaxInput.value);
        const monthlyHoa = parseFloat(hoaInput.value);

        // Validate inputs
        if (isNaN(loanAmount) || loanAmount <= 0) {
            alert('Please enter a valid loan amount.');
            return;
        }
        if (isNaN(downPayment) || downPayment < 0 || downPayment >= loanAmount) {
            alert('Please enter a valid down payment.');
            return;
        }
        const principal = loanAmount - downPayment;
        if (isNaN(annualInterestRate) || annualInterestRate < 0) {
            alert('Please enter a valid annual interest rate.');
            return;
        }
        if (isNaN(loanTermYears) || loanTermYears <= 0) {
            alert('Please enter a valid loan term.');
            return;
        }
        if (isNaN(annualPropertyTax) || annualPropertyTax < 0) {
            alert('Please enter a valid annual property tax.');
            return;
        }
        if (isNaN(monthlyHoa) || monthlyHoa < 0) {
            alert('Please enter a valid monthly HOA fee.');
            return;
        }

        const monthlyInterestRate = (annualInterestRate / 100) / 12;
        const numberOfPayments = loanTermYears * 12;
        const monthlyPropertyTax = annualPropertyTax / 12;

        let monthlyPrincipalInterest = 0;
        let totalInterest = 0;
        let totalCost = 0;
        let monthlyPmi = 0;

        if (monthlyInterestRate === 0) {
            monthlyPrincipalInterest = principal / numberOfPayments;
            totalInterest = 0;
            totalCost = principal;
        } else {
            monthlyPrincipalInterest = principal * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
            totalCost = monthlyPrincipalInterest * numberOfPayments;
            totalInterest = totalCost - principal;
        }

        // Calculate PMI if down payment is less than 20%
        if ((downPayment / loanAmount) < 0.20) {
            monthlyPmi = (Math.ceil(principal / 100000) * 100) / 12; // $100 per $100k borrowed annually, divided by 12 for monthly
        } else {
            monthlyPmi = 0;
        }

        const totalMonthlyPayment = monthlyPrincipalInterest + monthlyPropertyTax + monthlyHoa + monthlyPmi;

        monthlyPaymentSpan.textContent = `$${monthlyPrincipalInterest.toFixed(2)}`;
        monthlyPropertyTaxSpan.textContent = `$${monthlyPropertyTax.toFixed(2)}`;
        monthlyHoaSpan.textContent = `$${monthlyHoa.toFixed(2)}`;
        monthlyPmiSpan.textContent = `$${monthlyPmi.toFixed(2)}`;
        totalMonthlyPaymentSpan.textContent = `$${totalMonthlyPayment.toFixed(2)}`;
        totalInterestSpan.textContent = `$${totalInterest.toFixed(2)}`;
        totalCostSpan.textContent = `$${totalCost.toFixed(2)}`;
    }

    // Initial calculation when the page loads with default values
    calculateMortgage();
});
