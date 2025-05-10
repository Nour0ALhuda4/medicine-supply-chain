// Utility function for making authenticated API requests
async function authenticatedFetch(url, options = {}) {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // Merge default options with provided options
    const fetchOptions = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers,
        },
        credentials: 'include', // Always include cookies
    };

    console.log(`Making ${options.method || 'GET'} request to ${url}`, {
        ...fetchOptions,
        headers: { ...fetchOptions.headers }
    });
    
    try {
        const response = await fetch(url, fetchOptions);
        console.log(`Response status:`, response.status);
        console.log('Response headers:', Object.fromEntries([...response.headers]));

        // Handle 401 Unauthorized
        if (response.status === 401) {
            console.log('Unauthorized request - clearing auth state');
            localStorage.removeItem('token');
            window.location.href = '/auth/login.html';
            return null;
        }

        // Parse response based on content type
        const contentType = response.headers.get('content-type');
        let responseData;

        if (contentType && contentType.includes('application/json')) {
            const rawData = await response.text();
            // console.log('Raw response data:', rawData);
            try {
                responseData = JSON.parse(rawData);
                console.log('Parsed response data:', responseData);
            } catch (e) {
                console.error('Failed to parse JSON response:', e);
                return {
                    ok: false,
                    status: response.status,
                    error: 'Invalid JSON response from server'
                };
            }
        } else {
            responseData = { text: await response.text() };
            console.log('Response text:', responseData.text);
        }

        // Return a standardized response object
        return {
            ok: responseData.ok ?? response.ok, // Use API's ok status if available, fallback to HTTP ok
            status: response.status,
            data: responseData.data ?? responseData, // Use data field if available, fallback to entire response
            error: responseData.error // Include any error message
        };

    } catch (err) {
        console.error('API request failed:', err);
        return {
            ok: false,
            status: 500,
            error: `API request failed: ${err.message}`
        };
    }
}

// Export the utility function
export { authenticatedFetch };