import { authenticatedFetch } from './utils/api.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Admin page loaded, checking authentication...');
        const { ok, data } = await authenticatedFetch('/api/user');
        console.log('Auth response:', { ok, data });
        
        if (!ok || !data || data.username !== 'admin') {
            console.log('Not admin user, redirecting...', { ok, data });
            window.location.href = '/';
            return;
        }

        console.log('Admin authenticated, loading shipments...');
        loadShipments();
    } catch (error) {
        console.error('Authentication error:', error);
        window.location.href = '/';
    }
});

async function loadShipments() {
    try {
        console.log('Fetching all shipments...');
        const { ok, data, error } = await authenticatedFetch('/api/shipments/admin/list');
        console.log('Shipments response:', { ok, data, error });
        
        if (!ok || !data) {
            throw new Error(`Failed to fetch shipments: ${error || 'Unknown error'}`);
        }
        
        const tableBody = document.getElementById('shipmentsTableBody');
        if (!tableBody) {
            console.error('Table body element not found!');
            return;
        }
        
        console.log(`Rendering ${data.length} shipments...`);
        tableBody.innerHTML = '';
        
        data.forEach((shipment, index) => {
            console.log(`Rendering shipment ${index + 1}:`, shipment);
            
            const row = document.createElement('tr');
            
            const statusOptions = [
                'تم التجهيز',
                'تم الشحن',
                'في الطريق',
                'تم التوصيل'
            ];
            
            const statusSelect = document.createElement('select');
            statusSelect.className = 'status-select';
            statusOptions.forEach(option => {
                const optElement = document.createElement('option');
                optElement.value = option;
                optElement.textContent = option;
                if (option === shipment.current_status) {
                    optElement.selected = true;
                }
                optElement.style.color = option === 'تم التوصيل' ? '#a68bd8' : '#4682b4';
                statusSelect.appendChild(optElement);
            });
            
            statusSelect.addEventListener('change', async (e) => {
                try {
                    console.log(`Updating status for shipment ${shipment.shipment_number}...`);
                    const { ok } = await authenticatedFetch(`/api/shipments/admin/${shipment.shipment_number}/status`, {
                        method: 'PUT',
                        body: JSON.stringify({
                            status: e.target.value
                        })
                    });
                    
                    console.log(`Status update response for shipment ${shipment.shipment_number}:`, { ok });
                    
                    if (!ok) {
                        throw new Error('Failed to update status');
                    }
                    
                    console.log(`Status updated successfully for shipment ${shipment.shipment_number}`);
                    loadShipments();
                } catch (error) {
                    console.error(`Error updating status for shipment ${shipment.shipment_number}:`, error);
                    alert('حدث خطأ أثناء تحديث الحالة');
                }
            });

            row.innerHTML = `
                <td>${shipment.shipment_number || 'N/A'}</td>
                <td>${shipment.description || 'N/A'}</td>
                <td>${shipment.user_name || 'N/A'}</td>
                <td>${shipment.arduino_id || 'N/A'}</td>
                <td style="color: ${shipment.current_status === 'تم التوصيل' ? '#a68bd8' : '#4682b4'}; font-weight: bold;">${shipment.current_status || 'N/A'}</td>
                <td></td>
                <td>${shipment.temperature ? shipment.temperature + '°C' : 'N/A'}</td>
                <td>${shipment.humidity ? shipment.humidity + '%' : 'N/A'}</td>
                <td>${shipment.last_update ? new Date(shipment.last_update).toLocaleString('ar-EG') : 'N/A'}</td>
            `;
            
            row.children[4].appendChild(statusSelect);
            
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading shipments:', error);
        alert('حدث خطأ أثناء تحميل الشحنات');
    }
}
