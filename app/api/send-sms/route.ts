import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // To test for missing env vars during development
  // console.log(`API Key Check: ${process.env.ARKESEL_API_KEY ? "Loaded" : "MISSING"}`);
  // console.log(`Sender ID Check: ${process.env.ARKESEL_SENDER_ID ? "Loaded" : "MISSING"}`);
  try {
    const { phoneNumber, messageBody } = await request.json();

    if (!phoneNumber || !messageBody) {
      return NextResponse.json({ success: false, error: 'Missing data' }, { status: 400 });
    }

    // Arkesel requires the number format: 233xxxxxxxxx (No '+')
    // We ensure the number is clean here
    const cleanPhone = phoneNumber.replace('+', '');

    // Prepare data for Arkesel V2 API
    const payload = {
      sender: process.env.ARKESEL_SENDER_ID || 'Arkesel',
      message: messageBody,
      recipients: [cleanPhone], // Arkesel expects an array of strings
    };

    const response = await fetch('https://sms.arkesel.com/api/v2/sms/send', {
      method: 'POST',
      headers: {
        'api-key': process.env.ARKESEL_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    // Check Arkesel's specific success response
    if (data.status === 'success') {
      return NextResponse.json({ success: true, data });
    } else {
      console.error('Arkesel Error:', data);
      return NextResponse.json({ success: false, error: data.message }, { status: 400 });
    }

  } catch (error: unknown) {
    console.error('Server Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}






// import { NextResponse } from 'next/server';
// import twilio from 'twilio';

// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_AUTH_TOKEN;
// const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

// const client = twilio(accountSid, authToken);

// export async function POST(request: Request) {
//   try {
//     const { phoneNumber, messageBody } = await request.json();

//     // Twilio logic
//     const message = await client.messages.create({
//       body: messageBody, 
//       from: twilioNumber,
//       to: phoneNumber, 
//     });

//     return NextResponse.json({ success: true, sid: message.sid });
//   } catch (error: any) {
//     console.error('Twilio error:', error);
//     return NextResponse.json(
//       { success: false, error: error.message },
//       { status: 500 }
//     );
//   }
// }