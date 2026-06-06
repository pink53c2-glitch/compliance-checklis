import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { jsPDF } from 'jspdf';

// Initialize the Resend email client
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    // 1. Catch the data sent from the frontend form
    const body = await request.json();
    const { email, answers } = body;

    if (!email || !answers) {
      return NextResponse.json({ error: 'Missing email or answers data' }, { status: 400 });
    }

    // 2. Initialize the PDF Document
    const doc = new jsPDF();
    
    // Basic PDF Styling
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Cybersecurity Gap Assessment", 20, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`Generated for: ${email}`, 20, 30);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 38);

    doc.setLineWidth(0.5);
    doc.line(20, 45, 190, 45);

    // 3. Process the answers
    let yPosition = 60;
    let gapsFound = 0;

    Object.entries(answers).forEach(([questionId, isSecure]) => {
      if (isSecure === false) {
        gapsFound++;
        doc.setFont("helvetica", "bold");
        doc.text(`Gap ${gapsFound}: Found in Question ${questionId}`, 20, yPosition);
        yPosition += 10;
        // Check page overflow
        if (yPosition > 280) { doc.addPage(); yPosition = 20; }
      }
    });

    if (gapsFound === 0) {
      doc.text("Congratulations! No critical security gaps were detected.", 20, yPosition);
    }

    // 4. Convert the PDF to a Buffer so we can attach it to an email
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    // 5. Send the Email via Resend
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: [email],
      subject: 'Your B2B Cybersecurity Compliance Report',
      text: 'Attached is your custom remediation blueprint.',
      attachments: [
        {
          filename: 'compliance_report.pdf',
          content: pdfBuffer,
        },
      ],
    });

    // 6. Return success (Safely inside the try block!)
    return NextResponse.json({ 
      success: true, 
      message: `Report processed. Found ${gapsFound} gaps.` 
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}