// ============================================
// IRIGA PPO - QR CODE & ID CARD GENERATOR
// SHARES LOGIN SESSION WITH INDEX.HTML
// ============================================

let currentQRData = null;
let currentQRCanvas = null;
let batchQRs = [];
let currentClientDataForCard = null;
let currentUser = null;

const AUTHORIZED_EMAILS = [
    'iace2318i@gmail.com',
    'wq.rodalyn@gmail.com',
    'beta22926@gmail.com', 
    'johnrogerargarin@gmail.com',
    'irigacityppo@gmail.com'
];

const TEMPLATE_HEADERS = [
    'PS ID',
    'Full Name',
    'Gender',
    'Date of Birth',
    'Offense Category',
    'Criminal Case Number',
    'Start Date',
    'End Date',
    'Address',
    'Supervising Officer',
    'Cluster'
];

// ============================================
// SAFE STRING HELPER
// ============================================

function toSafeString(value) {
    if (value === undefined || value === null) return '';
    return String(value);
}

function escapeHtml(str) { 
    const safeStr = toSafeString(str);
    if (!safeStr) return ''; 
    return safeStr.replace(/[&<>]/g, function(m){ 
        if(m==='&') return '&amp;'; 
        if(m==='<') return '&lt;'; 
        if(m==='>') return '&gt;'; 
        return m;
    }); 
}








window.addYears = function(years) {
    const startDate = document.getElementById('startDate').value;
    if (startDate) {
        const date = new Date(startDate);
        date.setFullYear(date.getFullYear() + years);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        document.getElementById('endDate').value = `${year}-${month}-${day}`;
    } else {
        alert('Please select a start date first');
    }
};

window.addMonths = function(months) {
    const startDate = document.getElementById('startDate').value;
    if (startDate) {
        const date = new Date(startDate);
        date.setMonth(date.getMonth() + months);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        document.getElementById('endDate').value = `${year}-${month}-${day}`;
    } else {
        alert('Please select a start date first');
    }
};

window.setEndOfYear = function() {
    const startDate = document.getElementById('startDate').value;
    if (startDate) {
        const date = new Date(startDate);
        const year = date.getFullYear();
        document.getElementById('endDate').value = `${year}-12-31`;
    } else {
        alert('Please select a start date first');
    }
};

window.clearDates = function() {
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
};

// ============================================
// SESSION CHECK - FIXED WITH TRY/CATCH
// ============================================

function checkSession() {
    try {
        const saved = localStorage.getItem('loggedInUser');
        if (!saved) {
            const sessionExpired = document.getElementById('sessionExpired');
            const mainContent = document.getElementById('mainContent');
            if (sessionExpired) sessionExpired.style.display = 'block';
            if (mainContent) mainContent.style.display = 'none';
            return false;
        }
        
        const user = JSON.parse(saved);
        if (!user || !user.email || !AUTHORIZED_EMAILS.includes(user.email)) {
            throw new Error("Invalid session");
        }
        
        currentUser = user;
        const sessionExpired = document.getElementById('sessionExpired');
        const mainContent = document.getElementById('mainContent');
        const userNameDisplay = document.getElementById('userNameDisplay');
        const userEmailDisplay = document.getElementById('userEmailDisplay');
        const userAvatar = document.getElementById('userAvatar');
        
        if (sessionExpired) sessionExpired.style.display = 'none';
        if (mainContent) mainContent.style.display = 'block';
        if (userNameDisplay) userNameDisplay.textContent = user.name || user.email;
        if (userEmailDisplay) userEmailDisplay.textContent = user.email;
        if (userAvatar && user.picture) userAvatar.src = user.picture;
        
        return true;
    } catch (e) {
        console.warn("Session corrupted:", e);
        localStorage.removeItem('loggedInUser');
        
        const sessionExpired = document.getElementById('sessionExpired');
        const mainContent = document.getElementById('mainContent');
        if (sessionExpired) sessionExpired.style.display = 'block';
        if (mainContent) mainContent.style.display = 'none';
        return false;
    }
}

function logout() {
    localStorage.removeItem('loggedInUser');
    currentUser = null;
    window.location.href = 'index.html';
}

// ============================================
// QR CODE GENERATION FUNCTIONS
// ============================================

async function generateQRCode(data, size = 300) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        QRCode.toCanvas(canvas, data, { 
            width: size, 
            margin: 2, 
            color: { dark: '#000000', light: '#ffffff' } 
        }, function(error) {
            if (error) reject(error);
            else resolve(canvas);
        });
    });
}

