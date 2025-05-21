document.addEventListener('DOMContentLoaded', function() {
    // Input elements
    const loanAmountInput = document.getElementById('loanAmount');
    const annualInterestRateInput = document.getElementById('annualInterestRate');
    const loanTermYearsInput = document.getElementById('loanTermYears');
    const calculateBtn = document.getElementById('calculateBtn');

    // Output elements
    const monthlyPaymentSpan = document.getElementById('monthlyPayment');
    const amortizationScheduleDiv = document.getElementById('amortizationSchedule');

    calculateBtn.addEventListener('click', generateSchedule);

    function generateSchedule() {
        const loanAmount = parseFloat(loanAmountInput.value);
        const annualRate = parseFloat(annualInterestRateInput.value);
        const loanTermYears = parseFloat(loanTermYearsInput.value);

        // --- Input Validation ---
        if (isNaN(loanAmount) || loanAmount <= 0) {
            alert('Please enter a valid loan amount (greater than 0).');
            return;
        }
        if (isNaN(annualRate) || annualRate < 0) {
            alert('Please enter a valid annual interest rate (0 or greater).');
            return;
        }
        if (isNaN(loanTermYears) || loanTermYears <= 0) {
            alert('Please enter a valid loan term in years (greater than 0).');
            return;
        }

        const monthlyRate = annualRate / 100 / 12;
        const totalPayments = loanTermYears * 12;

        let monthlyPayment;

        // Calculate Monthly Payment (Standard Loan Payment Formula)
        if (monthlyRate === 0) {
            monthlyPayment = loanAmount / totalPayments; // Simple division if 0 interest
        } else {
            monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / (Math.pow(1 + monthlyRate, totalPayments) - 1);
        }

        // --- Display Monthly Payment ---
        monthlyPaymentSpan.textContent = `$${monthlyPayment.toFixed(2)}`;

        // --- Generate Amortization Schedule ---
        let currentBalance = loanAmount;
        let schedule = [];
        let totalInterestPaid = 0;
        let totalPrincipalPaid = 0;

        for (let i = 1; i <= totalPayments; i++) {
            const interestPayment = currentBalance * monthlyRate;
            let principalPayment = monthlyPayment - interestPayment;

            // Adjust last payment to ensure balance goes to exactly zero
            if (i === totalPayments) {
                principalPayment = currentBalance; // Pay off remaining balance
                monthlyPayment = interestPayment + principalPayment; // Adjust final payment
            }

            currentBalance -= principalPayment;

            schedule.push({
                paymentNum: i,
                startingBalance: loanAmount - totalPrincipalPaid, // Balance before this payment
                interestPaid: interestPayment,
                principalPaid: principalPayment,
                endingBalance: currentBalance < 0.01 ? 0 : currentBalance // Ensure 0 for very small remainders
            });

            totalInterestPaid += interestPayment;
            totalPrincipalPaid += principalPayment;
        }

        // Add a total row
        schedule.push({
            paymentNum: 'Total',
            startingBalance: null, // Not applicable for total row
            interestPaid: totalInterestPaid,
            principalPaid: totalPrincipalPaid,
            endingBalance: null
        });

        // --- Display Schedule Table ---
        displayAmortizationTable(schedule, monthlyPayment);
    }

    function displayAmortizationTable(schedule, monthlyPayment) {
        // Clear previous content
        amortizationScheduleDiv.innerHTML = '';
        amortizationScheduleDiv.style.display = 'block'; // Show the div

        const table = document.createElement('table');
        table.id = 'amortizationTable';

        // Table Header
        const thead = table.createTHead();
        const headerRow = thead.insertRow();
        const headers = ['Pmt #', 'Starting Balance', 'Interest Paid', 'Principal Paid', 'Ending Balance'];
        headers.forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            headerRow.appendChild(th);
        });

        // Table Body
        const tbody = table.createTBody();
        schedule.forEach(payment => {
            const row = tbody.insertRow();
            if (payment.paymentNum === 'Total') {
                row.classList.add('total-row');
            }

            const formatCurrency = (value) => value !== null ? `$${value.toFixed(2)}` : '';

            row.insertCell().textContent = payment.paymentNum;
            row.insertCell().textContent = formatCurrency(payment.startingBalance);
            row.insertCell().textContent = formatCurrency(payment.interestPaid);
            row.insertCell().textContent = formatCurrency(payment.principalPaid);
            row.insertCell().textContent = formatCurrency(payment.endingBalance);
        });

        amortizationScheduleDiv.appendChild(table);
    }

    // Initial calculation on page load
    generateSchedule();
});
