// ============================================
// IRIGA PPO ATTENDANCE SYSTEM – EMAIL ONLY WHEN 60 DAYS OR LESS REMAINING
// FIXED: Year threshold (years < 30 = 2000s, >= 30 = 1900s)
// REMOVED: Unnecessary Utilities.sleep()
// FIXED: testAgeCalculation with correct year threshold
// UPDATED: Sheet router for cluster-based attendance sheets
// UPDATED: "PS ID"/"PS Name" renamed to "Docket Number"/"Name";
//          clients with no docket number are recorded as "N/A" (no auto-generated ID)
// ============================================

const SPREADSHEET_ID = '1_3Rbp_vGdKVoeSESlUeAyBnJgUAaKStNMlhRU_1yBrQ';
const TRACKING_SHEET_NAME = 'Supervision_Tracking';

// ============================================
// ATTENDANCE HEADERS
// ============================================
const ATTENDANCE_HEADERS = [
  'Timestamp',
  'Docket Number',
  'NAME OF CLIENT',
  'GENDER',
  'OFFENSE CATEGORY',
  'CRIMINAL CASE NUMBER',
  'ADDRESS',
  'START OF SUPERVISION PERIOD',
  'END OF SUPERVISION PERIOD',
  'NAME OF SUPERVISING OFFICER',
  'CLUSTER',
  'REMARKS',
  'WITH FAMILY SUPPORT GROUP',
  'NOTES',
  'Email Address',
  'AGE'
];

// ============================================
// AUTHORIZED EMPLOYEES
// ============================================
const AUTHORIZED_EMPLOYEES = [
  'iace2318i@gmail.com',
  'wq.rodalyn@gmail.com',
  'beta22926@gmail.com',
  'johnrogerargarin@gmail.com',
  'irigacityppo@gmail.com'
];

// ============================================
// EMAIL CONFIGURATION
// ============================================
const MAIN_OFFICE_EMAIL = 'irigacityppo@gmail.com';
const SEND_EMAIL_NOTIFICATIONS = true;
const EMAIL_THRESHOLD_DAYS = 60;

// ============================================
// CORS HELPERS
// ============================================
function createCorsOutput(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doOptions(e) {
  return createCorsOutput({ success: true });
}

// ============================================
// SHEET ROUTER: Get or create a Cluster + Date sheet
//
// Naming: "IRIGA - June 13, 2025"
// Same cluster + same day → append to existing sheet
// Same cluster + different day → create new sheet
// ============================================
function getOrCreateAttendanceSheet(cluster, timestamp) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const tz = Session.getScriptTimeZone();

  // Format: "June 13, 2025"
  const formattedDate = Utilities.formatDate(date, tz, 'MMMM d, yyyy');
  const sheetName = `${cluster} - ${formattedDate}`;

  // If sheet already exists, just return it (same cluster + same day = append)
  const existing = ss.getSheetByName(sheetName);
  if (existing) {
    console.log(`📋 Appending to existing sheet: ${sheetName}`);
    return existing;
  }

  // Otherwise create a fresh sheet for this cluster+day
  return createAttendanceSheet(ss, sheetName);
}

/**
 * Creates a new attendance sheet with headers and returns it.
 */
function createAttendanceSheet(ss, sheetName) {
  const sheet = ss.insertSheet(sheetName);
  sheet.getRange(1, 1, 1, ATTENDANCE_HEADERS.length).setValues([ATTENDANCE_HEADERS]);
  sheet.getRange(1, 1, 1, ATTENDANCE_HEADERS.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  console.log(`✅ Created new sheet: ${sheetName}`);
  return sheet;
}

// ============================================
// AGE CALCULATION FROM DATE OF BIRTH
// ============================================
function calculateAgeFromDOB(dateOfBirth) {
  if (!dateOfBirth || dateOfBirth === 'N/A' || dateOfBirth === '') return 'N/A';
  
  try {
    const dateString = String(dateOfBirth).trim();
    let dob = null;
    
    // Format: YYYY-MM-DD
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const parts = dateString.split('-');
      dob = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
    // Format: MM/DD/YY (with year threshold fix)
    else if (dateString.match(/^\d{2}\/\d{2}\/\d{2}$/)) {
      const parts = dateString.split('/');
      const month = parseInt(parts[0], 10) - 1;
      const day = parseInt(parts[1], 10);
      let year = parseInt(parts[2], 10);
      // FIXED: years < 30 = 2000s, >= 30 = 1900s
      year = year < 30 ? 2000 + year : 1900 + year;
      dob = new Date(year, month, day);
    }
    // Format: MM/DD/YYYY
    else if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const parts = dateString.split('/');
      dob = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
    }
    // Format: MM-DD-YYYY
    else if (dateString.match(/^\d{2}-\d{2}-\d{4}$/)) {
      const parts = dateString.split('-');
      dob = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
    }
    // Try regular date parsing
    else {
      dob = new Date(dateString);
    }
    
    if (!dob || isNaN(dob.getTime())) {
      return 'N/A';
    }
    
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age.toString();
  } catch(e) {
    console.error(`Age calculation error:`, e.message);
    return 'N/A';
  }
}

