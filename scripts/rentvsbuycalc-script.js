document.addEventListener('DOMContentLoaded', function() {
    // Input elements
    const comparisonPeriodInput = document.getElementById('comparisonPeriod');
    const currentMonthlyRentInput = document.getElementById('currentMonthlyRent');
    const annualRentIncreaseInput = document.getElementById('annualRentIncrease');
    const homePurchasePriceInput = document.getElementById('homePurchasePrice');
    const downPaymentAmountInput = document.getElementById('downPaymentAmount');
    const annualInterestRateInput = document.getElementById('annualInterestRate');
    const loanTermYearsInput = document.getElementById('loanTermYears');
    const closingCostsInput = document.getElementById('closingCosts');
    const annualPropertyTaxInput = document.getElementById('annualPropertyTax');
    const annualHomeInsuranceInput = document.getElementById('annualHomeInsurance');
    const monthlyHoaInput = document.getElementById('monthlyHoa');
    const annualMaintenanceInput = document.getElementById('annualMaintenance');
    const annualAppreciationRateInput = document.getElementById('annualAppreciationRate');
    const calculateBtn = document.getElementById('calculateBtn');

    // Output elements
    const displayComparisonPeriodSpan = document.getElementById('displayComparisonPeriod');
    const totalRentingCostSpan = document.getElementById('totalRentingCost');
    const totalBuyingCostSpan = document.getElementById('totalBuyingCost');
    const recommendationParagraph = document.getElementById('recommendation');

    calculateBtn.addEventListener('click', calculateRentVsBuy);

    function calculateRentVsBuy() {
        // Get values and parse them
        const comparisonPeriodYears = parseFloat(comparisonPeriodInput.value);
        let currentMonthlyRent = parseFloat(currentMonthlyRentInput.value);
        const annualRentIncrease = parseFloat(annualRentIncreaseInput.value) / 100;

        const homePurchasePrice = parseFloat(homePurchasePriceInput.value);
        const downPaymentAmount = parseFloat(downPaymentAmountInput.value);
        const annualInterestRate = parseFloat(annualInterestRateInput.value) / 100;
        const loanTermYears = parseFloat(loanTermYearsInput.value);
        const closingCosts = parseFloat(closingCostsInput.value);
        const annualPropertyTax = parseFloat(annualPropertyTaxInput.value);
        const annualHomeInsurance = parseFloat(annualHomeInsuranceInput.value);
        const monthlyHoa = parseFloat(monthlyHoaInput.value);
        const annualMaintenance = parseFloat(annualMaintenanceInput.value);
        const annualAppreciationRate = parseFloat(annualAppreciationRateInput.value) / 100;

        // --- Input Validation ---
        if (isNaN(comparisonPeriodYears) || comparisonPeriodYears <= 0) {
            alert('Please enter a valid comparison period in years.');
            return;
        }
        if (isNaN(currentMonthlyRent) || currentMonthlyRent < 0) {
            alert('Please enter a valid current monthly rent.');
            return;
        }
        if (isNaN(annualRentIncrease) || annualRentIncrease < 0) {
            alert('Please enter a valid annual rent increase rate.');
            return;
        }
        if (isNaN(homePurchasePrice) || homePurchasePrice <= 0) {
            alert('Please enter a valid home purchase price.');
            return;
        }
        if (isNaN(downPaymentAmount) || downPaymentAmount < 0 || downPaymentAmount >= homePurchasePrice) {
            alert('Please enter a valid down payment amount (must be less than purchase price).');
            return;
        }
        if (isNaN(annualInterestRate) || annualInterestRate < 0) {
            alert('Please enter a valid annual mortgage interest rate.');
            return;
        }
        if (isNaN(loanTermYears) || loanTermYears <= 0) {
            alert('Please enter a valid mortgage term in years.');
            return;
        }
        if (isNaN(closingCosts) || closingCosts < 0) {
            alert('Please enter valid closing costs.');
            return;
        }
        if (isNaN(annualPropertyTax) || annualPropertyTax < 0) {
            alert('Please enter a valid annual property tax.');
            return;
        }
        if (isNaN(annualHomeInsurance) || annualHomeInsurance < 0) {
            alert('Please enter valid annual home insurance.');
            return;
        }
        if (isNaN(monthlyHoa) || monthlyHoa < 0) {
            alert('Please enter valid monthly HOA fees.');
            return;
        }
        if (isNaN(annualMaintenance) || annualMaintenance < 0) {
            alert('Please enter valid annual maintenance costs.');
            return;
        }
        if (isNaN(annualAppreciationRate) || annualAppreciationRate < 0) {
            alert('Please enter a valid annual home appreciation rate.');
            return;
        }

        // --- Calculate Renting Costs ---
        let totalRentingCost = 0;
        let monthlyRent = currentMonthlyRent;
        for (let year = 1; year <= comparisonPeriodYears; year++) {
            totalRentingCost += monthlyRent * 12; // Add 12 months of rent for the current year
            monthlyRent *= (1 + annualRentIncrease); // Increase rent for the next year
        }

        // --- Calculate Buying Costs ---
        let totalBuyingCost = 0;

        // Initial Costs
        totalBuyingCost += downPaymentAmount;
        totalBuyingCost += closingCosts;

        // Mortgage Principal & Interest (P&I)
        const principal = homePurchasePrice - downPaymentAmount;
        const monthlyInterestRate = annualInterestRate / 12;
        const numberOfPayments = loanTermYears * 12;
        let monthlyPrincipalInterest = 0;

        if (monthlyInterestRate === 0) {
            monthlyPrincipalInterest = principal / numberOfPayments;
        } else {
            monthlyPrincipalInterest = principal * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
        }

        // PMI Calculation (if down payment is less than 20%)
        let monthlyPmi = 0;
        if ((downPaymentAmount / homePurchasePrice) < 0.20) {
            // Using the same rule as your mortgage calculator: $100 per $100k borrowed annually, divided by 12 for monthly
            monthlyPmi = (Math.ceil(principal / 100000) * 100) / 12;
        }

        // Accumulate monthly costs over the comparison period
        for (let month = 1; month <= comparisonPeriodYears * 12; month++) {
            totalBuyingCost += monthlyPrincipalInterest;
            totalBuyingCost += annualPropertyTax / 12;
            totalBuyingCost += annualHomeInsurance / 12;
            totalBuyingCost += monthlyHoa;
            totalBuyingCost += annualMaintenance / 12;
            totalBuyingCost += monthlyPmi;
        }

        // Account for Home Equity / Appreciation (reduces the net cost of buying)
        const estimatedHomeValueAtEnd = homePurchasePrice * Math.pow(1 + annualAppreciationRate, comparisonPeriodYears);
        totalBuyingCost -= estimatedHomeValueAtEnd; // Subtract the value of the asset at the end

        // --- Display Results ---
        displayComparisonPeriodSpan.textContent = comparisonPeriodYears;
        totalRentingCostSpan.textContent = `$${totalRentingCost.toFixed(2)}`;
        totalBuyingCostSpan.textContent = `$${totalBuyingCost.toFixed(2)}`;

        // --- Recommendation ---
        recommendationParagraph.classList.remove('highlight', 'warning'); // Reset classes

        if (totalRentingCost < totalBuyingCost) {
            recommendationParagraph.textContent = `Over ${comparisonPeriodYears} years, Renting is likely more cost-effective.`;
            recommendationParagraph.classList.add('highlight'); // Green for better
        } else if (totalBuyingCost < totalRentingCost) {
            recommendationParagraph.textContent = `Over ${comparisonPeriodYears} years, Buying is likely more cost-effective.`;
            recommendationParagraph.classList.add('highlight'); // Green for better
        } else {
            recommendationParagraph.textContent = `Over ${comparisonPeriodYears} years, Renting and Buying cost about the same.`;
        }
    }

    // Initial calculation when the page loads with default values
    calculateRentVsBuy();
});