function createSingleIDCardHTML(pusId, pusName, startDate, endDate, cluster, qrImageData) {
    const issueDate = new Date().toLocaleDateString();
    const displayName = toSafeString(pusName) || "N/A";
    const displayCluster = toSafeString(cluster) || "N/A";
    // Use universal formatters
    const displayStartDate = formatDateDisplay(startDate);
    const displayEndDate = formatDateDisplay(endDate);
    
    return `
        <div class="official-id-card" style="width:337px; height:212px; background:white; border-radius:12px; overflow:hidden; font-family:'Segoe UI', Arial, sans-serif; box-shadow:0 2px 5px rgba(0,0,0,0.1); position:relative; display:flex; flex-direction:column;">
            <div style="background:linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color:white; padding:6px 0; text-align:center; flex-shrink:0;">
                <h3 style="font-size:10px; font-weight:600; letter-spacing:0.5px;">IRIGA CITY PAROLE AND PROBATION OFFICE</h3>
            </div>
            <div style="display:flex; padding:10px 12px; gap:12px; flex:1; align-items:center;">
                <div style="width:100px; text-align:center; flex-shrink:0;">
                    <img src="${qrImageData}" style="width:95px; height:95px; border:1px solid #ddd; border-radius:8px; background:white; padding:3px;" alt="QR Code">
                    <div style="font-size:6px; color:#666; margin-top:2px;">Scan for Attendance</div>
                </div>
                <div style="flex:1; min-width:0;">
                    <div style="font-weight:bold; font-size:9px; color:#1e3c72; border-bottom:1px solid #ddd; margin-bottom:6px; padding-bottom:2px;">PAROLEE</div>
                    <div style="margin-bottom:5px;">
                        <div style="font-size:7px; font-weight:bold; color:#555;">NAME</div>
                        <div style="font-size:9px; font-weight:600; color:#2c3e50; line-height:1.2; word-wrap:break-word;">${escapeHtml(displayName)}</div>
                    </div>
                    <div style="margin-bottom:5px;">
                        <div style="font-size:7px; font-weight:bold; color:#555;">CLUSTER</div>
                        <div style="font-size:9px; font-weight:600; color:#2c3e50;">${escapeHtml(displayCluster)}</div>
                    </div>
                    <div>
                        <div style="font-size:7px; font-weight:bold; color:#555;">SUPERVISION PERIOD</div>
                        <div style="font-size:8px; color:#333;">${displayStartDate} to ${displayEndDate}</div>
                    </div>
                </div>
                <div style="width:75px; text-align:center; flex-shrink:0;">
                    <div style="width:68px; height:78px; border:1.5px solid #ccc; border-radius:8px; background:#f9f9f9; display:flex; align-items:center; justify-content:center; margin:0 auto;">
                        <div style="text-align:center; color:#aaa; font-size:10px;">📷<br><span style="font-size:6px;">Photo</span></div>
                    </div>
                    <div style="font-size:5px; color:#aaa; text-align:center; margin-top:1px;">(Paste/glue photo)</div>
                </div>
            </div>
            <div style="background:#f0f0f0; padding:5px 10px; display:flex; justify-content:space-between; font-size:6px; color:#666; border-top:1px solid #ddd; flex-shrink:0;">
                <span>Issued: ${issueDate}</span>
                <span>irigacityppo@gmail.com</span>
            </div>
        </div>
    `;
}

async function generateIDCardCanvas(pusId, pusName, startDate, endDate, cluster, qrImageData) {
    const container = document.getElementById('idCardContainer');
    if (!container) return null;
    
    const cardHTML = createSingleIDCardHTML(pusId, pusName, startDate, endDate, cluster, qrImageData);
    container.innerHTML = cardHTML;
    await new Promise(r => setTimeout(r, 100));
    const cardElement = container.querySelector('.official-id-card');
    if (!cardElement) return null;
    const canvas = await html2canvas(cardElement, { 
        scale: 3, 
        backgroundColor: '#ffffff', 
        logging: false, 
        useCORS: true 
    });
    container.innerHTML = '';
    return canvas;
}

async function downloadIDCard(pusId, pusName, startDate, endDate, cluster, qrImageData, filename) {
    const canvas = await generateIDCardCanvas(pusId, pusName, startDate, endDate, cluster, qrImageData);
    if (canvas) { 
        const link = document.createElement('a'); 
        link.download = filename; 
        link.href = canvas.toDataURL('image/png'); 
        link.click(); 
        return true; 
    }
    return false;
}

