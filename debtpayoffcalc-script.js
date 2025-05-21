document.addEventListener('DOMContentLoaded', function() {
    // Input elements
    const currentBalanceInput = document.getElementById('currentBalance');
    const annualInterestRateInput = document.getElementById('annualInterestRate');
    const minimumMonthlyPaymentInput = document.getElementById('minimumMonthlyPayment');
    const extraMonthlyPaymentInput = document.getElementById('extraMonthlyPayment');
    const calculateBtn = document.getElementById('calculateBtn');

    // Output elements
    const displayExtraPaymentSpan = document.getElementById('displayExtraPayment');
    const minPaymentTimeSpan = document.getElementById('minPaymentTime');
    const minPaymentInterestSpan = document.getElementById('minPaymentInterest');
    const extraPaymentTimeSpan = document.getElementById('extraPaymentTime');
    const extraPaymentInterestSpan = document.getElementById('extraPaymentInterest');
    const interestSavedSpan = document.getElementById('interestSaved');
    const timeSavedSpan = document.getElementById('timeSaved');

    calculateBtn.addEventListener('click', calculateDebtPayoff);

    function calculateDebtPayoff() {
        let currentBalance = parseFloat(currentBalanceInput.value);
        const annualInterestRate = parseFloat(annualInterestRateInput.value);
        const minimumMonthlyPayment = parseFloat(minimumMonthlyPaymentInput.value);
        const extraMonthlyPayment = parseFloat(extraMonthlyPaymentInput.value);

        // --- Input Validation ---
        if (isNaN(currentBalance) || currentBalance <= 0) {
            alert('Please enter a valid current debt balance.');
            return;
        }
        if (isNaN(annualInterestRate) || annualInterestRate < 0) {
            alert('Please enter a valid annual interest rate.');
            return;
        }
        if (isNaN(minimumMonthlyPayment) || minimumMonthlyPayment <= 0) {
            alert('Please enter a valid minimum monthly payment.');
            return;
        }
        if (isNaN(extraMonthlyPayment) || extraMonthlyPayment < 0) {
            alert('Please enter a valid extra monthly payment (can be 0).');
            return;
        }

        const monthlyInterestRate = (annualInterestRate / 100) / 12;

        // Ensure minimum payment is more than just interest on the balance
        if (minimumMonthlyPayment <= (currentBalance * monthlyInterestRate) && currentBalance > 0) {
            alert('Your minimum payment is too low. It must be greater than the monthly interest on the balance, or you will never pay off the debt.');
            return;
        }

        // --- Calculation Function ---
        function calculatePayoff(balance, monthlyPayment, monthlyRate) {
            let months = 0;
            let totalInterest = 0;
            let tempBalance = balance;

            if (monthlyPayment <= 0) { // Avoid infinite loops if payment is zero
                return { months: Infinity, totalInterest: Infinity };
            }

            while (tempBalance > 0) {
                const interestThisMonth = tempBalance * monthlyRate;
                totalInterest += interestThisMonth;

                let principalPaid = monthlyPayment - interestThisMonth;

                // If the principal paid is negative, it means payment doesn't cover interest.
                // This scenario should be caught by the earlier validation, but as a safeguard:
                if (principalPaid <= 0 && tempBalance > 0) {
                     return { months: Infinity, totalInterest: Infinity }; // Debt will never be paid off
                }

                tempBalance -= principalPaid;
                months++;

                // If balance becomes negative (paid off), adjust last payment and interest
                if (tempBalance <= 0) {
                    // The "overpayment" in the last month that reduced balance below zero
                    const finalMonthOverpayment = -tempBalance;
                    // Adjust total interest by removing interest that would have accrued on the overpaid amount
                    totalInterest -= finalMonthOverpayment * monthlyRate;
                }

                // Prevent extremely long loops for very small payments or high interest
                if (months > 1200) { // Cap at 100 years to prevent browser freeze
                    return { months: Infinity, totalInterest: Infinity };
                }
            }
            return { months: months, totalInterest: totalInterest };
        }

        // --- Calculate with Minimum Payment ---
        const minPayoff = calculatePayoff(currentBalance, minimumMonthlyPayment, monthlyInterestRate);
        const minPayoffYears = Math.floor(minPayoff.months / 12);
        const minPayoffMonths = minPayoff.months % 12;

        // --- Calculate with Extra Payment ---
        const totalMonthlyPayment = minimumMonthlyPayment + extraMonthlyPayment;
        const extraPayoff = calculatePayoff(currentBalance, totalMonthlyPayment, monthlyInterestRate);
        const extraPayoffYears = Math.floor(extraPayoff.months / 12);
        const extraPayoffMonths = extraPayoff.months % 12;

        // --- Calculate Savings ---
        const totalInterestSaved = minPayoff.totalInterest - extraPayoff.totalInterest;
        const totalMonthsSaved = minPayoff.months - extraPayoff.months;
        const savedYears = Math.floor(totalMonthsSaved / 12);
        const savedMonths = totalMonthsSaved % 12;

        // --- Display Results ---
        displayExtraPaymentSpan.textContent = (minimumMonthlyPayment + extraMonthlyPayment).toFixed(2);
        minPaymentTimeSpan.textContent = `${minPayoffYears} Years, ${minPayoffMonths} Months`;
        minPaymentInterestSpan.textContent = `$${minPayoff.totalInterest.toFixed(2)}`;
        extraPaymentTimeSpan.textContent = `${extraPayoffYears} Years, ${extraPayoffMonths} Months`;
        extraPaymentInterestSpan.textContent = `$${extraPayoff.totalInterest.toFixed(2)}`;
        interestSavedSpan.textContent = `$${totalInterestSaved.toFixed(2)}`;
        timeSavedSpan.textContent = `${savedYears} Years, ${savedMonths} Months`;

        // Handle infinite cases (debt never paid off)
        if (minPayoff.months === Infinity) {
            minPaymentTimeSpan.textContent = "Never (Payment too low)";
            minPaymentInterestSpan.textContent = "N/A";
        }
        if (extraPayoff.months === Infinity) {
            extraPaymentTimeSpan.textContent = "Never (Payment too low)";
            extraPaymentInterestSpan.textContent = "N/A";
        }
    }

    // Initial calculation on page load
    calculateDebtPayoff();
});