// ============================================
// DATE PARSING HELPER (with year threshold fix)
// ============================================
function parseDate(dateStr) {
  if (!dateStr || dateStr === 'N/A' || dateStr === '') return null;
  
  try {
    const dateString = String(dateStr).trim();
    
    // Format: YYYY-MM-DD
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const parts = dateString.split('-');
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
    // Format: MM/DD/YY (with year threshold fix)
    else if (dateString.match(/^\d{2}\/\d{2}\/\d{2}$/)) {
      const parts = dateString.split('/');
      const month = parseInt(parts[0], 10) - 1;
      const day = parseInt(parts[1], 10);
      let year = parseInt(parts[2], 10);
      // FIXED: years < 30 = 2000s, >= 30 = 1900s
      year = year < 30 ? 2000 + year : 1900 + year;
      return new Date(year, month, day);
    }
    // Format: MM/DD/YYYY
    else if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const parts = dateString.split('/');
      return new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
    }
    // Format: MM-DD-YYYY
    else if (dateString.match(/^\d{2}-\d{2}-\d{4}$/)) {
      const parts = dateString.split('-');
      return new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
    }
    // Try regular date parsing
    else {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) return date;
    }
  } catch(e) {
    console.error(`Date parsing error:`, e.message);
  }
  
  return null;
}

// ============================================
// TIME CALCULATION
// ============================================
function calculateTimeRemaining(endDateStr) {
  if (!endDateStr || endDateStr === 'N/A' || endDateStr === '') {
    return { text: 'No end date specified', days: null };
  }
  
  try {
    const endDate = parseDate(endDateStr);
    if (!endDate) return { text: 'Invalid date format', days: null };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (endDate < today) {
      return { text: 'EXPIRED - Supervision period has ended', days: 0 };
    }
    
    const diffDays = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    const days = diffDays % 30;
    
    let text = '';
    if (years > 0) text = `${years} year(s), ${months} month(s), ${days} day(s) remaining`;
    else if (months > 0) text = `${months} month(s), ${days} day(s) remaining`;
    else text = `${diffDays} day(s) remaining`;
    
    return { text: text, days: diffDays };
  } catch(e) { 
    console.error(`Error calculating time remaining:`, e.message);
    return { text: 'Unable to calculate', days: null };
  }
}

function calculateTimeServed(startDateStr) {
  if (!startDateStr || startDateStr === 'N/A' || startDateStr === '') {
    return 'No start date specified';
  }
  
  try {
    const startDate = parseDate(startDateStr);
    if (!startDate) return 'Invalid date format';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (startDate > today) return 'Supervision has not started yet';
    
    const diffDays = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    const days = diffDays % 30;
    
    if (years > 0) return `${years} year(s), ${months} month(s), ${days} day(s) served`;
    if (months > 0) return `${months} month(s), ${days} day(s) served`;
    return `${diffDays} day(s) served`;
  } catch(e) { 
    console.error(`Error calculating time served:`, e.message);
    return 'Unable to calculate';
  }
}

