document.addEventListener('DOMContentLoaded', function() {
    const assetInputsContainer = document.getElementById('assetInputs');
    const liabilityInputsContainer = document.getElementById('liabilityInputs');
    const addAssetBtn = document.getElementById('addAssetBtn');
    const addLiabilityBtn = document.getElementById('addLiabilityBtn');

    const totalAssetsSpan = document.getElementById('totalAssets');
    const totalLiabilitiesSpan = document.getElementById('totalLiabilities');
    const netWorthSpan = document.getElementById('netWorth');

    // Function to create a new input row (reusable for assets and liabilities)
    function createInputRow(type, labelText = '', value = '', removable = true) {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add(`${type}-item`);

        const label = document.createElement('label');
        label.textContent = labelText;

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = labelText; // Pre-fill with labelText
        nameInput.placeholder = `e.g., ${labelText}`;

        const valueInput = document.createElement('input');
        valueInput.type = 'number';
        valueInput.classList.add(`${type}-value`);
        valueInput.value = value;
        valueInput.placeholder = 'Amount ($)';
        valueInput.step = '0.01'; // Allow cents

        const removeBtn = document.createElement('button');
        removeBtn.classList.add('remove-btn');
        removeBtn.textContent = 'Remove';
        removeBtn.style.visibility = removable ? 'visible' : 'hidden'; // Hide remove for initial items
        if (removable) {
            removeBtn.addEventListener('click', function() {
                itemDiv.remove();
                calculateNetWorth(); // Recalculate after removing
            });
        }

        itemDiv.appendChild(label);
        itemDiv.appendChild(nameInput);
        itemDiv.appendChild(valueInput);
        itemDiv.appendChild(removeBtn);

        return itemDiv;
    }

    // Add Asset/Liability Row Functions
    addAssetBtn.addEventListener('click', function() {
        assetInputsContainer.appendChild(createInputRow('asset', 'New Asset', '', true));
        calculateNetWorth();
    });

    addLiabilityBtn.addEventListener('click', function() {
        liabilityInputsContainer.appendChild(createInputRow('liability', 'New Liability', '', true));
        calculateNetWorth();
    });

    // Function to calculate net worth
    function calculateNetWorth() {
        let totalAssets = 0;
        document.querySelectorAll('.asset-value').forEach(input => {
            const value = parseFloat(input.value);
            if (!isNaN(value)) {
                totalAssets += value;
            }
        });

        let totalLiabilities = 0;
        document.querySelectorAll('.liability-value').forEach(input => {
            const value = parseFloat(input.value);
            if (!isNaN(value)) {
                totalLiabilities += value;
            }
        });

        const netWorth = totalAssets - totalLiabilities;

        // Display results
        totalAssetsSpan.textContent = `$${totalAssets.toFixed(2)}`;
        totalLiabilitiesSpan.textContent = `$${totalLiabilities.toFixed(2)}`;
        netWorthSpan.textContent = `$${netWorth.toFixed(2)}`;

        // Apply color based on net worth
        netWorthSpan.classList.remove('positive', 'negative');
        if (netWorth >= 0) {
            netWorthSpan.classList.add('positive');
        } else {
            netWorthSpan.classList.add('negative');
        }
    }

    // Add event listeners using event delegation for dynamically added inputs
    assetInputsContainer.addEventListener('input', function(event) {
        if (event.target.classList.contains('asset-value')) {
            calculateNetWorth();
        }
    });

    liabilityInputsContainer.addEventListener('input', function(event) {
        if (event.target.classList.contains('liability-value')) {
            calculateNetWorth();
        }
    });

    // Initial calculation on page load
    calculateNetWorth();
});
