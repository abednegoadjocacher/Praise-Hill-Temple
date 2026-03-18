import { useState, useEffect } from 'react';
import { Download, Search, Trash2 , MessageSquare, UserPlus, Edit2, Save, X, CheckCircle, FileText, Eye } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Member, Transaction, PaymentForm } from '@/interface';

export default function FinancialRecordsEnhanced() {
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showBulkMessageModal, setShowBulkMessageModal] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);
  const [paymentFormId, setPaymentFormId] = useState<number | null>(null);
  const [selectedMessage, setSelectedMessage] = useState('');
  const [selectedPhone, setSelectedPhone] = useState('');
  const [visibleTransactions, setVisibleTransactions] = useState(6);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>('All');
  const [monthFilter, setMonthFilter] = useState<string>('All');
  const [yearFilter, setYearFilter] = useState<string>('All');
  
  // Transaction History filters
  const [transactionYearFilter, setTransactionYearFilter] = useState<string>('All');
  const [transactionMonthFilter, setTransactionMonthFilter] = useState<string>('All');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string>('All');

  // Track which transactions have had messages sent
  const [sentMessageTransactionIds, setSentMessageTransactionIds] = useState<Set<number>>(new Set());
  const [currentTransactionId, setCurrentTransactionId] = useState<number | null>(null);

  const [newMember, setNewMember] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    phone: '',
    firstFruitNumber: '',
  });

  const [paymentForm, setPaymentForm] = useState<PaymentForm>({
    memberId: 0,
    type: 'First Fruit',
    amount: '',
    method: 'MoMo',
    month: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    paymentDate: new Date().toISOString().split('T')[0],
  });

  const [members, setMembers] = useState<Member[]>([]);
  const [editForm, setEditForm] = useState<Member | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Reset filters when changing year
  useEffect(() => {
    setMonthFilter('All');
  }, [yearFilter]);

  useEffect(() => {
    setTransactionMonthFilter('All');
  }, [transactionYearFilter]);

  // Reset all filters when selecting a different member
  useEffect(() => {
    if (selectedMemberId) {
      setPaymentTypeFilter('All');
      setMonthFilter('All');
      setYearFilter('All');
    }
  }, [selectedMemberId]);

  useEffect(() => {
  const loadInitialData = async () => {
    setIsLoading(true); // Ensure spinner starts
    try {
      // Promise.all runs both fetches at the same time for better speed
      await Promise.all([
        fetchMembers(),
        fetchTransactions()
      ]);
    } catch (error) {
      console.error("Initialization error:", error);
    } finally {
      setIsLoading(false); // Data is ready, turn off spinner
    }
  };

  loadInitialData();
}, []);

  const fetchMembers = async () => {
  const response = await fetch('/api/members');
  if (!response.ok) throw new Error('Failed to fetch members');
  const data = await response.json();
  setMembers(data);
};

const fetchTransactions = async () => {
  const response = await fetch('/api/transactions');
  if (!response.ok) throw new Error('Failed to fetch transactions');
  const data = await response.json();
  
  const cleanData = data.map((tx: any) => ({
    ...tx,
    amount: Number(tx.amount || 0),
    memberId: Number(tx.member_id)
  }));
  
  setTransactions(cleanData);
};

// 1. ADD NEW MEMBER
const handleAddMember = async () => {
  // 1. Validation
  if (!newMember.firstName || !newMember.lastName || !newMember.phone) {
    alert('Please fill in required fields');
    return;
  }

  const phoneDigits = newMember.phone.replace(/\D/g, '');
  if (phoneDigits.length !== 10) {
    alert('Phone number must be exactly 10 digits');
    return;
  }

  // 2. START LOADING HERE
  setIsAddingMember(true); 

  try {
    const response = await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newMember, phone: phoneDigits }),
    });

    if (response.ok) {
      await fetchMembers(); 
      setNewMember({ firstName: '', middleName: '', lastName: '', phone: '', firstFruitNumber: '' });
      setShowMemberModal(false);
      
      // Delay the alert slightly so it doesn't "freeze" the spinner instantly
      setTimeout(() => alert('Member added successfully!'), 100);
    } else {
      alert('Failed to save to database');
    }
  } catch (error) {
    console.error(error);
    alert('Error saving to database');
  } finally {
    // 3. STOP LOADING
    setIsAddingMember(false); 
  }
};

const handleSaveMember = async () => {
  if (!editForm) return;

  // 1. Validate phone before starting the "loading" animation
  const phoneDigits = editForm.phone.replace(/\D/g, '');
  if (phoneDigits.length !== 10) {
    alert('Phone number must be exactly 10 digits');
    return;
  }

  // 2. Start Loading
  setIsSubmitting(true);

  try {
    const response = await fetch('/api/members', {
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editForm, phone: phoneDigits }),
    });

    if (response.ok) {
      await fetchMembers(); 
      setEditingMemberId(null);
      setEditForm(null);
      
      // Delay alert so it doesn't freeze the UI instantly
      setTimeout(() => alert('Member updated successfully!'), 100);
    } else {
      alert('Error: Could not update member');
    }
  } catch (error) {
    alert('Error updating database');
  } finally {
    // 3. Stop Loading (this ensures the button resets even on error)
    setIsSubmitting(false);
  }
};