function formatReadableDate(dateStr) {
  if (!dateStr || dateStr === 'N/A') return 'N/A';
  const date = parseDate(dateStr);
  if (!date) return dateStr;
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

// ============================================
// EMAIL NOTIFICATION
// ============================================
function sendAttendanceNotification(data, clientName, clientId, calculatedAge) {
  if (!SEND_EMAIL_NOTIFICATIONS) return;
  if (!MAIN_OFFICE_EMAIL) return;
  
  try {
    const endDate = data.endDate || 'N/A';
    const startDate = data.startDate || 'N/A';
    const timeRemainingObj = calculateTimeRemaining(endDate);
    const timeRemaining = timeRemainingObj.text;
    const daysRemaining = timeRemainingObj.days;
    const timeServed = calculateTimeServed(startDate);
    
    const formattedStartDate = formatReadableDate(startDate);
    const formattedEndDate = formatReadableDate(endDate);
    
    if (daysRemaining !== null && daysRemaining <= EMAIL_THRESHOLD_DAYS && daysRemaining > 0) {
      
      const body = `
🏢 IRIGA CITY PROBATION AND PAROLE OFFICE
==========================================
⚠️ ATTENTION: SUPERVISION ENDING SOON ⚠️

👤 PERSON UNDER SUPERVISION
─────────────────────────────────────────
Docket Number: ${clientId || 'N/A'}
Full Name: ${clientName || 'N/A'}
Gender: ${data.gender || 'N/A'}
Age: ${calculatedAge || 'N/A'}
Offense: ${data.offenseCategory || 'N/A'}
Criminal Case No.: ${data.caseNumber || 'N/A'}
Address: ${data.address || 'N/A'}
Officer: ${data.supervisingOfficer || 'N/A'}
Cluster: ${data.cluster || 'N/A'}

⏰ SUPERVISION TIMELINE
─────────────────────────────────────────
Start: ${formattedStartDate}
End:   ${formattedEndDate}
✅ Time served: ${timeServed}
⏳ Remaining:   ${timeRemaining}

⚠️ ONLY ${daysRemaining} DAYS REMAINING IN SUPERVISION PERIOD ⚠️

📝 ATTENDANCE DETAILS
─────────────────────────────────────────
Date/Time: ${new Date().toLocaleString()}
REMARKS: ${data.remarks || 'N/A'}
Family Support: ${data.familySupport || 'N/A'}
NOTES: ${data.notes || 'No notes'}

👮 Officer Email: ${data.employeeEmail || 'N/A'}
==========================================
This is an automated alert from the Iriga PPO Attendance System.`;
      
      MailApp.sendEmail({ 
        to: MAIN_OFFICE_EMAIL, 
        subject: `⚠️ ALERT: Supervision Ending Soon - ${clientName} (${clientId}) - ${daysRemaining} days left`, 
        body: body 
      });
      console.log(`✅ Alert email sent for ${clientName}`);
    }
  } catch(e) { 
    console.error('Email error:', e.message); 
  }
}

// ============================================
// SUPERVISION TRACKING SHEET
// ============================================
function updateSupervisionTracking(data, clientName, clientId, calculatedAge) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(TRACKING_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(TRACKING_SHEET_NAME);
    sheet.getRange(1,1,1,12).setValues([[
      'Docket Number', 'Name', 'Start Date', 'End Date', 'Time Remaining', 'Days Left', 
      'Status', 'Last Attendance', 'Officer Email', 'Criminal Case No.', 'Address', 'Age'
    ]]);
    sheet.getRange(1,1,1,12).setFontWeight('bold');
  } else {
    // If the sheet already exists from before this fix, make sure the
    // header row reflects the new column names too.
    const headerRange = sheet.getRange(1, 1, 1, 2);
    const currentHeaders = headerRange.getValues()[0];
    if (currentHeaders[0] !== 'Docket Number' || currentHeaders[1] !== 'Name') {
      headerRange.setValues([['Docket Number', 'Name']]);
      headerRange.setFontWeight('bold');
    }
  }
  
  // No ID supplied? Just record it as N/A — don't invent one.
  const docketNumber = clientId || data.clientId || data.pusId || 'N/A';
  const pusName = clientName || data.clientName || data.pusName || 'N/A';
  const startDate = data.startDate || 'N/A';
  const endDate = data.endDate || 'N/A';
  const caseNumber = data.caseNumber || 'N/A';
  const address = data.address || 'N/A';
  
  const timeRemainingObj = calculateTimeRemaining(endDate);
  const timeRemaining = timeRemainingObj.text;
  const daysLeft = timeRemainingObj.days;
  
  let status = 'Active';
  if (daysLeft !== null && daysLeft <= 60 && daysLeft > 0) status = '⚠️ Ending Soon';
  else if (daysLeft !== null && daysLeft <= 0) status = 'Expired';
  
  // Only try to match/update an existing row when we have a real docket
  // number. Multiple people can legitimately have "N/A" — matching on
  // that would overwrite one person's row with another person's data.
  const existing = sheet.getDataRange().getValues();
  let rowIdx = -1;
  if (docketNumber !== 'N/A') {
    for (let i = 1; i < existing.length; i++) {
      if (existing[i][0] === docketNumber) { 
        rowIdx = i + 1; 
        break; 
      }
    }
  }
  
  const newRow = [
    docketNumber, 
    pusName, 
    startDate, 
    endDate, 
    timeRemaining, 
    daysLeft !== null ? daysLeft : 'N/A', 
    status, 
    new Date(), 
    data.employeeEmail || '', 
    caseNumber, 
    address,
    calculatedAge || 'N/A'
  ];
  
  if (rowIdx === -1) {
    sheet.appendRow(newRow);
  } else {
    for (let i = 0; i < newRow.length; i++) {
      sheet.getRange(rowIdx, i + 1).setValue(newRow[i]);
    }
  }

  return docketNumber;
}

