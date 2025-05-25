document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:8000'; // Your FastAPI backend URL

    // Product Form Elements
    const productForm = document.getElementById('productForm');
    const productIdField = document.getElementById('productId');
    const productNameField = document.getElementById('productName');
    const productSkuField = document.getElementById('productSku');
    const productDescriptionField = document.getElementById('productDescription');
    const productManufacturerField = document.getElementById('productManufacturer');
    const clearProductFormBtn = document.getElementById('clearProductFormBtn');
    const loadProductsBtn = document.getElementById('loadProductsBtn');
    const productListUl = document.getElementById('productList');

    // Event Form Elements
    const eventForm = document.getElementById('eventForm');
    const eventProductIdField = document.getElementById('eventProductId');
    const eventTypeField = document.getElementById('eventType');
    const eventLocationField = document.getElementById('eventLocation');
    const eventActorField = document.getElementById('eventActor');
    const eventNotesField = document.getElementById('eventNotes');

    // History Elements
    const historyForm = document.getElementById('historyForm');
    const historyProductIdField = document.getElementById('historyProductId');
    const historyOutputDiv = document.getElementById('historyOutput');

    // Blockchain Info Elements
    const loadBlockchainInfoBtn = document.getElementById('loadBlockchainInfoBtn');
    const blockchainOverallStatusDiv = document.getElementById('blockchainOverallStatus');
    const blockchainChainView = document.getElementById('blockchainChainView');
    const blockchainDetailView = document.getElementById('blockchainDetailView');

    // --- Helper to check if elements were found (for debugging) ---
    if (!productForm) console.error("Element 'productForm' not found!");
    if (!loadProductsBtn) console.error("Element 'loadProductsBtn' not found!");
    if (!eventForm) console.error("Element 'eventForm' not found!");
    if (!historyForm) console.error("Element 'historyForm' not found!");
    if (!loadBlockchainInfoBtn) console.error("Button 'loadBlockchainInfoBtn' not found!");
    if (!blockchainOverallStatusDiv) console.error("Div 'blockchainOverallStatus' not found!");
    if (!blockchainChainView) console.error("Div 'blockchainChainView' not found!");
    if (!blockchainDetailView) console.error("Div 'blockchainDetailView' not found!");


    // --- Helper Functions ---
    async function apiRequest(endpoint, method = 'GET', body = null) {
        const config = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };
        if (body) {
            config.body = JSON.stringify(body);
        }
        try {
            const response = await fetch(`${API_URL}${endpoint}`, config);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: response.statusText }));
                throw new Error(`API Error (${response.status}): ${errorData.detail || 'Unknown error'}`);
            }
            if (response.status === 204 || response.headers.get("content-length") === "0") {
                return null;
            }
            return await response.json();
        } catch (error) {
            console.error(`Error in apiRequest to ${endpoint}:`, error);
            alert(`Operation failed: ${error.message}`); // Keep user alert for operations
            throw error;
        }
    }

    function displayError(element, message) {
        if (element) {
            element.innerHTML = `<p class="error-message">${message}</p>`;
        } else {
            // console.error("Attempted to display error on a null element for message:", message);
        }
    }

    // --- Product Management ---
    if (productForm) {
        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = productIdField.value;
            const productData = {
                name: productNameField.value,
                sku: productSkuField.value,
                description: productDescriptionField.value,
                manufacturer: productManufacturerField.value,
            };

            try {
                if (id) {
                    await apiRequest(`/products/${id}`, 'PUT', productData);
                    alert('Product updated successfully!');
                } else {
                    const newProduct = await apiRequest('/products/', 'POST', productData);
                    alert(`Product created successfully! ID: ${newProduct.id}`);
                }
                productForm.reset();
                productIdField.value = '';
                loadProducts();
            } catch (error) { /* Alerted by apiRequest */ }
        });
    }

    if (clearProductFormBtn) {
        clearProductFormBtn.addEventListener('click', () => {
            if (productForm) productForm.reset();
            if (productIdField) productIdField.value = '';
        });
    }

    async function loadProducts() {
        if (!productListUl) return;
        try {
            const products = await apiRequest('/products/');
            productListUl.innerHTML = '';
            if (products && products.length > 0) {
                products.forEach(product => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <span>ID: ${product.id} | SKU: ${product.sku} | Name: ${product.name} (${product.manufacturer || 'N/A'})</span>
                        <div class="actions">
                            <button class="edit-btn" data-id="${product.id}">Edit</button>
                            <button class="delete-btn" data-id="${product.id}" data-sku="${product.sku}">Delete</button>
                        </div>
                    `;
                    productListUl.appendChild(li);
                });
                addEventListenersToProductButtons();
            } else {
                productListUl.innerHTML = '<li>No products found.</li>';
            }
        } catch (error) {
            productListUl.innerHTML = '<li>Error loading products.</li>';
        }
    }

    if (loadProductsBtn) {
        loadProductsBtn.addEventListener('click', loadProducts);
    }

    function addEventListenersToProductButtons() {
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                try {
                    const product = await apiRequest(`/products/${id}`);
                    if (productIdField) productIdField.value = product.id;
                    if (productNameField) productNameField.value = product.name;
                    if (productSkuField) productSkuField.value = product.sku;
                    if (productDescriptionField) productDescriptionField.value = product.description || '';
                    if (productManufacturerField) productManufacturerField.value = product.manufacturer || '';
                    if (productNameField) productNameField.focus();
                } catch (error) { /* Handled by apiRequest */ }
            });
        });

        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                const sku = e.target.dataset.sku;
                if (confirm(`Are you sure you want to delete product SKU ${sku} (ID: ${id})? This action is for off-chain data only.`)) {
                    try {
                        await apiRequest(`/products/${id}`, 'DELETE');
                        alert('Product deleted successfully!');
                        loadProducts();
                    } catch (error) { /* Handled by apiRequest */ }
                }
            });
        });
    }

    // --- Event Recording ---
    if (eventForm) {
        eventForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const eventData = {
                product_id: parseInt(eventProductIdField.value),
                event_type: eventTypeField.value,
                location: eventLocationField.value || null,
                actor: eventActorField.value || null,
                notes: eventNotesField.value || null
            };

            if (isNaN(eventData.product_id)) {
                alert("Please enter a valid Product ID.");
                return;
            }

            const recordButton = eventForm.querySelector('button[type="submit"]');
            const originalButtonText = recordButton.textContent;
            recordButton.textContent = 'Recording... (Mining Block)';
            recordButton.disabled = true;

            try {
                const result = await apiRequest('/events/record', 'POST', eventData);
                alert(`Event recorded! Block Index: ${result.block_index}, Hash: ${result.block_hash}`);
                eventForm.reset();
                if (historyProductIdField && historyOutputDiv && historyProductIdField.value === String(eventData.product_id)) { // String conversion for comparison
                    historyOutputDiv.innerHTML = '<p>Event recorded. Click "View History" again to refresh.</p>';
                }
            } catch (error) { /* Alerted by apiRequest */ }
            finally {
                recordButton.textContent = originalButtonText;
                recordButton.disabled = false;
            }
        });
    }

    // --- Product History ---
    if (historyForm) {
        historyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!historyOutputDiv) return;

            const productId = historyProductIdField.value;
            if (!productId) {
                alert("Please enter a Product ID.");
                return;
            }
            historyOutputDiv.innerHTML = '<p>Loading history...</p>';
            try {
                const history = await apiRequest(`/events/history/${productId}`);
                if (history && history.length > 0) {
                    let html = '<ul>';
                    history.forEach(block => {
                        html += `<li>
                            <strong>Block #${block.index} (Hash: ${block.hash.substring(0, 10)}...${block.hash.substring(block.hash.length - 10)})</strong><br>
                            Timestamp: ${new Date(block.timestamp * 1000).toLocaleString()}<br>
                            Data: <pre>${JSON.stringify(block.data, null, 2)}</pre>
                            Prev. Hash: ${block.previous_hash === "0" ? "0 (Genesis)" : block.previous_hash.substring(0, 10)}...<br>
                            Nonce: ${block.nonce}
                        </li>`;
                    });
                    html += '</ul>';
                    historyOutputDiv.innerHTML = html;
                } else {
                    historyOutputDiv.innerHTML = `<p>No blockchain events found for Product ID ${productId}.</p>`;
                }
            } catch (error) {
                displayError(historyOutputDiv, `Error loading history for Product ID ${productId}: ${error.message}`);
            }
        });
    }

    // --- Blockchain Info ---
    if (loadBlockchainInfoBtn) {
        loadBlockchainInfoBtn.addEventListener('click', async () => {
            if (blockchainOverallStatusDiv) blockchainOverallStatusDiv.innerHTML = '<p>Loading overall status...</p>';
            if (blockchainChainView) blockchainChainView.innerHTML = '<p>Loading blockchain chain...</p>';
            if (blockchainDetailView) blockchainDetailView.innerHTML = '<p>Click on a block in the chain to see its details.</p>';

            try {
                const info = await apiRequest('/events/blockchain/info');

                if (blockchainOverallStatusDiv) {
                    blockchainOverallStatusDiv.innerHTML = `
                        <ul>
                            <li><strong>Chain Valid:</strong> ${info.is_valid ? '<span style="color:green;">Yes</span>' : '<span style="color:red;">No</span>'}</li>
                            <li><strong>Chain Length:</strong> ${info.chain_length}</li>
                            <li><strong>Mining Difficulty:</strong> ${info.difficulty}</li>
                        </ul>
                    `;
                }

                if (blockchainChainView) {
                    blockchainChainView.innerHTML = '';
                    if (info.chain && info.chain.length > 0) {
                        info.chain.forEach(block => {
                            const blockElement = document.createElement('div');
                            blockElement.classList.add('block-visual');
                            blockElement.setAttribute('role', 'button');
                            blockElement.setAttribute('tabindex', '0');

                            blockElement.innerHTML = `
                                <div class="block-index">Block #${block.index}</div>
                                <div class="block-hash-preview" title="Hash: ${block.hash}">${block.hash.substring(0, 8)}...${block.hash.substring(block.hash.length - 4)}</div>
                            `;
                            blockElement.dataset.blockData = JSON.stringify(block);

                            const handleBlockClick = () => {
                                document.querySelectorAll('.block-visual.selected').forEach(selectedEl => selectedEl.classList.remove('selected'));
                                blockElement.classList.add('selected');
                                const clickedBlockData = JSON.parse(blockElement.dataset.blockData);
                                displayBlockDetails(clickedBlockData);
                            };

                            blockElement.addEventListener('click', handleBlockClick);
                            blockElement.addEventListener('keydown', (e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault(); // Prevent space from scrolling page
                                    handleBlockClick();
                                }
                            });
                            blockchainChainView.appendChild(blockElement);
                        });
                    } else {
                        blockchainChainView.innerHTML = '<p>Blockchain is empty or could not be loaded.</p>';
                    }
                }

            } catch (error) {
                if (blockchainOverallStatusDiv) displayError(blockchainOverallStatusDiv, '');
                if (blockchainChainView) displayError(blockchainChainView, `Error loading blockchain info: ${error.message}`);
                if (blockchainDetailView) blockchainDetailView.innerHTML = '<p>Could not load blockchain details due to an error.</p>';
            }
        });
    }

    function displayBlockDetails(blockData) {
        if (!blockchainDetailView) {
            console.error("Cannot display block details: 'blockchainDetailView' is null.");
            return;
        }
        blockchainDetailView.innerHTML = '';
        const dl = document.createElement('dl');

        function addDetail(term, definition, isJsonData = false) {
            const dt = document.createElement('dt');
            dt.textContent = term;
            const dd = document.createElement('dd');
            if (isJsonData) {
                const pre = document.createElement('pre');
                pre.textContent = JSON.stringify(definition, null, 2);
                dd.appendChild(pre);
            } else {
                dd.textContent = definition;
            }
            dl.appendChild(dt);
            dl.appendChild(dd);
        }

        addDetail('Index:', blockData.index);
        addDetail('Timestamp:', `${new Date(blockData.timestamp * 1000).toLocaleString()} (Raw: ${blockData.timestamp})`);
        addDetail('Data (Event Details):', blockData.data, true);
        addDetail('Hash:', blockData.hash);
        addDetail('Previous Hash:', blockData.previous_hash === "0" ? "0 (Genesis Block)" : blockData.previous_hash);
        addDetail('Nonce:', blockData.nonce);

        blockchainDetailView.appendChild(dl);
        blockchainDetailView.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); // 'nearest' or 'start'
    }

    // Initial product load
    if (typeof loadProducts === "function") { // Check if loadProducts is defined
        loadProducts();
    }
});