const handleDeleteMember = async (id: number) => {
  if (!confirm('Are you sure you want to delete this member? This action cannot be undone.')) {
    return;
  }

  try {
    const response = await fetch(`/api/members?id=${id}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      await fetchMembers(); // Refresh the list
      alert('Member removed from database.');
    }
  } catch (error) {
    alert('Could not delete member.');
  }
};

const handleCancelEdit = () => {
  setEditingMemberId(null);
  setEditForm(null);
};

const handleEditMember = (member: Member) => {
  setEditingMemberId(member.id);
  setEditForm({ ...member });
};
  const generateMessage = (transaction: Transaction) => {
    return `Dear ${transaction.member},\n\nThank you for your ${transaction.type} contribution of GHS ${transaction.amount} for the month of ${transaction.month}.\n\nYour support is greatly appreciated and helps us continue our mission.\n\nPayment Method: ${transaction.method}\nDate: ${transaction.date} at ${transaction.time}\n\nGod bless you!\n\nChurch Administration`;
  };

  const handleSendMessage = (transaction: Transaction) => {
    const message = generateMessage(transaction);
    setSelectedMessage(message);
    setSelectedPhone(transaction.phone);
    setCurrentTransactionId(transaction.id);
    setShowMessageModal(true);
  };

const handleConfirmSendMessage = async () => {
  // 1. Prepare the phone number for Arkesel (233 format)
  let formattedPhone = selectedPhone.trim().replace('+', '');
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '233' + formattedPhone.substring(1);
  }

  // 3. START LOADING HERE
  setIsSendingMessage(true);

  try {
    // 2. Send data to your Next.js Backend
    const response = await fetch('/api/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: formattedPhone,
        messageBody: selectedMessage,
      }),
    });

    const data = await response.json();

    if (data.success) {
      // 3. SUCCESS: Update UI state as you did before
      if (currentTransactionId !== null) {
        setSentMessageTransactionIds((prev) => 
          new Set(prev).add(currentTransactionId)
        );
      }
      // We wait a second before showing the success message
      setTimeout(() => {
        alert(`Message successfully sent to ${selectedPhone}!`);
        setShowMessageModal(false);
      }, 100);
      
    } else {
      // 4. API ERROR (e.g., Insufficient balance)
      console.error('Arkesel Error:', data);
      alert(`Failed to send: ${data.error || 'Unknown error'}`);
    }

  } catch (error) {
    // 5. NETWORK ERROR
    console.error('Network Request Failed:', error);
    alert('Network error. Please check your internet connection.');
  } finally {
    // 6. STOP LOADING
    setIsSendingMessage(false);
  }
};

 const handleSendMessageToAll = () => {
    setShowBulkMessageModal(true);
  };


const handleConfirmSendMessageToAll = async () => {
  const filteredTransactions = getFilteredTransactions();
  
  if (filteredTransactions.length === 0) {
    alert("No members found.");
    return;
  }

  const confirmBulk = window.confirm(`Send SMS to all ${filteredTransactions.length} member(s)?`);
  if (!confirmBulk) return;

  setIsSendingMessage(true); 

  try {
    // 1. Map each transaction to a Fetch Promise (firing them all at once)
    const sendPromises = filteredTransactions.map(async (transaction) => {
      let formattedPhone = transaction.phone.trim().replace('+', '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '233' + formattedPhone.substring(1);
      }

      const messageBody = generateMessage(transaction);

      try {
        const response = await fetch('/api/send-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: formattedPhone,
            messageBody: messageBody,
          }),
        });

        if (response.ok) {
          // Update UI checkmark immediately as each one finishes
          setSentMessageTransactionIds((prev) => new Set(prev).add(transaction.id));
          return { success: true };
        }
        return { success: false };
      } catch (err) {
        return { success: false };
      }
    });

    // 2. Wait for all requests to finish in parallel
    const results = await Promise.all(sendPromises);

    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    // 3. Close modal and alert
    setShowBulkMessageModal(false); 

    setTimeout(() => {
      alert(`Bulk Sending Complete!\n✅ Success: ${successCount}\n❌ Failed: ${failCount}`);
    }, 100);

  } catch (globalError) {
    alert('An unexpected error occurred.');
  } finally {
    setIsSendingMessage(false);
  }
};

//This send the message one after the order whiles waiting small inntervals before the next one.
// const handleConfirmSendMessageToAll = async () => {
//   const filteredTransactions = getFilteredTransactions();
  
//   if (filteredTransactions.length === 0) {
//     alert("No members found in the current filtered list.");
//     return;
//   }

//   const confirmBulk = window.confirm(`Are you sure you want to send SMS to ${filteredTransactions.length} member(s)?`);
//   if (!confirmBulk) return;

//   // 1. START LOADING
//   setIsSendingMessage(true); 

//   let successCount = 0;
//   let failCount = 0;

//   try {
//     // 2. LOOP through each transaction and send the SMS
//     for (const transaction of filteredTransactions) {
//       // Prepare phone number (233 format)
//       let formattedPhone = transaction.phone.trim().replace('+', '');
//       if (formattedPhone.startsWith('0')) {
//         formattedPhone = '233' + formattedPhone.substring(1);
//       }

//       // Generate the personalized message for this specific member
//       const messageBody = generateMessage(transaction);
//       await new Promise(resolve => setTimeout(resolve, 300));

//       try {
//         const response = await fetch('/api/send-sms', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({
//             phoneNumber: formattedPhone,
//             messageBody: messageBody,
//           }),
//         });

//         const data = await response.json();

//         if (data.success) {
//           successCount++;
//           // Update the checkmark in the UI for this specific transaction
//           setSentMessageTransactionIds((prev) => new Set(prev).add(transaction.id));
//         } else {
//           console.error(`Arkesel Error for ${transaction.member}:`, data.error);
//           failCount++;
//         }
//       } catch (err) {
//         console.error(`Network Error for ${transaction.member}:`, err);
//         failCount++;
//       }
//     }
//     setShowBulkMessageModal(false)
//     // setTimeout(() => {
//     //   alert(`Bulk Sending Complete!\n✅ Success: ${successCount}\n❌ Failed: ${failCount}`);
//     // }, 100);
//     // 3. FINAL FEEDBACK
//     alert(`Bulk Sending Complete!\n✅ Success: ${successCount}\n❌ Failed: ${failCount}`);
//     setShowBulkMessageModal(false);

//   } catch (globalError) {
//     console.error('Bulk sending failed:', globalError);
//     alert('An unexpected error occurred during bulk sending.');
//   } finally {
//     // 4. STOP LOADING
//     setIsSendingMessage(false);
//   }
// };

//Commenting this function because it is just for ui.
/*
 
  const handleConfirmSendMessageToAll = () => {
    const filteredTransactions = getFilteredTransactions();
    
    // Mark all filtered transactions as having messages sent
    const allTransactionIds = filteredTransactions.map(t => t.id);
    setSentMessageTransactionIds(prev => {
      const newSet = new Set(prev);
      allTransactionIds.forEach(id => newSet.add(id));
      return newSet;
    });
    
    // Log for demo purposes
    console.log(`Sending messages to ${filteredTransactions.length} members`);
    filteredTransactions.forEach(t => {
      console.log(`Sending to ${t.member} (${t.phone}): Thank you for your ${t.type} contribution of $${t.amount}`);
    });
    
    alert(`Messages sent successfully to ${filteredTransactions.length} member(s)!`);
    setShowBulkMessageModal(false);
  };
  */

  const handlePaymentFormChange = (key: keyof PaymentForm, value: string | number) => {
  setPaymentForm({ ...paymentForm, [key]: value });
};

  const handlePaymentFormSubmit = async () => {
  // 1. Validation
  if (!paymentForm.memberId || !paymentForm.amount || !paymentForm.paymentDate) {
    alert('Please fill in required fields: Member, Amount, and Payment Date');
    return;
  }
  setIsSubmitting(true);

  // 2. Find the member details to create the transaction record
  const member = members.find(m => m.id === paymentForm.memberId);
  if (!member) {
    alert("Member not found");
    return;
  }

  // 3. Prepare the object for MySQL
  const transactionData = {
    memberId: member.id,
    date: new Date().toISOString().split('T')[0], // Today's entry date
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    member: `${member.firstName} ${member.lastName}`,
    phone: member.phone,
    type: paymentForm.type,
    amount: parseFloat(paymentForm.amount.toString()),
    method: paymentForm.method,
    status: 'Completed',
    month: paymentForm.month,
    paymentDate: paymentForm.paymentDate,
  };

  try {
    // 4. Send to the API
    const response = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transactionData),
    });

    if (response.ok) {
      // 5. Success Actions
      await fetchTransactions(); // Refresh your table from DB
      setPaymentFormId(null);    // Close the modal
      
      // Reset form to defaults
      setPaymentForm({ 
        memberId: 0, 
        type: 'First Fruit', 
        amount: '', 
        method: 'MoMo', 
        month: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
        paymentDate: new Date().toISOString().split('T')[0],
      });
      
      alert('Transaction recorded successfully!');
    } else {
      alert('Server error: Could not save transaction');
    }
  } catch (error) {
    console.error("Payment submission error:", error);
    alert('Network error: Check your database connection');
  } finally {
    setIsSubmitting(false); // Stop Loading (even if it fails)
  }
};

  const getMemberTransactions = (memberId: number) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return [];
    
    const memberName = `${member.firstName} ${member.lastName}`;
    let filtered = transactions.filter(t => t.member === memberName);
    
    // Apply payment type filter
    if (paymentTypeFilter !== 'All') {
      filtered = filtered.filter(t => t.type === paymentTypeFilter);
    }
    
    // Apply year filter first
    if (yearFilter !== 'All') {
      filtered = filtered.filter(t => {
        const paymentYear = new Date(t.paymentDate).getFullYear().toString();
        return paymentYear === yearFilter;
      });
    }
    
    // Apply month filter (works with year filter)
    if (monthFilter !== 'All') {
      filtered = filtered.filter(t => {
        const paymentDate = new Date(t.paymentDate);
        const monthName = paymentDate.toLocaleString('en-US', { month: 'long' });
        return monthName === monthFilter;
      });
    }
    
    return filtered;
  };

  const getMemberTotal = (memberId: number) => {
    const memberTransactions = getMemberTransactions(memberId);
    return memberTransactions.reduce((sum, t) => sum + t.amount, 0);
  };

  // Static year options for filter
  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = ['All'];
    for (let year = currentYear - 5; year <= currentYear + 5; year++) {
      years.push(year.toString());
    }
    return years;
  };

  // Static month options for filter
  const getMonthOptions = () => {
    return [
      'All',
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ];
  };

  // Get unique payment types from member transactions for filter
  const getUniquePaymentTypes = (memberId: number |null) => {
    if (memberId === null) return [];

    const member = members.find(m => m.id === memberId);
    if (!member) return [];
    
    const memberName = `${member.firstName} ${member.lastName}`;
    const memberTransactions = transactions.filter(t => t.member === memberName);
    const types = memberTransactions.map(t => t.type);
    return ['All', ...Array.from(new Set(types))];
  };

  // Filter transactions for Transaction History section
  const getFilteredTransactions = () => {
    let filtered = [...transactions];
    
    // Apply year filter
    if (transactionYearFilter !== 'All') {
      filtered = filtered.filter(t => {
        const paymentYear = new Date(t.paymentDate).getFullYear().toString();
        return paymentYear === transactionYearFilter;
      });
    }
    
    // Apply month filter
    if (transactionMonthFilter !== 'All') {
      filtered = filtered.filter(t => {
        const paymentDate = new Date(t.paymentDate);
        const monthName = paymentDate.toLocaleString('en-US', { month: 'long' });
        return monthName === transactionMonthFilter;
      });
    }
    
    // Apply type filter
    if (transactionTypeFilter !== 'All') {
      filtered = filtered.filter(t => t.type === transactionTypeFilter);
    }
    
    return filtered;
  };

  // Get total contributions from filtered transactions
  const getFilteredTotal = () => {
    const filtered = getFilteredTransactions();
    return filtered.reduce((sum, t) => sum + t.amount, 0);
  };

  // Get breakdown by payment type from filtered transactions
  const getFilteredBreakdown = () => {
    const filtered = getFilteredTransactions();
    const breakdown: { [key: string]: { total: number; count: number } } = {};
    
    filtered.forEach(t => {
      if (!breakdown[t.type]) {
        breakdown[t.type] = { total: 0, count: 0 };
      }
      breakdown[t.type].total += t.amount;
      breakdown[t.type].count += 1;
    });
    
    return breakdown;
  };

  // Get sorted breakdown entries in a consistent order
  const getSortedBreakdown = () => {
    const breakdown = getFilteredBreakdown();
    const order = ['First Fruit', 'Welfare'];
    
    // Sort entries based on predefined order
    const sortedEntries = Object.entries(breakdown).sort((a, b) => {
      const indexA = order.indexOf(a[0]);
      const indexB = order.indexOf(b[0]);
      
      // If both types are in the order array, sort by their position
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      // If only one is in the order array, prioritize it
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      // If neither is in the order array, sort alphabetically
      return a[0].localeCompare(b[0]);
    });
    
    return sortedEntries;
  };

  const downloadMemberReport = (memberId: number) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;

    const memberTransactions = getMemberTransactions(memberId);
    const memberName = `${member.firstName} ${member.lastName}`;

    // Group transactions by month and payment type
    const monthlyData: { [key: string]: { [month: string]: number } } = {};
    
    memberTransactions.forEach(t => {
      if (!monthlyData[t.type]) {
        monthlyData[t.type] = {};
      }
      const paymentDate = new Date(t.paymentDate);
      const monthIndex = paymentDate.getMonth();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthKey = months[monthIndex];
      
      if (!monthlyData[t.type][monthKey]) {
        monthlyData[t.type][monthKey] = 0;
      }
      monthlyData[t.type][monthKey] += t.amount;
    });

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Create individual sheets for each payment type
    Object.keys(monthlyData).forEach(paymentType => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      const reportData = [
        ['Church logo', 'ICGC-PHT'],
        ['First fruit number', ''],
        ['Telephone number', ''],
        ['Name', memberName],
        ['Month', 'Amount'],
      ];

      let total = 0;
      months.forEach(month => {
        const amount = monthlyData[paymentType][month] || 0;
        total += amount;
        reportData.push([month, amount.toFixed(2)]);
      });

      reportData.push(['', total.toFixed(2)]);

      const ws = XLSX.utils.aoa_to_sheet(reportData);

      // Set column widths
      ws['!cols'] = [
        { wch: 20 },
        { wch: 15 },
      ];

      // Add cell styling and fill member details
      ws['A1'] = { v: 'Church logo', t: 's', s: { fill: { fgColor: { rgb: 'A4D96C' } } } };
      ws['B1'] = { v: 'ICGC-PHT', t: 's' };
      ws['B2'] = { v: member.firstFruitNumber || '', t: 's' };
      ws['B3'] = { v: member.phone, t: 's' };

      XLSX.utils.book_append_sheet(wb, ws, paymentType);
    });

    // If member has no transactions, create a blank template
    if (Object.keys(monthlyData).length === 0) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      const reportData = [
        ['Church logo', 'ICGC-PHT'],
        ['First fruit number', ''],
        ['Telephone number', ''],
        ['Name', memberName],
        ['Month', 'Amount'],
      ];

      months.forEach(month => {
        reportData.push([month, '0.00']);
      });

      reportData.push(['', '0.00']);

      const ws = XLSX.utils.aoa_to_sheet(reportData);
      ws['!cols'] = [{ wch: 20 }, { wch: 15 }];

      // Add cell styling and fill member details
      ws['A1'] = { v: 'Church logo', t: 's', s: { fill: { fgColor: { rgb: 'A4D96C' } } } };
      ws['B1'] = { v: 'ICGC-PHT', t: 's' };
      ws['B2'] = { v: member.firstFruitNumber || '', t: 's' };
      ws['B3'] = { v: member.phone, t: 's' };

      XLSX.utils.book_append_sheet(wb, ws, 'No Data');
    }

    // Download file
    XLSX.writeFile(wb, `${memberName.replace(/\s+/g, '_')}_Payment_History.xlsx`);
  };

  // Export Transaction History Report
  const exportTransactionHistory = () => {
    const filtered = getFilteredTransactions();
    
    // Group transactions by member and month
    const memberData: { 
      [memberName: string]: { 
        phone: string; 
        firstFruitNumber: string;
        months: { [month: string]: number };
        total: number;
      } 
    } = {};
    
    const monthTotals: { [month: string]: number } = {};
    const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize month totals
    allMonths.forEach(month => {
      monthTotals[month] = 0;
    });
    
    // Process each transaction
    filtered.forEach(t => {
      const member = members.find(m => `${m.firstName} ${m.lastName}` === t.member);
      const memberName = t.member;
      const paymentDate = new Date(t.paymentDate);
      const monthIndex = paymentDate.getMonth();
      const monthName = allMonths[monthIndex];
      
      if (!memberData[memberName]) {
        memberData[memberName] = {
          phone: t.phone,
          firstFruitNumber: member?.firstFruitNumber || 'N/A',
          months: {},
          total: 0
        };
        allMonths.forEach(m => {
          memberData[memberName].months[m] = 0;
        });
      }
      
      memberData[memberName].months[monthName] += t.amount;
      memberData[memberName].total += t.amount;
      monthTotals[monthName] += t.amount;
    });
    
    // Create Excel data structure
    const excelData = [];
    
    // Header row 1
    const headerRow1 = ['Church logo', 'Church name', 'Month', ...allMonths, 'Total'];
    excelData.push(headerRow1);
    
    // Header row 2
    const headerRow2 = ['Name', 'First fruit number', 'Contact number', ...Array(allMonths.length).fill(''), ''];
    excelData.push(headerRow2);
    
    // Member data rows
    Object.keys(memberData).sort().forEach(memberName => {
      const data = memberData[memberName];
      const row = [
        memberName,
        data.firstFruitNumber,
        data.phone,
        ...allMonths.map(month => data.months[month] || 0),
        data.total
      ];
      excelData.push(row);
    });
    
    // Totals row
    const totalsRow = [
      '', '', '',
      ...allMonths.map(month => monthTotals[month]),
      Object.values(memberData).reduce((sum, data) => sum + data.total, 0)
    ];
    excelData.push(totalsRow);
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, // Name
      { wch: 18 }, // First fruit number
      { wch: 15 }, // Contact number
      ...allMonths.map(() => ({ wch: 10 })), // Month columns
      { wch: 12 }  // Total
    ];
    
    // Merge cells for header
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }, // Merge "Church logo" and "Church name"
    ];
    
    // Generate filename based on filters
    let filename = 'Transaction_History';
    if (transactionTypeFilter !== 'All') {
      filename += `_${transactionTypeFilter.replace(/\s+/g, '_')}`;
    }
    if (transactionYearFilter !== 'All') {
      filename += `_${transactionYearFilter}`;
    }
    if (transactionMonthFilter !== 'All') {
      filename += `_${transactionMonthFilter}`;
    }
    filename += '.xlsx';
    
    XLSX.utils.book_append_sheet(wb, ws, 'Transaction History');
    XLSX.writeFile(wb, filename);
  };

  const selectedMember = selectedMemberId ? members.find(m => m.id === selectedMemberId) : null;
  const selectedMemberTransactions = selectedMemberId ? getMemberTransactions(selectedMemberId) : [];
  const selectedMemberTotal = selectedMemberId ? getMemberTotal(selectedMemberId) : 0;


  if (isLoading) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="relative">
        {/* Outer ring */}
        <div className="w-12 h-12 border-4 border-blue-100 rounded-full"></div>
        {/* Spinning inner ring */}
        <div className="absolute top-0 left-0 w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p className="mt-4 text-gray-500 font-medium animate-pulse">
        Synchronizing financial records...
      </p>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24 lg:pb-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-gray-900 mb-2">Financial Records Overview</h1>
            <p className="text-gray-600">Comprehensive financial tracking and reports</p>
          </div>
          <button
            onClick={() => setShowMemberModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            Add New Member
          </button>
        </div>

        {/* Member Selection and Detail View */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-gray-900">Member Payment Details</h2>
              <p className="text-sm text-gray-600">Search for a member to view their contribution history</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Search Member</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  onFocus={() => setShowMemberDropdown(true)}
                  onBlur={() => setTimeout(() => setShowMemberDropdown(false), 200)}
                  placeholder="Type member name or phone number..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                />
                {showMemberDropdown && memberSearchQuery && (
                  <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-b-lg shadow-lg max-h-60 overflow-y-auto mt-1">
                    {members
                      .filter(member =>
                        member.firstName.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                        member.lastName.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                        member.phone.includes(memberSearchQuery)
                      )
                      .map(member => (
                        <div
                          key={member.id}
                          onClick={() => {
                            setSelectedMemberId(member.id);
                            setMemberSearchQuery(`${member.firstName} ${member.lastName}`);
                            setShowMemberDropdown(false);
                          }}
                          className="px-4 py-3 cursor-pointer hover:bg-green-50 border-b border-gray-100 last:border-b-0"
                        >
                          <p className="text-sm text-gray-900">{member.firstName} {member.lastName}</p>
                          <p className="text-xs text-gray-500">{member.phone}</p>
                        </div>
                      ))}
                    {members.filter(member =>
                      member.firstName.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                      member.lastName.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
                      member.phone.includes(memberSearchQuery)
                    ).length === 0 && (
                      <div className="px-4 py-3 text-sm text-gray-500 text-center">
                        No members found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {selectedMember && (
              <div className="flex items-end">
                <button
                  onClick={() => downloadMemberReport(selectedMemberId!)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Download Excel Report
                </button>
              </div>
            )}
          </div>

          {selectedMember && (
            <div className="border-t border-gray-200 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Member Name</p>
                  <p className="text-gray-900">{selectedMember.firstName} {selectedMember.lastName}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Phone Number</p>
                  <p className="text-gray-900">{selectedMember.phone}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">First Fruit Number</p>
                  <p className="text-gray-900">{selectedMember.firstFruitNumber || 'N/A'}</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 mb-6 text-white">
                <p className="text-sm text-green-100 mb-2">Total Contributions</p>
                <h2 className="text-4xl mb-1">Ghc {selectedMemberTotal.toFixed(2)}</h2>
                <p className="text-sm text-green-100">{selectedMemberTransactions.length} transactions</p>
              </div>

              {/* Filters - Always visible */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-gray-900">Payment History</h3>
                <div className="flex gap-3">
                  <select
                    value={paymentTypeFilter}
                    onChange={(e) => setPaymentTypeFilter(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                  >
                    {getUniquePaymentTypes(selectedMemberId).map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <select
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                  >
                    {getYearOptions().map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  <select
                    value={monthFilter}
                    onChange={(e) => setMonthFilter(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                  >
                    {getMonthOptions().map(month => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedMemberTransactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs text-gray-600 uppercase tracking-wider">
                          Payment Date
                        </th>
                        <th className="text-left px-4 py-3 text-xs text-gray-600 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="text-left px-4 py-3 text-xs text-gray-600 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="text-left px-4 py-3 text-xs text-gray-600 uppercase tracking-wider">
                          Method
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedMemberTransactions.map(transaction => (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{transaction.paymentDate}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex px-2 py-1 text-xs bg-green-50 text-green-700 rounded-full">
                              {transaction.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-900">Ghc {transaction.amount.toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{transaction.method}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 border border-gray-200 rounded-lg">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No transactions found</p>
                  <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
                </div>
              )}
            </div>
          )}
        </div>

        
        {/* Transaction List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-gray-900 mb-2">Transaction History</h2>
                  <p className="text-sm text-gray-600">Complete record of all financial activities</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={handleSendMessageToAll}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm w-fit"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Send Message to All
                  </button>
                  <button 
                    onClick={exportTransactionHistory}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm w-fit"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <select
                  value={transactionYearFilter}
                  onChange={(e) => setTransactionYearFilter(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                >
                  {getYearOptions().map(year => (
                    <option key={year} value={year}>{year === 'All' ? 'All Years' : year}</option>
                  ))}
                </select>
                <select
                  value={transactionMonthFilter}
                  onChange={(e) => setTransactionMonthFilter(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                >
                  {getMonthOptions().map(month => (
                    <option key={month} value={month}>{month === 'All' ? 'All Months' : month}</option>
                  ))}
                </select>
                <select
                  value={transactionTypeFilter}
                  onChange={(e) => setTransactionTypeFilter(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                >
                  <option value="All">All Types</option>
                  <option value="First Fruit">First Fruit</option>
                  <option value="Welfare">Welfare</option>
                </select>
              </div>
            </div>
          </div>

          {/* Church Total Contributions Statistics */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-br from-gray-50 to-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-gray-900">Overview Statistics</h3>
                <p className="text-sm text-gray-600">
                  {transactionTypeFilter !== 'All' ? `${transactionTypeFilter} - ` : ''}
                  {transactionYearFilter !== 'All' && transactionMonthFilter !== 'All' 
                    ? `${transactionMonthFilter} ${transactionYearFilter}` 
                    : transactionYearFilter !== 'All' 
                    ? `Year ${transactionYearFilter}` 
                    : transactionMonthFilter !== 'All'
                    ? `All ${transactionMonthFilter} months`
                    : 'All time'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Contributions Card */}
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-sm text-green-100">Total Contributions</p>
                </div>
                <h3 className="text-3xl mb-1">Ghc {getFilteredTotal()}</h3>
                <p className="text-xs text-green-100">{getFilteredTransactions().length} transactions</p>
              </div>

              {/* Breakdown by Type */}
              {getSortedBreakdown().map(([type, data], index) => {
                const colors = [
                  { bg: 'from-blue-500 to-blue-600', text: 'text-blue-100' },
                  { bg: 'from-purple-500 to-purple-600', text: 'text-purple-100' },
                  { bg: 'from-orange-500 to-orange-600', text: 'text-orange-100' },
                  { bg: 'from-pink-500 to-pink-600', text: 'text-pink-100' },
                ];
                const color = colors[index % colors.length];
                
                return (
                  <div key={type} className={`bg-gradient-to-br ${color.bg} rounded-xl p-4 text-white`}>
                    <p className={`text-sm ${color.text} mb-2`}>{type}</p>
                    <h3 className="text-2xl mb-1">Ghc {data.total}</h3>
                    <p className={`text-xs ${color.text}`}>{data.count} payment{data.count !== 1 ? 's' : ''}</p>
                  </div>
                );
              })}

              {getSortedBreakdown().length === 0 && (
                <div className="col-span-full text-center py-8 bg-white rounded-xl border border-gray-200">
                  <p className="text-gray-500">No transactions for the selected period</p>
                  <p className="text-sm text-gray-400 mt-1">Try selecting a different year or month</p>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs text-gray-600 uppercase tracking-wider">
                    Payment Date
                  </th>
                  <th className="text-left px-6 py-3 text-xs text-gray-600 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="text-left px-6 py-3 text-xs text-gray-600 uppercase tracking-wider">
                    Phone Number
                  </th>
                  <th className="text-left px-6 py-3 text-xs text-gray-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="text-left px-6 py-3 text-xs text-gray-600 uppercase tracking-wider">
                    Month
                  </th>
                  <th className="text-left px-6 py-3 text-xs text-gray-600 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="text-left px-6 py-3 text-xs text-gray-600 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="text-left px-6 py-3 text-xs text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {getFilteredTransactions().slice(0, visibleTransactions).map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{transaction.paymentDate}</td>
                    <td className="px-6 py-4 text-gray-900">{transaction.member}</td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{transaction.phone}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 text-xs bg-green-50 text-green-700 rounded-full">
                        {transaction.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{transaction.month}</td>
                    <td className="px-6 py-4 text-gray-900">Ghc {transaction.amount}</td>
                    <td className="px-6 py-4 text-gray-900">{transaction.method}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleSendMessage(transaction)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        <MessageSquare className="w-4 h-4" />
                        {sentMessageTransactionIds.has(transaction.id) ? 'Resend Message' : 'Send Message'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-gray-50 text-center">
            {visibleTransactions < getFilteredTransactions().length && (
              <button
                onClick={() => setVisibleTransactions(visibleTransactions + 6)}
                className="text-sm text-green-600 hover:text-green-700 cursor-pointer"
              >
                Load More Transactions
              </button>
            )}
            {visibleTransactions >= getFilteredTransactions().length && (
              <p className="text-sm text-gray-500">All transactions loaded</p>
            )}
          </div>
        </div>

        {/* Members Management Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-gray-900 mb-2">Member Management</h2>
            <p className="text-sm text-gray-600">View, edit member information, and record payments</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs text-gray-600 uppercase tracking-wider">
                    First Name
                  </th>
                  <th className="text-left px-6 py-3 text-xs text-gray-600 uppercase tracking-wider">
                    Middle Name
                  </th>
                  <th className="text-left px-6 py-3 text-xs text-gray-600 uppercase tracking-wider">
                    Last Name
                  </th>
                  <th className="text-left px-6 py-3 text-xs text-gray-600 uppercase tracking-wider">
                    Phone Number
                  </th>
                  <th className="text-left px-6 py-3 text-xs text-gray-600 uppercase tracking-wider">
                    First Fruit ID
                  </th>
                  <th className="text-left px-6 py-3 text-xs text-gray-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="text-left px-6 py-3 text-xs text-gray-600 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="text-left px-6 py-3 text-xs text-gray-600 uppercase tracking-wider">
                    Payment Date
                  </th>
                  <th className="text-left px-6 py-3 text-xs text-gray-600 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="text-left px-6 py-3 text-xs text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
              {Array.isArray(members) ? members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  {editingMemberId === member.id && editForm ? (
                    <>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={editForm.firstName}
                          onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                          className="max-w-40 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={editForm.middleName}
                          onChange={(e) => setEditForm({ ...editForm, middleName: e.target.value })}
                          className="max-w-40 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={editForm.lastName}
                          onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                          className="max-w-40 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={editForm.phone}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setEditForm({ ...editForm, phone: value });
                          }}
                          className="max-w-40 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          maxLength={10}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={editForm.firstFruitNumber || ''}
                          onChange={(e) => setEditForm({ ...editForm, firstFruitNumber: e.target.value })}
                          className="max-w-40 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </td>
                      {/* --- ADD THE TIMESTAMP HERE --- */}
                      <td className="px-6 py-4 text-sm text-gray-500 italic">
                        {member.updatedAt ? (
                          new Date(member.updatedAt).toLocaleString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        ) : (
                          "Never"
                        )}
                      </td>

                      <td className="px-6 py-4" colSpan={4}></td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                          onClick={handleSaveMember}
                          disabled={isSubmitting}
                          className={`px-4 py-2 rounded-lg text-white transition-colors flex items-center justify-center gap-2 ${
                            isSubmitting
                              ? 'bg-green-400 cursor-not-allowed'
                              : 'bg-green-500 hover:bg-green-600'
                          }`}
                        >
                          {isSubmitting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Saving...</span>
                            </>
                          ) : (
                            "Save Changes"
                          )}
                        </button>
                          <button
                            onClick={handleCancelEdit}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : paymentFormId === member.id ? (
                    <>
                      <td className="px-6 py-4 text-gray-900">{member.firstName}</td>
                      <td className="px-6 py-4 text-gray-900">{member.middleName}</td>
                      <td className="px-6 py-4 text-gray-900">{member.lastName}</td>
                      <td className="px-6 py-4 text-gray-600">{member.phone}</td>
                      <td className="px-6 py-4 text-gray-600">{member.firstFruitNumber || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <select
                          value={paymentForm.type}
                          onChange={(e) => handlePaymentFormChange('type', e.target.value)}
                          className="max-w-40 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                        >
                          <option value="First Fruit">First Fruit</option>
                          <option value="Welfare">Welfare</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          value={paymentForm.amount}
                          onChange={(e) => handlePaymentFormChange('amount', e.target.value)}
                          placeholder="0.00"
                          className="max-w-40 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="date"
                          value={paymentForm.paymentDate}
                          onChange={(e) => handlePaymentFormChange('paymentDate', e.target.value)}
                          className="max-w-40 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={paymentForm.method}
                          onChange={(e) => handlePaymentFormChange('method', e.target.value as 'MoMo' | 'Cash' | 'Bank')}
                          className="max-w-40 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                        >
                          <option value="MoMo">MoMo</option>
                          <option value="Cash">Cash</option>
                          <option value="Bank">Bank</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={handlePaymentFormSubmit}
                            disabled={isSubmitting}
                            className={`flex items-center gap-1 px-3 py-1.5 text-white rounded-lg transition-colors text-sm whitespace-nowrap ${
                              isSubmitting
                                ? 'bg-green-400 cursor-not-allowed'
                                : 'bg-green-500 hover:bg-green-600'
                            }`}
                          >
                            {isSubmitting ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Saving...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                Record
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setPaymentFormId(null);
                              setPaymentForm({ 
                                memberId: 0, 
                                type: 'First Fruit', 
                                amount: '', 
                                method: 'MoMo', 
                                month: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
                                paymentDate: new Date().toISOString().split('T')[0],
                              });
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 text-gray-900">{member.firstName}</td>
                      <td className="px-6 py-4 text-gray-900">{member.middleName}</td>
                      <td className="px-6 py-4 text-gray-900">{member.lastName}</td>
                      <td className="px-6 py-4 text-gray-600">{member.phone}</td>
                      <td className="px-6 py-4 text-gray-600">{member.firstFruitNumber || 'N/A'}</td>
                      <td className="px-6 py-4" colSpan={4}></td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditMember(member)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setPaymentFormId(member.id);
                              setPaymentForm({ 
                                ...paymentForm, 
                                memberId: member.id,
                                paymentDate: new Date().toISOString().split('T')[0],
                              });
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm whitespace-nowrap"
                          >
                            Add Payment
                          </button>
                          <button
                            onClick={() => handleDeleteMember(member.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              )) : null}
</tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-green-700 bg-opacity-50 flex justify-center overflow-y-auto p-2 py-10 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 h-fit my-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-gray-900">Add New Member</h2>
              <button
                onClick={() => setShowMemberModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newMember.firstName}
                  onChange={(e) => setNewMember({ ...newMember, firstName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Middle Name</label>
                <input
                  type="text"
                  value={newMember.middleName}
                  onChange={(e) => setNewMember({ ...newMember, middleName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newMember.lastName}
                  onChange={(e) => setNewMember({ ...newMember, lastName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newMember.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setNewMember({ ...newMember, phone: value });
                  }}
                  placeholder="10 digits"
                  maxLength={10}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">First Fruit Number</label>
                <input
                  type="text"
                  value={newMember.firstFruitNumber}
                  onChange={(e) => setNewMember({ ...newMember, firstFruitNumber: e.target.value })}
                  placeholder="e.g., FF007"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddMember}
                disabled={isAddingMember}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white font-medium w-full
                  ${isAddingMember ? 'bg-green-400 cursor-not-allowed' : 'bg-green-500 hover:bg-gregreen00'}`}
                >
                {isAddingMember ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Adding Member...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Add Member
                  </>
                )}
              </button>
              <button
                onClick={() => setShowMemberModal(false)}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-green-700 bg-opacity-50 flex justify-center overflow-y-auto p-2 py-10 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 h-fit my-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-gray-900">Send Message</h2>
              <button
                onClick={() => setShowMessageModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Phone Number</label>
                <input
                  type="text"
                  value={selectedPhone}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Message</label>
                <textarea
                  value={selectedMessage}
                  onChange={(e) => setSelectedMessage(e.target.value)}
                  rows={10}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleConfirmSendMessage}
                disabled={isSendingMessage}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  isSendingMessage 
                    ? 'bg-green-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isSendingMessage ? (
                  <>
                    {/* This is a simple CSS spinner */}
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Sending...</span>
                  </>
                ) : (
                  "Send Message"
                )}
              </button>
              <button
                onClick={() => setShowMessageModal(false)}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Message Modal */}
      {showBulkMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-gray-900">Send Message to All Members</h2>
              <button
                onClick={() => setShowBulkMessageModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-900 mb-2">
                    You are about to send messages to <span className="font-semibold">{getFilteredTransactions().length} member(s)</span>.
                  </p>
                  <p className="text-sm text-gray-600">
                    Each member will receive a personalized thank you message for their contribution.
                  </p>
                  {(transactionYearFilter !== 'All' || transactionMonthFilter !== 'All' || transactionTypeFilter !== 'All') && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <p className="text-xs text-gray-700 font-semibold mb-1">Active Filters:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {transactionTypeFilter !== 'All' && (
                          <li>• Type: {transactionTypeFilter}</li>
                        )}
                        {transactionYearFilter !== 'All' && (
                          <li>• Year: {transactionYearFilter}</li>
                        )}
                        {transactionMonthFilter !== 'All' && (
                          <li>• Month: {transactionMonthFilter}</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
             <button
              onClick={handleConfirmSendMessageToAll}
              disabled={isSendingMessage}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              > 
              {isSendingMessage ? (
              <>
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Sending Messages...
              </>
              ) : (
              "Confirm & Send"
              )}
            </button>
              <button
                onClick={() => setShowBulkMessageModal(false)}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}