// ============================================
// doPost – MAIN ENTRY POINT (uses data.age from client)
// ============================================
function doPost(e) {
  try {
    let data = (e && e.postData && e.postData.contents) ? JSON.parse(e.postData.contents) : {};
    
    console.log('Received data:', JSON.stringify(data));
    
    const employeeEmail = data.employeeEmail || data.email;
    if (!employeeEmail) {
      return createCorsOutput({ success: false, error: 'No email provided' });
    }
    
    if (!AUTHORIZED_EMPLOYEES.includes(employeeEmail)) {
      return createCorsOutput({ success: false, error: 'Unauthorized' });
    }
    
    // Get or create sheet based on cluster and current date
    const cluster = data.cluster || 'UNCLUSTERED';
    const sheet = getOrCreateAttendanceSheet(cluster, new Date());
    
    const clientName = data.clientName || data.pusName || 'N/A';
    let clientId = data.clientId || data.pusId || '';
    
    // Use data.age directly from client (already calculated by frontend)
    const calculatedAge = data.age || '';
    
    console.log(`Age from client for ${clientName}: ${calculatedAge}`);
    
    // Correct column order - AGE at the end (column 15)
    const row = [
      new Date(),                          // 1. Timestamp
      clientId || 'N/A',                   // 2. Docket Number
      clientName,                          // 3. NAME OF CLIENT
      data.gender || 'N/A',               // 4. GENDER
      data.offenseCategory || 'N/A',      // 5. OFFENSE CATEGORY
      data.caseNumber || 'N/A',           // 6. CRIMINAL CASE NUMBER
      data.address || 'N/A',              // 7. ADDRESS
      data.startDate || 'N/A',            // 8. START DATE
      data.endDate || 'N/A',              // 9. END DATE
      data.supervisingOfficer || 'N/A',   // 10. SUPERVISING OFFICER
      data.cluster || 'N/A',              // 11. CLUSTER
      data.remarks || 'N/A',              // 12. REMARKS
      data.familySupport || 'N/A',        // 13. FAMILY SUPPORT
      data.notes || '',                   // 14. NOTES
      employeeEmail,                      // 15. EMAIL
      calculatedAge                       // 16. AGE (at the end)
    ];
    
    sheet.appendRow(row);
    console.log(`✅ Row added to sheet: ${sheet.getSheetName()} at row ${sheet.getLastRow()}`);
    
    sendAttendanceNotification(data, clientName, clientId, calculatedAge);
    // updateSupervisionTracking returns the docket number actually used
    // (either the one supplied, or a freshly generated random one).
    const docketNumber = updateSupervisionTracking(data, clientName, clientId, calculatedAge);
    
    return createCorsOutput({ 
      success: true, 
      row: sheet.getLastRow(), 
      sheet: sheet.getSheetName(),
      docketNumber: docketNumber,
      message: 'Attendance recorded successfully'
    });
    
  } catch(err) {
    console.error('Error in doPost:', err);
    return createCorsOutput({ success: false, error: err.toString() });
  }
}

