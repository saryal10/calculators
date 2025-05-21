document.addEventListener('DOMContentLoaded', function() {
    // Define hypothetical progressive tax brackets
    // Each object represents an upper limit of a bracket and its marginal rate.
    // This example is purely illustrative and does NOT represent real tax law.
    const hypotheticalTaxBrackets = [
        { upperLimit: 15000, rate: 0.00 }, // 0% on income up to $15,000
        { upperLimit: 50000, rate: 0.10 }, // 10% on income between $15,001 and $50,000
        { upperLimit: 100000, rate: 0.20 },// 20% on income between $50,001 and $100,000
        { upperLimit: Infinity, rate: 0.25 } // 25% on income above $100,000
    ];

    // Input elements
    const grossIncomeInput = document.getElementById('grossIncome');
    const totalDeductionsInput = document.getElementById('totalDeductions');
    const calculateBtn = document.getElementById('calculateBtn');

    // Output elements
    const taxableIncomeSpan = document.getElementById('taxableIncome');
    const estimatedTaxSpan = document.getElementById('estimatedTax');
    const afterTaxIncomeSpan = document.getElementById('afterTaxIncome');

    calculateBtn.addEventListener('click', calculateTax);

    function calculateTax() {
        const grossIncome = parseFloat(grossIncomeInput.value);
        const totalDeductions = parseFloat(totalDeductionsInput.value);

        // --- Input Validation ---
        if (isNaN(grossIncome) || grossIncome < 0) {
            alert('Please enter a valid gross annual income.');
            return;
        }
        if (isNaN(totalDeductions) || totalDeductions < 0) {
            alert('Please enter a valid total deductions amount.');
            return;
        }

        // Calculate taxable income
        let taxableIncome = Math.max(0, grossIncome - totalDeductions); // Taxable income cannot be negative

        let estimatedTax = 0;
        let previousBracketUpper = 0;

        // Calculate tax based on progressive brackets
        for (const bracket of hypotheticalTaxBrackets) {
            if (taxableIncome > previousBracketUpper) {
                // Amount of income falling within the current bracket
                const incomeInThisBracket = Math.min(taxableIncome, bracket.upperLimit) - previousBracketUpper;
                estimatedTax += incomeInThisBracket * bracket.rate;
            } else {
                // No more taxable income left for higher brackets
                break;
            }
            previousBracketUpper = bracket.upperLimit;
        }

        const afterTaxIncome = grossIncome - estimatedTax;

        // --- Display Results ---
        taxableIncomeSpan.textContent = `$${taxableIncome.toFixed(2)}`;
        estimatedTaxSpan.textContent = `$${estimatedTax.toFixed(2)}`;
        afterTaxIncomeSpan.textContent = `$${afterTaxIncome.toFixed(2)}`;
    }

    // Initial calculation on page load
    calculateTax();
});