function showQRModal(qrCanvas, clientData) {
    const modal = document.getElementById('qrModal');
    const modalQrcode = document.getElementById('modalQrcode');
    const modalClientInfo = document.getElementById('modalClientInfo');
    
    if (!modal) return;
    
    document.body.style.overflow = 'hidden';
    if (modalQrcode) modalQrcode.innerHTML = '';
    
    const canvas = document.createElement('canvas');
    canvas.width = 180;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(qrCanvas, 0, 0, 180, 180);
    if (modalQrcode) modalQrcode.appendChild(canvas);
    
    // Use universal date formatters
    const ageDisplay = getAgeDisplay(clientData.dateOfBirth);
    const displayDOB = formatDateDisplay(clientData.dateOfBirth);
    const displayStartDate = formatDateDisplay(clientData.startDate);
    const displayEndDate = formatDateDisplay(clientData.endDate);
    
    if (modalClientInfo) {
        modalClientInfo.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px 12px;">
                <div><strong>📋 PS ID:</strong></div>
                <div>${escapeHtml(clientData.pusId)}</div>
                <div><strong>👤 Full Name:</strong></div>
                <div>${escapeHtml(clientData.pusName)}</div>
                <div><strong>⚥ Gender:</strong></div>
                <div>${escapeHtml(clientData.gender)}</div>
                <div><strong>🎂 Date of Birth:</strong></div>
                <div>${escapeHtml(displayDOB)}</div>
                <div><strong>📊 Age:</strong></div>
                <div>${escapeHtml(ageDisplay)}</div>
                <div><strong>⚖️ Offense:</strong></div>
                <div>${escapeHtml(clientData.offenseCategory)}</div>
                <div><strong>⚖️ Case No.:</strong></div>
                <div>${escapeHtml(clientData.caseNumber || 'N/A')}</div>
                <div><strong>📅 Start Date:</strong></div>
                <div>${escapeHtml(displayStartDate)}</div>
                <div><strong>📅 End Date:</strong></div>
                <div>${escapeHtml(displayEndDate)}</div>
                <div><strong>🏠 Address:</strong></div>
                <div>${escapeHtml(clientData.address || 'N/A')}</div>
                <div><strong>👮 Officer:</strong></div>
                <div>${escapeHtml(clientData.supervisingOfficer || 'N/A')}</div>
                <div><strong>📍 Cluster:</strong></div>
                <div>${escapeHtml(clientData.cluster || 'N/A')}</div>
            </div>
        `;
    }
    
    modal.style.display = 'block';
    currentClientDataForCard = clientData;
    currentQRCanvas = qrCanvas;
}

function closeModal() {
    const modal = document.getElementById('qrModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// ============================================
// EVENT LISTENERS
// ============================================

document.getElementById('qrForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();

    const btn = document.getElementById('generateQrBtn');
    if (btn) {
        btn.disabled = true;
        btn.textContent = "Generating...";
    }

    try {
        const pusId = document.getElementById('pusId')?.value.trim() || '';
        const pusName = document.getElementById('pusName')?.value.trim() || '';
        let dateOfBirth = document.getElementById('dateOfBirth')?.value || '';

        if (!pusId || !pusName || !dateOfBirth) {
            alert('Please fill in PS ID, Full Name, and Date of Birth');
            return;
        }

        const startDateElem = document.getElementById('startDate');
        const endDateElem = document.getElementById('endDate');
        
        // Use universal date normalizer
        const formattedDOB = normalizeDate(dateOfBirth);
        
        const pusData = { 
            pusId, 
            pusName, 
            gender: document.getElementById('gender')?.value || 'Female', 
            dateOfBirth: formattedDOB || dateOfBirth,
            offenseCategory: document.getElementById('offenseCategory')?.value || 'Drug Offense',
            caseNumber: document.getElementById('caseNumber')?.value || '',
            startDate: startDateElem ? startDateElem.value : '', 
            endDate: endDateElem ? endDateElem.value : '',
            address: document.getElementById('address')?.value || '',
            supervisingOfficer: document.getElementById('officer')?.value || '', 
            cluster: document.getElementById('cluster')?.value || '' 
        };

        currentQRData = JSON.stringify(pusData);

        const canvas = await generateQRCode(currentQRData, 300);
        currentQRCanvas = canvas;

        showQRModal(canvas, pusData);
        saveToLocalStorage(pusData);

    } catch (error) {
        console.error(error);
        alert("QR generation failed: " + error.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = "🔲 Generate QR Code";
        }
    }
});
document.getElementById('modalDownloadQrBtn')?.addEventListener('click', function() {
    if (currentQRCanvas) {
        const pusId = document.getElementById('pusId')?.value || 'unknown';
        const pusName = (document.getElementById('pusName')?.value || 'unknown').replace(/[^a-z0-9]/gi, '_');
        const link = document.createElement('a');
        link.download = `QR_${pusId}_${pusName}.png`;
        link.href = currentQRCanvas.toDataURL('image/png');
        link.click();
    }
});

document.getElementById('modalDownloadCardBtn')?.addEventListener('click', async function() {
    if (!currentClientDataForCard) { alert('Generate QR first'); return; }
    if (!currentQRCanvas) return;
    
    const qrImageData = currentQRCanvas.toDataURL('image/png');
    const pusId = currentClientDataForCard.pusId;
    const pusName = currentClientDataForCard.pusName;
    const startDate = currentClientDataForCard.startDate;
    const endDate = currentClientDataForCard.endDate;
    const cluster = currentClientDataForCard.cluster;
    
    await downloadIDCard(pusId, pusName, startDate, endDate, cluster, qrImageData, `ID_Card_${pusId}_${pusName.replace(/[^a-z0-9]/gi, '_')}.png`);
});

document.getElementById('modalPrintBtn')?.addEventListener('click', function() {
    if (!currentClientDataForCard) { alert('Generate QR first'); return; }
    if (!currentQRCanvas) return;
    
    const qrImageData = currentQRCanvas.toDataURL('image/png');
    const pusId = currentClientDataForCard.pusId;
    const pusName = currentClientDataForCard.pusName;
    const startDate = currentClientDataForCard.startDate;
    const endDate = currentClientDataForCard.endDate;
    const cluster = currentClientDataForCard.cluster;
    
    printSingleCard(pusId, pusName, startDate, endDate, cluster, qrImageData);
});

document.getElementById('modalCloseBtn')?.addEventListener('click', closeModal);
document.querySelector('.modal-close')?.addEventListener('click', closeModal);

window.addEventListener('click', function(event) {
    const modal = document.getElementById('qrModal');
    if (event.target === modal) {
        closeModal();
        document.body.style.overflow = '';
    }
});

function printSingleCard(pusId, pusName, startDate, endDate, cluster, qrImageData) {
    const cardHTML = createSingleIDCardHTML(pusId, pusName, startDate, endDate, cluster, qrImageData);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(`<!DOCTYPE html><html><head><title>ID Card - ${pusName}</title><style>*{margin:0;padding:0;box-sizing:border-box;} body{background:white;display:flex;justify-content:center;align-items:center;min-height:100vh;} @media print{body{margin:0;padding:0;}}</style></head><body><div style="margin:20px;">${cardHTML}</div><script>setTimeout(()=>{window.print();window.close();},200);<\/script></body></html>`);
        printWindow.document.close();
    }
}

// ============================================
// BATCH IMPORT FUNCTIONS
// ============================================

document.getElementById('downloadTemplateBtn')?.addEventListener('click', function() {
    // Create template with actual Date objects for better Excel compatibility
    const templateData = [
        TEMPLATE_HEADERS,
        [
            'PS-2024-001',
            'Dela Cruz, Juan A.',
            'Male',
            new Date(1990, 4, 15),  // May 15, 1990 (month is 0-indexed in JS)
            'Drug Offense',
            'RTC-2024-00123',
            new Date(2023, 7, 15),  // Aug 15, 2023
            new Date(2026, 7, 15),  // Aug 15, 2026
            '123 Purok 1, Brgy. San Juan, Iriga City',
            'SSPO JANET B. PAVIA',
            'IRIGA'
        ],
        [
            'PS-2024-002',
            'Reyes, Maria S.',
            'Female',
            new Date(1982, 8, 20),  // Sep 20, 1982
            'Non-Drug Offense',
            'RTC-2024-00456',
            new Date(2023, 8, 1),   // Sep 1, 2023
            new Date(2026, 8, 1),   // Sep 1, 2026
            '456 Mabini St., Iriga City',
            'SSPO JANET B. PAVIA',
            'NABUA'
        ]
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const colWidths = templateData[0].map((_, colIndex) => {
        const maxLength = Math.max(
            ...templateData.map(row => {
                const val = row[colIndex];
                if (val instanceof Date) return 10;
                return val ? val.toString().length : 10;
            })
        );
        return { wch: Math.min(maxLength + 2, 30) };
    });
    ws['!cols'] = colWidths;

    const headerRange = XLSX.utils.decode_range(ws['!ref']);
    for (let C = headerRange.s.c; C <= headerRange.e.c; C++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!ws[cellAddress]) continue;
        ws[cellAddress].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: "D9E1F2" } },
            alignment: { horizontal: "center" }
        };
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PUS_Template');
    XLSX.writeFile(wb, 'Iriga_PPO_QR_Template.xlsx');
});

async function readExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            try { 
                const data = new Uint8Array(e.target.result); 
                const workbook = XLSX.read(data, { 
                    type: 'array', 
                    cellDates: true,
                    raw: true
                }); 
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]]; 
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
                console.log('Parsed Excel data:', jsonData);
                resolve(jsonData); 
            } catch (error) { 
                console.error('Excel parsing error:', error);
                reject(error); 
            }
        }; 
        reader.onerror = (error) => {
            console.error('FileReader error:', error);
            reject(error);
        }; 
        reader.readAsArrayBuffer(file);
    });
}

document.getElementById('importBtn')?.addEventListener('click', async function() {
    const fileInput = document.getElementById('excelFile');
    const file = fileInput?.files[0];
    const statusDiv = document.getElementById('importStatus'); 
    const progressBar = document.getElementById('progressBar'); 
    const progressFill = document.getElementById('progressFill');
    
    if (!file) { 
        if (statusDiv) {
            statusDiv.style.display = 'block'; 
            statusDiv.className = 'status-message status-error'; 
            statusDiv.textContent = 'Select an Excel file'; 
        }
        return; 
    }
    
    if (statusDiv) {
        statusDiv.style.display = 'block'; 
        statusDiv.className = 'status-message status-info'; 
        statusDiv.textContent = 'Reading Excel file...';
    }
    
    try {
        const data = await readExcelFile(file);
        
        if (!data || data.length === 0) {
            throw new Error('No data found in Excel file');
        }
        
        if (statusDiv) statusDiv.textContent = `Found ${data.length} records. Generating...`;
        if (progressBar) progressBar.style.display = 'block';
        batchQRs = [];
        
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            if (progressFill) progressFill.style.width = `${((i+1)/data.length)*100}%`;
            
            // Support various column name variations
            let dateOfBirth = row['Date of Birth'] || row['dateOfBirth'] || row['DOB'] || row['Birth Date'] || '';
            let startDate = row['Start Date'] || row['startDate'] || '';
            let endDate = row['End Date'] || row['endDate'] || '';
            
            console.log(`Row ${i} - Raw DOB:`, dateOfBirth, 'Type:', typeof dateOfBirth);
            
            // Use universal date normalizer - handles ALL formats!
            dateOfBirth = normalizeDate(dateOfBirth);
            startDate = normalizeDate(startDate);
            endDate = normalizeDate(endDate);
            
            console.log(`Row ${i} - Normalized DOB: ${dateOfBirth}, Start: ${startDate}, End: ${endDate}`);
            
            // Validate normalized date format
            if (dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
                console.warn(`Row ${i} - Invalid DOB format after normalization: ${dateOfBirth}`);
                dateOfBirth = '';
            }
            
            const pusData = {
                pusId: String(row['PS ID'] || row['pusId'] || `PS-${Date.now()}-${i}`),
                pusName: String(row['Full Name'] || row['pusName'] || row['NAME OF CLIENT'] || 'Unknown'),
                gender: String(row['Gender'] || row['gender'] || 'Female'),
                dateOfBirth: dateOfBirth,
                offenseCategory: String(row['Offense Category'] || row['offenseCategory'] || 'Drug Offense'),
                startDate: startDate,
                endDate: endDate,
                address: row['Address'] ? String(row['Address']).trim() : '',
                caseNumber: row['Criminal Case Number'] ? String(row['Criminal Case Number']).trim() : '',
                supervisingOfficer: String(row['Supervising Officer'] || row['supervisingOfficer'] || ''),
                cluster: String(row['Cluster'] || row['cluster'] || '')
            };
            
            console.log(`Row ${i} - Processed PUS: ${pusData.pusName}, DOB: ${pusData.dateOfBirth}`);
            
            const qrData = JSON.stringify(pusData);
            const canvas = await generateQRCode(qrData, 300);
            const qrImageData = canvas.toDataURL('image/png');
            batchQRs.push({ data: pusData, canvas, imageUrl: qrImageData });
            saveToLocalStorage(pusData);
        }
        
        if (progressBar) progressBar.style.display = 'none';
        if (statusDiv) {
            statusDiv.className = 'status-message status-success';
            statusDiv.innerHTML = `✅ Successfully generated ${batchQRs.length} QR codes!`;
        }
        displayBatchResults(batchQRs);
        
        if (typeof openBatchModal === 'function') {
            openBatchModal();
        }
    } catch (error) {
        console.error('Import error:', error);
        if (statusDiv) {
            statusDiv.className = 'status-message status-error'; 
            statusDiv.textContent = 'Error: ' + error.message; 
        }
        if (progressBar) progressBar.style.display = 'none';
        alert('Import failed: ' + error.message);
    }
});

function displayBatchResults(qrs) {
    const batchList = document.getElementById('batchListModal');
    if (!batchList) return;
    
    batchList.innerHTML = qrs.map((qr, index) => {
        // Use universal formatters
        const ageDisplay = calculateAge(qr.data.dateOfBirth);
        const ageText = ageDisplay ? ` | Age: ${ageDisplay}` : '';
        const displayDOB = formatDateDisplay(qr.data.dateOfBirth);
        return `
            <div class="batch-item-modal">
                <div class="batch-info-modal">
                    <div class="batch-name-modal">${escapeHtml(qr.data.pusName)}</div>
                    <div class="batch-details-modal">ID: ${escapeHtml(qr.data.pusId)} | DOB: ${escapeHtml(displayDOB)}${ageText}</div>
                </div>
                <div class="batch-actions-modal">
                    <button class="btn-small" onclick="downloadSingleBatch(${index})">📥 QR</button>
                    <button class="btn-small" onclick="downloadSingleBatchCard(${index})">🆔 Card</button>
                    <button class="btn-small" onclick="printSingleBatchCard(${index})">🖨️ Print</button>
                </div>
            </div>
        `;
    }).join('');
}

window.downloadSingleBatch = function(index) { 
    const qr = batchQRs[index]; 
    if(qr && qr.imageUrl){ 
        const link = document.createElement('a'); 
        link.download = `QR_${qr.data.pusId}_${qr.data.pusName.replace(/[^a-z0-9]/gi, '_')}.png`; 
        link.href = qr.imageUrl;
        link.click(); 
    } 
};

window.downloadSingleBatchCard = async function(index) { 
    const qr = batchQRs[index]; 
    if(qr) await downloadIDCard(qr.data.pusId, qr.data.pusName, qr.data.startDate, qr.data.endDate, qr.data.cluster, qr.imageUrl, `ID_Card_${qr.data.pusId}_${qr.data.pusName.replace(/[^a-z0-9]/gi, '_')}.png`); 
};

window.printSingleBatchCard = function(index) { 
    const qr = batchQRs[index]; 
    if(qr) printSingleCard(qr.data.pusId, qr.data.pusName, qr.data.startDate, qr.data.endDate, qr.data.cluster, qr.imageUrl); 
};

document.getElementById('massDownloadQrsBtnModal')?.addEventListener('click', async function() {
    if(batchQRs.length === 0) { 
        alert('No QR codes to download'); 
        return; 
    }
    const zip = new JSZip();
    for(let qr of batchQRs) { 
        const base64Data = qr.imageUrl.split(',')[1];
        const safeName = qr.data.pusName.replace(/[^a-z0-9]/gi, '_'); 
        zip.file(`QR_${qr.data.pusId}_${safeName}.png`, base64Data, { base64: true }); 
    }
    const blob = await zip.generateAsync({ type: 'blob' }); 
    const link = document.createElement('a'); 
    link.href = URL.createObjectURL(blob); 
    link.download = `All_QR_Codes_${Date.now()}.zip`;
    document.body.appendChild(link);
    link.click(); 
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(link.href), 5000);
});

document.getElementById('massDownloadCardsBtnModal')?.addEventListener('click', async function() {
    if (batchQRs.length === 0) { 
        alert('No batch QR codes'); 
        return; 
    }
    const massProgress = document.getElementById('massProgressModal'); 
    const massProgressFill = document.getElementById('massProgressFillModal'); 
    const massStatus = document.getElementById('massStatusModal');
    if (massProgress) massProgress.style.display = 'block'; 
    if (massStatus) massStatus.textContent = `Generating ${batchQRs.length} ID cards...`; 
    if (massProgressFill) massProgressFill.style.width = '0%';
    const zip = new JSZip();
    for (let i = 0; i < batchQRs.length; i++) {
        const qr = batchQRs[i];
        if (massProgressFill) massProgressFill.style.width = `${((i+1)/batchQRs.length)*100}%`; 
        if (massStatus) massStatus.textContent = `Processing ${i+1}/${batchQRs.length}: ${qr.data.pusName}`;
        const canvas = await generateIDCardCanvas(qr.data.pusId, qr.data.pusName, qr.data.startDate, qr.data.endDate, qr.data.cluster, qr.imageUrl);
        if(canvas){ 
            const base64Data = canvas.toDataURL('image/png').split(',')[1]; 
            zip.file(`ID_Card_${qr.data.pusId}_${qr.data.pusName.replace(/[^a-z0-9]/gi, '_')}.png`, base64Data, { base64: true }); 
        }
        await new Promise(r => setTimeout(r, 50));
    }
    const blob = await zip.generateAsync({ type: 'blob' }); 
    const link = document.createElement('a'); 
    link.href = URL.createObjectURL(blob); 
    link.download = `All_ID_Cards_${Date.now()}.zip`;
    document.body.appendChild(link);
    link.click(); 
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(link.href), 5000);
    if (massStatus) massStatus.textContent = '✅ All cards ready!'; 
    if (massProgress) setTimeout(()=>{ massProgress.style.display='none'; }, 2000);
});

// ============================================
// MASS PRINT CARDS - UPDATED FOR 8 CARDS PER PAGE
// ============================================
document.getElementById('massPrintCardsBtnModal')?.addEventListener('click', function() {
    if (batchQRs.length === 0) { alert('No batch QR codes to print'); return; }
    
    const cardsPerPage = 8;
    let pagesHtml = '';
    
    for (let i = 0; i < batchQRs.length; i += cardsPerPage) {
        const pageCards = batchQRs.slice(i, i + cardsPerPage);
        let gridItems = '';
        for (let j = 0; j < pageCards.length; j++) {
            const qr = pageCards[j];
            gridItems += `
                <div class="print-card-item">
                    <div class="cut-border">
                        ${createSingleIDCardHTML(qr.data.pusId, qr.data.pusName, qr.data.startDate, qr.data.endDate, qr.data.cluster, qr.imageUrl)}
                        <div class="cut-corner top-left"></div>
                        <div class="cut-corner top-right"></div>
                        <div class="cut-corner bottom-left"></div>
                        <div class="cut-corner bottom-right"></div>
                    </div>
                </div>`;
        }
        pagesHtml += `<div class="print-page"><div class="print-id-grid">${gridItems}</div></div>`;
    }
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(`<!DOCTYPE html><html><head><title>Iriga PPO ID Cards</title><style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { background: white; padding: 0.2in; margin: 0; font-family: 'Segoe UI', Arial, sans-serif; }

            .print-id-grid { 
                display: grid; 
                grid-template-columns: repeat(2, 1fr);
                gap: 24px 32px;
                justify-content: center;
                margin: 0 auto;
                width: fit-content;
            }

            .print-card-item { 
                width: 337px; 
                page-break-inside: avoid; 
                break-inside: avoid;
            }

            /* FIX: removed line-height: 0 */
            .cut-border {
                position: relative;
                display: inline-block;
                border: 1.5px dashed #999;
                border-radius: 13px;
                padding: 0;
            }

            .cut-corner {
                position: absolute;
                width: 10px;
                height: 10px;
                border-color: #555;
                border-style: solid;
                z-index: 10;
            }
            .cut-corner.top-left     { top: -3px; left: -3px;  border-width: 2px 0 0 2px; border-radius: 3px 0 0 0; }
            .cut-corner.top-right    { top: -3px; right: -3px; border-width: 2px 2px 0 0; border-radius: 0 3px 0 0; }
            .cut-corner.bottom-left  { bottom: -3px; left: -3px;  border-width: 0 0 2px 2px; border-radius: 0 0 0 3px; }
            .cut-corner.bottom-right { bottom: -3px; right: -3px; border-width: 0 2px 2px 0; border-radius: 0 0 3px 0; }

            .cut-border::before {
                content: '✂';
                position: absolute;
                top: -11px;
                left: 6px;
                font-size: 10px;
                color: #888;
                background: white;
                padding: 0 3px;
                line-height: 1;
            }

            .print-page { 
                page-break-after: always; 
                break-after: page; 
                display: flex;
                justify-content: center;
                padding: 10px 0;
            }
            .print-page:last-child { 
                page-break-after: auto; 
                break-after: auto; 
            }

            @media print { 
                body { padding: 0.15in; }
                .print-page { page-break-after: always; } 
                .print-page:last-child { page-break-after: auto; }
                .cut-border { border-color: #aaa; }
                .cut-corner { border-color: #666; }
            }

            @page { 
                size: letter portrait; 
                margin: 0.1in;
            }
        </style></head><body>${pagesHtml}</body></html>`);
        printWindow.document.close();
        setTimeout(() => { printWindow.print(); }, 300);
    }
});

document.getElementById('clearBatchBtnModal')?.addEventListener('click', function() { 
    if(confirm('Clear all batch generated QR codes?')){ 
        batchQRs = []; 
        const batchList = document.getElementById('batchListModal');
        if (batchList) batchList.innerHTML = '';
        if (typeof closeBatchModal === 'function') {
            closeBatchModal();
        }
    } 
});

// ============================================
// LOCAL STORAGE FUNCTIONS
// ============================================

function saveToLocalStorage(pusData) {
    try {
        let records = JSON.parse(localStorage.getItem('iriga_ppo_pus') || '[]');
        const idx = records.findIndex(r => r.pusId === pusData.pusId);
        if (idx >= 0) records[idx] = pusData; else records.push(pusData);
        localStorage.setItem('iriga_ppo_pus', JSON.stringify(records));
        displayPUSList(records);
    } catch (e) {
        console.warn('Storage error, resetting:', e);
        localStorage.setItem('iriga_ppo_pus', JSON.stringify([pusData]));
    }
}

function displayPUSList(records) {
    const container = document.getElementById('pusList');
    if(!container) return;
    
    if(!records.length){ 
        container.innerHTML = '<p>No records yet. Generate QR codes to add persons.</p>'; 
        return; 
    }
    container.innerHTML = records.map(record => {
        const ageDisplay = record.dateOfBirth ? calculateAge(record.dateOfBirth) : '';
        const ageText = ageDisplay ? ` | Age: ${ageDisplay}` : '';
        const displayDOB = formatDateDisplay(record.dateOfBirth);
        return `<div class="batch-item" onclick="loadPUS('${record.pusId}')"><div class="batch-info"><div class="batch-name">${escapeHtml(record.pusName)} <span style="font-size:9px; background:#2a5298; color:white; padding:2px 6px; border-radius:10px;">${escapeHtml(record.pusId)}</span></div><div class="batch-details">${record.offenseCategory} | DOB: ${escapeHtml(displayDOB)}${ageText} | ${record.cluster||'No Cluster'}</div></div><button class="btn-small" onclick="event.stopPropagation(); regenerateQR('${record.pusId}')">🔄 Regenerate</button></div>`;
    }).join('');
}

window.loadPUS = function(pusId) { 
    const records = JSON.parse(localStorage.getItem('iriga_ppo_pus')||'[]'); 
    const record = records.find(r=>r.pusId===pusId); 
    if(record){ 
        const pusIdElem = document.getElementById('pusId');
        const pusNameElem = document.getElementById('pusName');
        const genderElem = document.getElementById('gender');
        const dateOfBirthElem = document.getElementById('dateOfBirth');
        const offenseElem = document.getElementById('offenseCategory');
        const caseNumElem = document.getElementById('caseNumber');
        const startDateElem = document.getElementById('startDate');
        const endDateElem = document.getElementById('endDate');
        const addressElem = document.getElementById('address');
        const officerElem = document.getElementById('officer');
        const clusterElem = document.getElementById('cluster');
        
        if (pusIdElem) pusIdElem.value = record.pusId; 
        if (pusNameElem) pusNameElem.value = record.pusName; 
        if (genderElem) genderElem.value = record.gender; 
        if (dateOfBirthElem) dateOfBirthElem.value = record.dateOfBirth || '';
        if (offenseElem) offenseElem.value = record.offenseCategory; 
        if (caseNumElem) caseNumElem.value = record.caseNumber || '';
        if (startDateElem) startDateElem.value = record.startDate || ''; 
        if (endDateElem) endDateElem.value = record.endDate || ''; 
        if (addressElem) addressElem.value = record.address || '';
        if (officerElem) officerElem.value = record.supervisingOfficer || ''; 
        if (clusterElem) clusterElem.value = record.cluster || ''; 
        
        const qrForm = document.getElementById('qrForm');
        if (qrForm) qrForm.dispatchEvent(new Event('submit')); 
    } 
};

window.regenerateQR = function(pusId) { loadPUS(pusId); };

window.exportAllPUS = function() { 
    const records = JSON.parse(localStorage.getItem('iriga_ppo_pus')||'[]'); 
    if(!records.length){ alert('No records'); return; } 
    const blob = new Blob([JSON.stringify(records,null,2)], {type:'application/json'}); 
    const link = document.createElement('a'); 
    link.download = `iriga_ppo_pus_${new Date().toISOString().split('T')[0]}.json`; 
    link.href = URL.createObjectURL(blob);
    document.body.appendChild(link);
    link.click(); 
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(link.href), 5000);
};

window.clearAllPUS = function() { 
    if(confirm('Delete ALL records?')){ 
        localStorage.removeItem('iriga_ppo_pus'); 
        displayPUSList([]); 
        clearForm(); 
    } 
};

function clearForm() { 
    const qrForm = document.getElementById('qrForm');
    if (qrForm) qrForm.reset(); 
    currentQRData=null; 
    currentClientDataForCard=null; 
}

document.getElementById('templateHelpLink')?.addEventListener('click',(e)=>{ 
    e.preventDefault(); 
    alert("📋 Required headers: PS ID, Full Name, Gender, Date of Birth, Offense Category, Criminal Case Number, Start Date, End Date, Address, Supervising Officer, Cluster\n\n📅 The Excel template uses actual date fields. You can enter dates in any format (MM/DD/YYYY, DD/MM/YYYY, Month DD, YYYY, etc.) and they will be automatically converted!"); 
});

document.getElementById('logoutBtn')?.addEventListener('click', function() {
    logout();
});

// ============================================
// BATCH MODAL FUNCTIONS
// ============================================

window.openBatchModal = function() {
    const batchModal = document.getElementById('batchModal');
    if (batchModal) {
        batchModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
};

window.closeBatchModal = function() {
    const batchModal = document.getElementById('batchModal');
    if (batchModal) {
        batchModal.style.display = 'none';
        document.body.style.overflow = '';
    }
};

// ============================================
// INITIALIZATION
// ============================================

checkSession();

const saved = JSON.parse(localStorage.getItem('iriga_ppo_pus')||'[]');
displayPUSList(saved);