// ============================================
// doGet – FETCH PUS DATA FROM QR (OPTIONAL - NOT ACTIVELY USED)
// NOTE: The frontend attendance.js handles QR parsing locally
// This endpoint is kept for backward compatibility
// ============================================
function doGet(e) {
  try {
    const qrData = e.parameter.qr || e.parameter.pusId || e.parameter.clientId;
    const employeeEmail = e.parameter.email;
    
    if (!AUTHORIZED_EMPLOYEES.includes(employeeEmail)) {
      return createCorsOutput({ success: false, error: 'Unauthorized' });
    }
    
    if (!qrData) {
      return createCorsOutput({ success: false, error: 'No QR data' });
    }
    
    let clientData;
    try { 
      clientData = JSON.parse(qrData); 
    } catch(parseErr) { 
      return createCorsOutput({ success: false, error: 'Invalid QR code' }); 
    }
    
    const calculatedAge = calculateAgeFromDOB(clientData.dateOfBirth);
    
    return createCorsOutput({
      success: true,
      client: {
        clientName: clientData.pusName || clientData.clientName,
        clientId: clientData.pusId || clientData.clientId,
        gender: clientData.gender,
        age: calculatedAge,
        offenseCategory: clientData.offenseCategory,
        caseNumber: clientData.caseNumber,
        address: clientData.address,
        startDate: clientData.startDate,
        endDate: clientData.endDate,
        supervisingOfficer: clientData.supervisingOfficer,
        cluster: clientData.cluster
      }
    });
  } catch(err) {
    return createCorsOutput({ success: false, error: err.toString() });
  }
}

// ============================================
// TEST FUNCTIONS
// ============================================
function testWrite() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getOrCreateAttendanceSheet('IRIGA', new Date());
  
  sheet.appendRow([
    new Date(),
    'TEST-DOCKET-0001',
    'TEST – Works!',
    'Male',
    'Drug Offense',
    'RTC-2024-00123',
    '123 Test St., Iriga City',
    '2024-01-01',
    '2024-12-31',
    'SSPO JANET B. PAVIA',
    'IRIGA',
    'Test',
    'Yes',
    'Test row',
    'test@example.com',
    '34'
  ]);
  
  return `✅ Test row added to sheet: ${sheet.getSheetName()}`;
}

// ============================================
// FIXED: testAgeCalculation with correct year threshold
// ============================================
function testAgeCalculation() {
  // Test with MM/DD/YY format - year threshold
  // Years 00-29 = 2000s, Years 30-99 = 1900s
  const testDOB1 = "05/15/90";  // 1990 -> age ~34-35
  const age1 = calculateAgeFromDOB(testDOB1);
  console.log(`DOB: ${testDOB1} -> Year: 1990, Age: ${age1}`);
  
  const testDOB2 = "01/01/05";  // 2005 -> age ~19-20
  const age2 = calculateAgeFromDOB(testDOB2);
  console.log(`DOB: ${testDOB2} -> Year: 2005, Age: ${age2}`);
  
  // FIXED: 12/25/26 -> year 26 is < 30, so it becomes 2026, NOT 1926
  const testDOB3 = "12/25/26";  // 2026 -> age ~0-1 (not born yet in 1926)
  const age3 = calculateAgeFromDOB(testDOB3);
  console.log(`DOB: ${testDOB3} -> Year: 2026, Age: ${age3}`);
  
  // Test with YYYY-MM-DD format
  const testDOB4 = "1990-05-15";
  const age4 = calculateAgeFromDOB(testDOB4);
  console.log(`DOB: ${testDOB4} -> Age: ${age4}`);
  
  // Test with boundary year 29 -> 2029
  const testDOB5 = "12/25/29";
  const age5 = calculateAgeFromDOB(testDOB5);
  console.log(`DOB: ${testDOB5} -> Year: 2029, Age: ${age5}`);
  
  // Test with boundary year 30 -> 1930
  const testDOB6 = "12/25/30";
  const age6 = calculateAgeFromDOB(testDOB6);
  console.log(`DOB: ${testDOB6} -> Year: 1930, Age: ${age6}`);
  
  return { age1, age2, age3, age4, age5, age6 };
}

function testDateParsing() {
  // Test year threshold in parseDate
  const testDate1 = "05/15/90";
  const result1 = calculateTimeRemaining(testDate1);
  console.log(`Date: ${testDate1} -> Days remaining: ${result1.days}`);
  
  const testDate2 = "01/01/05";
  const result2 = calculateTimeRemaining(testDate2);
  console.log(`Date: ${testDate2} -> Days remaining: ${result2.days}`);
  
  const testDate3 = "12/25/26";
  const result3 = calculateTimeRemaining(testDate3);
  console.log(`Date: ${testDate3} -> Days remaining: ${result3.days}`);
  
  return { result1, result2, result3 };
}
