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
        let totalBuyingExpenses = 0; // This will accumulate out-of-pocket expenses
        let totalPrincipalPaid = 0; // To track equity built through mortgage payments
        let currentLoanBalance = homePurchasePrice - downPaymentAmount;

        // Initial Costs
        totalBuyingExpenses += downPaymentAmount; // Down payment is an upfront cost
        totalBuyingExpenses += closingCosts;

        // Mortgage Principal & Interest (P&I)
        const principal = homePurchasePrice - downPaymentAmount;
        const monthlyInterestRate = annualInterestRate / 12;
        const numberOfPaymentsTotal = loanTermYears * 12;
        let monthlyPayment = 0;

        if (monthlyInterestRate === 0) {
            monthlyPayment = principal / numberOfPaymentsTotal; // Avoid division by zero for 0% interest
        } else {
            monthlyPayment = principal * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPaymentsTotal)) / (Math.pow(1 + monthlyInterestRate, numberOfPaymentsTotal) - 1);
        }

        // PMI Calculation (if down payment is less than 20%)
        let monthlyPmi = 0;
        if ((downPaymentAmount / homePurchasePrice) < 0.20) {
            monthlyPmi = (Math.ceil(principal / 100000) * 100) / 12; // $100 per $100k borrowed annually, divided by 12
        }

        // Accumulate monthly costs over the comparison period
        for (let month = 1; month <= comparisonPeriodYears * 12; month++) {
            // Calculate interest and principal portion for the current month
            const interestPayment = currentLoanBalance * monthlyInterestRate;
            let principalPayment = monthlyPayment - interestPayment;

            // Ensure principal payment doesn't exceed remaining balance
            if (principalPayment > currentLoanBalance) {
                principalPayment = currentLoanBalance;
            }

            // Add costs
            totalBuyingExpenses += monthlyPayment; // P&I
            totalBuyingExpenses += annualPropertyTax / 12;
            totalBuyingExpenses += annualHomeInsurance / 12;
            totalBuyingExpenses += monthlyHoa;
            totalBuyingExpenses += annualMaintenance / 12;
            totalBuyingExpenses += monthlyPmi;

            // Update loan balance and total principal paid
            currentLoanBalance -= principalPayment;
            totalPrincipalPaid += principalPayment;

            // Stop if loan is paid off within comparison period
            if (currentLoanBalance <= 0) {
                currentLoanBalance = 0; // Ensure it doesn't go negative
                monthlyPayment = 0; // No more mortgage payments
                monthlyPmi = 0; // No more PMI
            }

             // Stop if loan term ends
             if (month >= numberOfPaymentsTotal) {
                monthlyPayment = 0;
                monthlyPmi = 0;
             }
        }

        // Calculate estimated home value at the end of the period
        const estimatedHomeValueAtEnd = homePurchasePrice * Math.pow(1 + annualAppreciationRate, comparisonPeriodYears);
        const totalAppreciation = estimatedHomeValueAtEnd - homePurchasePrice;

        // Calculate the *net* cost of buying
        // Total expenses incurred MINUS the value gained from equity and appreciation
        // (This assumes you recover the equity and appreciation if you sell at the end of the period)
        let netBuyingCost = totalBuyingExpenses - totalPrincipalPaid - totalAppreciation;

        // Note: This simplified calculation doesn't include potential selling costs (realtor fees, etc.)
        // which would increase the netBuyingCost if included.

        // --- Display Results ---
        displayComparisonPeriodSpan.textContent = comparisonPeriodYears;
        totalRentingCostSpan.textContent = `$${totalRentingCost.toFixed(2)}`;
        totalBuyingCostSpan.textContent = `$${netBuyingCost.toFixed(2)}`; // Use netBuyingCost here

        // --- Recommendation ---
        recommendationParagraph.classList.remove('highlight', 'warning'); // Reset classes

        if (totalRentingCost < netBuyingCost) { // Compare with netBuyingCost
            recommendationParagraph.textContent = `Over ${comparisonPeriodYears} years, Renting is likely more cost-effective.`;
            recommendationParagraph.classList.add('highlight'); // Green for better
        } else if (netBuyingCost < totalRentingCost) { // Compare with netBuyingCost
            recommendationParagraph.textContent = `Over ${comparisonPeriodYears} years, Buying is likely more cost-effective.`;
            recommendationParagraph.classList.add('highlight'); // Green for better
        } else {
            recommendationParagraph.textContent = `Over ${comparisonPeriodYears} years, Renting and Buying cost about the same.`;
        }
    }

    // Initial calculation when the page loads with default values
    calculateRentVsBuy();
});
