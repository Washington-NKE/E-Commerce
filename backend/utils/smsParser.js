// backend/utils/smsParser.js
export const parseMpesaSms = (smsBody) => {
    try {
       // console.log('Parsing SMS:', smsBody);
        
        // First check if this is a "received" payment message
        if (!smsBody.toLowerCase().includes('you have received')) {
            console.log('SMS is not a received payment message, skipping');
            return null;
        }
        
        // Handle both SMS formats
        const transIdMatch = smsBody.match(/^([A-Z0-9]+)\s+Confirmed/);
        
        // Updated amount regex to handle both formats
        const amountMatch = smsBody.match(/Ksh([\d,]+\.?\d*)/);
        
        // Updated name regex to handle your specific format: "from AIRTEL MONEY - washington mwangi 738100687"
        const nameMatch = smsBody.match(/from\s+(?:AIRTEL\s+MONEY\s*-\s*)?([A-Za-z\s]+?)\s+(\d{9})/i);
        
        // Updated phone regex to handle 9-digit numbers (will add 254 prefix)
        const phoneMatch = smsBody.match(/([A-Za-z\s]+)\s+(\d{9})/i);
        
        // Updated date regex
        const dateMatch = smsBody.match(/on\s+(\d{1,2}\/\d{1,2}\/\d{2,4})\s+at\s+([\d:]+\s+[AP]M)/i);
        
        // Updated balance regex to handle both formats
        const balanceMatch = smsBody.match(/(?:New\s+(?:M-PESA|Acc)\s+balance|balance)\s+is\s+Ksh([\d,]+\.?\d*)/i);
        
        if (!transIdMatch || !amountMatch) {
            throw new Error('Invalid SMS format - missing transaction ID or amount');
        }
        
        const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
        const transId = transIdMatch[1];
        
        // Extract customer name and phone
        let customerName = '';
        let phone = '';
        
        if (nameMatch) {
            customerName = nameMatch[1].trim();
            phone = nameMatch[2]; // Get phone from name match
        }
        
        // Ensure phone number has country code
        if (phone && phone.length === 9) {
            phone = '254' + phone;
        }
        
        // Parse date and time
        let transTime = new Date();
        if (dateMatch) {
            try {
                const [, datePart, timePart] = dateMatch;
                const [day, month, year] = datePart.split('/');
                
                // Handle both 2-digit and 4-digit years
                let fullYear = parseInt(year);
                if (fullYear < 100) {
                    fullYear = parseInt('20' + year);
                }
                
                // Convert 12-hour to 24-hour format
                let [time, meridiem] = timePart.split(' ');
                let [hours, minutes] = time.split(':');
                hours = parseInt(hours);
                
                if (meridiem.toUpperCase() === 'PM' && hours !== 12) hours += 12;
                if (meridiem.toUpperCase() === 'AM' && hours === 12) hours = 0;
                
                transTime = new Date(fullYear, parseInt(month) - 1, parseInt(day), hours, parseInt(minutes));
            } catch (dateError) {
                console.error('Date parsing error:', dateError);
                // Use current time if date parsing fails
                transTime = new Date();
            }
        }
        
        const parsedData = {
            TransactionType: "Pay Bill",
            TransID: transId,
            TransTime: transTime.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, ''),
            TransAmount: amount.toString(),
            BusinessShortCode: "5732804",
            MSISDN: phone,
            FirstName: customerName.split(' ')[0] || '',
            MiddleName: customerName.split(' ')[1] || '',
            LastName: customerName.split(' ').slice(2).join(' ') || '',
            BillRefNumber: "",
            InvoiceNumber: "",
            OrgAccountBalance: balanceMatch ? balanceMatch[1].replace(/,/g, '') : "0"
        };
        
        //console.log('Parsed SMS data:', parsedData);
        return parsedData;
        
    } catch (error) {
        console.error('Error parsing M-Pesa SMS:', error);
        console.error('SMS body was:', smsBody);
        return null;
    }
};