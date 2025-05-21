document.addEventListener('DOMContentLoaded', function() {
    // Input elements
    const currentBalanceInput = document.getElementById('currentBalance');
    const annualInterestRateInput = document.getElementById('annualInterestRate');
    const monthlyPaymentInput = document.getElementById('monthlyPayment');
    const extraMonthlyPaymentInput = document.getElementById('extraMonthlyPayment');
    const calculateBtn = document.getElementById('calculateBtn');

    // Output elements
    const displayMinPaymentSpan = document.getElementById('displayMinPayment');
    const displayTotalPaymentSpan = document.getElementById('displayTotalPayment');
    const minPaymentTimeSpan = document.getElementById('minPaymentTime');
    const minPaymentInterestSpan = document.getElementById('minPaymentInterest');
    const minPaymentTotalSpan = document.getElementById('minPaymentTotal');
    const extraPaymentTimeSpan = document.getElementById('extraPaymentTime');
    const extraPaymentInterestSpan = document.getElementById('extraPaymentInterest');
    const extraPaymentTotalSpan = document.getElementById('extraPaymentTotal');
    const interestSavedSpan = document.getElementById('interestSaved');
    const timeSavedSpan = document.getElementById('timeSaved');

    calculateBtn.addEventListener('click', calculateCreditCardPayoff);

    function calculateCreditCardPayoff() {
        let currentBalance = parseFloat(currentBalanceInput.value);
        const annualInterestRate = parseFloat(annualInterestRateInput.value);
        const monthlyPayment = parseFloat(monthlyPaymentInput.value);
        const extraMonthlyPayment = parseFloat(extraMonthlyPaymentInput.value);

        // --- Input Validation ---
        if (isNaN(currentBalance) || currentBalance <= 0) {
            alert('Please enter a valid current credit card balance.');
            return;
        }
        if (isNaN(annualInterestRate) || annualInterestRate < 0) {
            alert('Please enter a valid annual interest rate.');
            return;
        }
        if (isNaN(monthlyPayment) || monthlyPayment <= 0) {
            alert('Please enter a valid monthly payment (must be greater than 0).');
            return;
        }
        if (isNaN(extraMonthlyPayment) || extraMonthlyPayment < 0) {
            alert('Please enter a valid extra monthly payment (can be 0).');
            return;
        }

        const monthlyInterestRate = (annualInterestRate / 100) / 12;

        // Ensure minimum payment covers at least the interest (plus a tiny bit of principal)
        if (monthlyPayment <= (currentBalance * monthlyInterestRate) && currentBalance > 0 && annualInterestRate > 0) {
            alert('Your monthly payment is too low. It must be greater than the monthly interest on the balance, or you will never pay off the debt.');
            return;
        }

        // --- Core Calculation Function ---
        function calculatePayoffDetails(balance, payment, monthlyRate) {
            let months = 0;
            let totalInterest = 0;
            let tempBalance = balance;
            let totalAmountPaid = 0;

            if (payment <= 0) {
                return { months: Infinity, totalInterest: Infinity, totalAmountPaid: Infinity };
            }

            // Cap calculation to prevent infinite loops for edge cases
            const MAX_MONTHS = 1200; // 100 years

            while (tempBalance > 0 && months < MAX_MONTHS) {
                const interestThisMonth = tempBalance * monthlyRate;
                totalInterest += interestThisMonth;

                // Amount of principal paid this month
                let principalPaid = payment - interestThisMonth;

                // Adjust principalPaid if it's more than the remaining balance
                if (principalPaid > tempBalance) {
                    principalPaid = tempBalance;
                }

                tempBalance -= principalPaid;
                totalAmountPaid += payment;
                months++;

                // If balance becomes negative (paid off in this month), adjust the last payment and total interest/amount
                if (tempBalance <= 0) {
                    // The last payment might have overpaid.
                    const finalPrincipalPayment = principalPaid; // Amount of principal paid in the last month
                    const lastActualPayment = finalPrincipalPayment + interestThisMonth; // What was actually needed this month
                    totalAmountPaid -= (payment - lastActualPayment); // Subtract the overpayment from totalAmountPaid
                    break; // Debt is paid off
                }
            }

            // If loop exited because of max_months, debt is not paid off
            if (tempBalance > 0) {
                 return { months: Infinity, totalInterest: Infinity, totalAmountPaid: Infinity };
            }

            return { months: months, totalInterest: totalInterest, totalAmountPaid: totalAmountPaid };
        }

        // --- Calculate with Minimum Payment ---
        const minPayoff = calculatePayoffDetails(currentBalance, monthlyPayment, monthlyInterestRate);
        const minPayoffYears = Math.floor(minPayoff.months / 12);
        const minPayoffMonths = minPayoff.months % 12;

        // --- Calculate with Extra Payment ---
        const totalMonthlyPaymentWithExtra = monthlyPayment + extraMonthlyPayment;
        const extraPayoff = calculatePayoffDetails(currentBalance, totalMonthlyPaymentWithExtra, monthlyInterestRate);
        const extraPayoffYears = Math.floor(extraPayoff.months / 12);
        const extraPayoffMonths = extraPayoff.months % 12;

        // --- Calculate Savings ---
        let totalInterestSaved = 0;
        let totalMonthsSaved = 0;

        if (minPayoff.months !== Infinity && extraPayoff.months !== Infinity) {
            totalInterestSaved = minPayoff.totalInterest - extraPayoff.totalInterest;
            totalMonthsSaved = minPayoff.months - extraPayoff.months;
        } else if (minPayoff.months === Infinity && extraPayoff.months !== Infinity) {
             // If minimum never pays off, but extra does, then savings are huge
             totalInterestSaved = Infinity; // Effectively all interest saved
             totalMonthsSaved = Infinity; // Effectively all time saved
        } else {
             // Both are infinite or invalid, no savings
             totalInterestSaved = 0;
             totalMonthsSaved = 0;
        }


        const savedYears = Math.floor(totalMonthsSaved / 12);
        const savedMonths = totalMonthsSaved % 12;

        // --- Display Results ---
        displayMinPaymentSpan.textContent = monthlyPayment.toFixed(2);
        displayTotalPaymentSpan.textContent = totalMonthlyPaymentWithExtra.toFixed(2);

        if (minPayoff.months === Infinity) {
            minPaymentTimeSpan.textContent = "Never (Payment too low)";
            minPaymentInterestSpan.textContent = "N/A";
            minPaymentTotalSpan.textContent = "N/A";
        } else {
            minPaymentTimeSpan.textContent = `${minPayoffYears} Years, ${minPayoffMonths} Months`;
            minPaymentInterestSpan.textContent = `$${minPayoff.totalInterest.toFixed(2)}`;
            minPaymentTotalSpan.textContent = `$${minPayoff.totalAmountPaid.toFixed(2)}`;
        }


        if (extraPayoff.months === Infinity) {
            extraPaymentTimeSpan.textContent = "Never (Payment too low)";
            extraPaymentInterestSpan.textContent = "N/A";
            extraPaymentTotalSpan.textContent = "N/A";
        } else {
            extraPaymentTimeSpan.textContent = `${extraPayoffYears} Years, ${extraPayoffMonths} Months`;
            extraPaymentInterestSpan.textContent = `$${extraPayoff.totalInterest.toFixed(2)}`;
            extraPaymentTotalSpan.textContent = `$${extraPayoff.totalAmountPaid.toFixed(2)}`;
        }


        if (totalInterestSaved === Infinity) {
            interestSavedSpan.textContent = "Significant!";
        } else {
            interestSavedSpan.textContent = `$${totalInterestSaved.toFixed(2)}`;
        }

        if (totalMonthsSaved === Infinity) {
            timeSavedSpan.textContent = "Significant!";
        } else {
            timeSavedSpan.textContent = `${savedYears} Years, ${savedMonths} Months`;
        }

    }

    // Initial calculation on page load
    calculateCreditCardPayoff();
});
