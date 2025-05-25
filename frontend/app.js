document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:8000';

    // --- DOM Elements ---
    // Auth Elements
    const authSection = document.getElementById('authSection');
    const userStatusDiv = document.getElementById('userStatus');
    const loggedInUsernameSpan = document.getElementById('loggedInUsername');
    const logoutBtn = document.getElementById('logoutBtn');
    const loginRegisterFormsDiv = document.getElementById('loginRegisterForms');
    const loginFormContainer = document.getElementById('loginFormContainer');
    const loginForm = document.getElementById('loginForm');
    const loginUsernameField = document.getElementById('loginUsername');
    const loginPasswordField = document.getElementById('loginPassword');
    const loginErrorP = document.getElementById('loginError');
    const registerFormContainer = document.getElementById('registerFormContainer');
    const registerForm = document.getElementById('registerForm');
    const registerUsernameField = document.getElementById('registerUsername');
    const registerEmailField = document.getElementById('registerEmail');
    const registerFullNameField = document.getElementById('registerFullName');
    const registerPasswordField = document.getElementById('registerPassword');
    const registerErrorP = document.getElementById('registerError');
    const showRegisterFormLink = document.getElementById('showRegisterFormLink');
    const showLoginFormLink = document.getElementById('showLoginFormLink');

    // Main Content Element
    const mainAppContentDiv = document.getElementById('mainAppContent');
    const authContentSeparator = document.getElementById('authContentSeparator');

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
    function checkElement(id, element) {
        if (!element) console.error(`Element with ID '${id}' not found!`);
    }
    checkElement('authSection', authSection);
    checkElement('userStatus', userStatusDiv);
    checkElement('loggedInUsername', loggedInUsernameSpan);
    checkElement('logoutBtn', logoutBtn);
    checkElement('loginRegisterForms', loginRegisterFormsDiv);
    checkElement('loginFormContainer', loginFormContainer);
    checkElement('loginForm', loginForm);
    checkElement('registerFormContainer', registerFormContainer);
    checkElement('registerForm', registerForm);
    checkElement('mainAppContent', mainAppContentDiv);
    checkElement('authContentSeparator', authContentSeparator);
    // ... you can add checks for all other critical elements if needed

    // --- API Request Helper ---
    async function apiRequest(endpoint, method = 'GET', body = null, requiresAuth = true) {
        const config = {
            method: method,
            headers: { 'Accept': 'application/json' }
        };

        const token = localStorage.getItem('accessToken');
        if (requiresAuth && token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        if (body) {
            // Note: FormData for login is handled separately due to Content-Type
            config.headers['Content-Type'] = 'application/json';
            config.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(`${API_URL}${endpoint}`, config);
            if (!response.ok) {
                if (response.status === 401 && requiresAuth) {
                    alert('Session expired or invalid. Please login again.');
                    logoutUser();
                }
                const errorData = await response.json().catch(() => ({ detail: response.statusText }));
                throw new Error(errorData.detail || `API Error (${response.status})`);
            }
            if (response.status === 204 || response.headers.get("content-length") === "0") return null;
            return await response.json();
        } catch (error) {
            console.error(`Error in apiRequest to ${API_URL}${endpoint}:`, error.message);
            // Avoid spamming alerts for GET requests unless it's a user detail fetch
            if (method !== 'GET' || endpoint.includes('/users/me')) {
                // alert(`Operation failed: ${error.message}`); // Consider conditional alerts
            }
            throw error; // Re-throw to be caught by caller
        }
    }

    function displayAuthError(element, message) {
        if (element) {
            element.textContent = message;
            element.style.display = message ? 'block' : 'none';
        }
    }

    function displayGenericError(element, message) { // General purpose error display
        if (element) {
            element.innerHTML = `<p class="error-message">${message}</p>`;
        }
    }

    // --- Authentication Logic ---
    function updateLoginState() {
        const token = localStorage.getItem('accessToken');
        if (token) {
            if (userStatusDiv) userStatusDiv.classList.remove('hidden');
            if (loginRegisterFormsDiv) loginRegisterFormsDiv.classList.add('hidden');
            if (mainAppContentDiv) mainAppContentDiv.classList.remove('hidden');
            if (authContentSeparator) authContentSeparator.classList.remove('hidden');
            fetchUserDetails();
            if (typeof loadProducts === "function") loadProducts();
        } else {
            if (userStatusDiv) userStatusDiv.classList.add('hidden');
            if (loginRegisterFormsDiv) loginRegisterFormsDiv.classList.remove('hidden');
            if (mainAppContentDiv) mainAppContentDiv.classList.add('hidden');
            if (authContentSeparator) authContentSeparator.classList.add('hidden');
            if (loginFormContainer) loginFormContainer.classList.remove('hidden');
            if (registerFormContainer) registerFormContainer.classList.add('hidden');
            if (productListUl) productListUl.innerHTML = '';
            if (historyOutputDiv) historyOutputDiv.innerHTML = '';
            if (blockchainOverallStatusDiv) blockchainOverallStatusDiv.innerHTML = '';
            if (blockchainChainView) blockchainChainView.innerHTML = '<p>Login to load blockchain info.</p>';
            if (blockchainDetailView) blockchainDetailView.innerHTML = '<p>Login to view block details.</p>';
        }
    }

    async function fetchUserDetails() {
        if (!loggedInUsernameSpan) return;
        try {
            const user = await apiRequest('/auth/users/me', 'GET', null, true);
            if (user) {
                loggedInUsernameSpan.textContent = user.username;
            }
        } catch (error) {
            console.error("Failed to fetch user details:", error.message);
            // Token might be invalid or expired, logout if it's an auth error
            if (error.message.includes("401") || error.message.includes("expired")) {
                logoutUser();
            }
        }
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            displayAuthError(loginErrorP, '');
            const formData = new FormData();
            formData.append('username', loginUsernameField.value);
            formData.append('password', loginPasswordField.value);

            try {
                const response = await fetch(`${API_URL}/auth/token`, {
                    method: 'POST',
                    body: new URLSearchParams(formData) // Correct for x-www-form-urlencoded
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ detail: "Login failed due to server error or invalid response." }));
                    throw new Error(errorData.detail || `Login failed (${response.status})`);
                }
                const data = await response.json();
                localStorage.setItem('accessToken', data.access_token);
                updateLoginState();
                loginForm.reset();
            } catch (error) {
                displayAuthError(loginErrorP, error.message);
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            displayAuthError(registerErrorP, '');
            const userData = {
                username: registerUsernameField.value,
                email: registerEmailField.value || undefined, // Send undefined if empty, Pydantic handles Optional
                full_name: registerFullNameField.value || undefined,
                password: registerPasswordField.value
            };
            try {
                await apiRequest('/auth/register', 'POST', userData, false);
                alert('Registration successful! Please login.');
                showLoginForm();
                registerForm.reset();
            } catch (error) {
                displayAuthError(registerErrorP, error.message);
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', logoutUser);
    }

    function logoutUser() {
        localStorage.removeItem('accessToken');
        if (loggedInUsernameSpan) loggedInUsernameSpan.textContent = 'User';
        updateLoginState();
    }

    function showRegisterForm() {
        if (loginFormContainer) loginFormContainer.classList.add('hidden');
        if (registerFormContainer) registerFormContainer.classList.remove('hidden');
        displayAuthError(loginErrorP, ''); // Clear errors
        displayAuthError(registerErrorP, '');
    }

    function showLoginForm() {
        if (loginFormContainer) loginFormContainer.classList.remove('hidden');
        if (registerFormContainer) registerFormContainer.classList.add('hidden');
        displayAuthError(loginErrorP, '');
        displayAuthError(registerErrorP, '');
    }

    if (showRegisterFormLink) showRegisterFormLink.addEventListener('click', (e) => { e.preventDefault(); showRegisterForm(); });
    if (showLoginFormLink) showLoginFormLink.addEventListener('click', (e) => { e.preventDefault(); showLoginForm(); });

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
                    await apiRequest(`/products/${id}`, 'PUT', productData); // requiresAuth defaults to true
                    alert('Product updated successfully!');
                } else {
                    const newProduct = await apiRequest('/products/', 'POST', productData); // requiresAuth defaults to true
                    alert(`Product created successfully! ID: ${newProduct.id}`);
                }
                productForm.reset();
                productIdField.value = '';
                if (typeof loadProducts === "function") loadProducts();
            } catch (error) { /* Alerted by apiRequest if needed, or error logged */ }
        });
    }
    if (clearProductFormBtn) clearProductFormBtn.addEventListener('click', () => { if (productForm) productForm.reset(); if (productIdField) productIdField.value = ''; });

    async function loadProducts() {
        if (!productListUl || !localStorage.getItem('accessToken')) { // Only load if logged in and element exists
            if (productListUl) productListUl.innerHTML = '<li>Login to view products.</li>';
            return;
        }
        try {
            // Assuming GET /products is protected or we want to ensure user context for it.
            // If it's a public endpoint, set requiresAuth to false. For now, let's assume it's protected.
            const products = await apiRequest('/products/', 'GET', null, true);
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
            if (productListUl) displayGenericError(productListUl, 'Error loading products.');
        }
    }
    if (loadProductsBtn) loadProductsBtn.addEventListener('click', loadProducts);

    function addEventListenersToProductButtons() {
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                try {
                    const product = await apiRequest(`/products/${id}`, 'GET', null, true); // Assuming GET by ID is also protected
                    if (productIdField) productIdField.value = product.id;
                    if (productNameField) productNameField.value = product.name;
                    if (productSkuField) productSkuField.value = product.sku;
                    if (productDescriptionField) productDescriptionField.value = product.description || '';
                    if (productManufacturerField) productManufacturerField.value = product.manufacturer || '';
                    if (productNameField) productNameField.focus();
                } catch (error) { /* Handled */ }
            });
        });
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                const sku = e.target.dataset.sku;
                if (confirm(`Are you sure you want to delete product SKU ${sku} (ID: ${id})?`)) {
                    try {
                        await apiRequest(`/products/${id}`, 'DELETE', null, true); // Protected
                        alert('Product deleted successfully!');
                        loadProducts();
                    } catch (error) { /* Handled */ }
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
            if (isNaN(eventData.product_id)) { alert("Please enter a valid Product ID."); return; }

            const recordButton = eventForm.querySelector('button[type="submit"]');
            const originalButtonText = recordButton.textContent;
            recordButton.textContent = 'Recording... (Mining Block)';
            recordButton.disabled = true;
            try {
                const result = await apiRequest('/events/record', 'POST', eventData); // Protected
                alert(`Event recorded! Block Index: ${result.block_index}, Hash: ${result.block_hash}`);
                eventForm.reset();
                if (historyProductIdField && historyOutputDiv && historyProductIdField.value === String(eventData.product_id)) {
                    historyOutputDiv.innerHTML = '<p>Event recorded. Click "View History" again to refresh.</p>';
                }
            } catch (error) { /* Handled */ }
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
            if (!productId) { alert("Please enter a Product ID."); return; }
            historyOutputDiv.innerHTML = '<p>Loading history...</p>';
            try {
                // Assuming history is public or auth handled by apiRequest if protected
                const history = await apiRequest(`/events/history/${productId}`, 'GET', null, true);
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
                displayGenericError(historyOutputDiv, `Error loading history for Product ID ${productId}: ${error.message}`);
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
                // Assuming blockchain info is public or auth handled by apiRequest if protected
                const info = await apiRequest('/events/blockchain/info', 'GET', null, true);

                if (blockchainOverallStatusDiv) {
                    blockchainOverallStatusDiv.innerHTML = `
                        <ul>
                            <li><strong>Chain Valid:</strong> ${info.is_valid ? '<span style="color:green;">Yes</span>' : '<span style="color:red;">No</span>'}</li>
                            <li><strong>Chain Length:</strong> ${info.chain_length}</li>
                            <li><strong>Mining Difficulty:</strong> ${info.difficulty}</li>
                        </ul>`;
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
                                <div class="block-hash-preview" title="Hash: ${block.hash}">${block.hash.substring(0, 8)}...${block.hash.substring(block.hash.length - 4)}</div>`;
                            blockElement.dataset.blockData = JSON.stringify(block);
                            const handleBlockClick = () => {
                                document.querySelectorAll('.block-visual.selected').forEach(selectedEl => selectedEl.classList.remove('selected'));
                                blockElement.classList.add('selected');
                                const clickedBlockData = JSON.parse(blockElement.dataset.blockData);
                                displayBlockDetails(clickedBlockData);
                            };
                            blockElement.addEventListener('click', handleBlockClick);
                            blockElement.addEventListener('keydown', (e) => {
                                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleBlockClick(); }
                            });
                            blockchainChainView.appendChild(blockElement);
                        });
                    } else {
                        blockchainChainView.innerHTML = '<p>Blockchain is empty or could not be loaded.</p>';
                    }
                }
            } catch (error) {
                if (blockchainOverallStatusDiv) displayGenericError(blockchainOverallStatusDiv, '');
                if (blockchainChainView) displayGenericError(blockchainChainView, `Error loading blockchain info: ${error.message}`);
                if (blockchainDetailView) blockchainDetailView.innerHTML = '<p>Could not load blockchain details due to an error.</p>';
            }
        });
    }

    function displayBlockDetails(blockData) {
        if (!blockchainDetailView) { console.error("Cannot display block details: 'blockchainDetailView' is null."); return; }
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
            } else { dd.textContent = definition; }
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
        blockchainDetailView.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // --- Initialize UI State ---
    updateLoginState();
});