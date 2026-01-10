import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request) {
	try {
		const body = await request.json();
		const { to, subject, html, applicantName, position, interviewDate, interviewTime, interviewPlace, salary } = body;

		if (!to || !applicantName || !position) {
			return NextResponse.json({ error: 'Missing required fields: to, applicantName, position' }, { status: 400 });
		}

		// Create elegant email HTML template
		const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interview Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Congratulations!</h1>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 16px; line-height: 1.6;">
                                Good day, <strong>${applicantName}</strong>!
                            </p>
                            
                            <p style="margin: 0 0 25px 0; color: #1f2937; font-size: 16px; line-height: 1.6;">
                                We are pleased to inform you that you have been selected for an interview for the position of <strong>${position}</strong>. We are impressed with your qualifications and would like to discuss this opportunity with you further.
                            </p>

                            <!-- Interview Details Card -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #fef3c7; border-radius: 8px; margin: 30px 0; border-left: 4px solid #ea580c;">
                                <tr>
                                    <td style="padding: 25px;">
                                        <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 20px; font-weight: 600;">Interview Details</h2>
                                        
                                        ${interviewDate && interviewTime ? `
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="padding: 8px 0;">
                                                    <strong style="color: #78350f; font-size: 14px;">📅 Date & Time:</strong>
                                                    <p style="margin: 5px 0 0 0; color: #1f2937; font-size: 15px;">
                                                        ${new Date(interviewDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${interviewTime}
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                        ` : ''}
                                        
                                        ${interviewPlace ? `
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="padding: 8px 0;">
                                                    <strong style="color: #78350f; font-size: 14px;">📍 Location:</strong>
                                                    <p style="margin: 5px 0 0 0; color: #1f2937; font-size: 15px;">${interviewPlace}</p>
                                                </td>
                                            </tr>
                                        </table>
                                        ` : ''}
                                        
                                        ${salary ? `
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="padding: 8px 0;">
                                                    <strong style="color: #78350f; font-size: 14px;">💰 Salary Offer:</strong>
                                                    <p style="margin: 5px 0 0 0; color: #1f2937; font-size: 15px; font-weight: 600;">${salary}</p>
                                                </td>
                                            </tr>
                                        </table>
                                        ` : ''}
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 25px 0 0 0; color: #1f2937; font-size: 16px; line-height: 1.6;">
                                Please confirm your attendance at your earliest convenience. If you have any questions or need to reschedule, please don't hesitate to contact us.
                            </p>
                            
                            <p style="margin: 25px 0 0 0; color: #1f2937; font-size: 16px; line-height: 1.6;">
                                We look forward to meeting you and learning more about how you can contribute to our team.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                                Best regards,<br>
                                <strong style="color: #1f2937;">Human Resources Team</strong>
                            </p>
                            <p style="margin: 20px 0 0 0; color: #9ca3af; font-size: 12px;">
                                This is an automated message. Please do not reply to this email.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
		`;

		// Email subject
		const emailSubject = subject || `Interview Invitation - ${position} Position`;

		// Configure Nodemailer transporter
		// For Gmail: Use App Password (not regular password)
		// Go to: Google Account > Security > 2-Step Verification > App Passwords
		const transporter = nodemailer.createTransport({
			host: process.env.SMTP_HOST || 'smtp.gmail.com',
			port: parseInt(process.env.SMTP_PORT || '587'),
			secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
			auth: {
				user: process.env.SMTP_USER, // Your email address
				pass: process.env.SMTP_PASSWORD // Your email password or app password
			}
		});

		// Check if SMTP credentials are configured
		if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
			console.log('⚠️ SMTP credentials not configured');
			console.log('Email would be sent:', { to, subject: emailSubject, applicantName, position, interviewDate, interviewTime, interviewPlace, salary });
			return NextResponse.json({ 
				success: false,
				error: 'Email service not configured',
				message: 'Please set SMTP_USER and SMTP_PASSWORD in your .env.local file. See README for setup instructions.',
				debug: { to, subject: emailSubject }
			}, { status: 400 });
		}

		console.log('📧 Attempting to send email...', { to, from: process.env.SMTP_USER });

		// Send email
		const info = await transporter.sendMail({
			from: `"HR Team" <${process.env.SMTP_USER}>`,
			to: to,
			subject: emailSubject,
			html: emailHtml
		});

		console.log('✅ Email sent successfully!', { messageId: info.messageId, to });
		return NextResponse.json({ 
			success: true, 
			data: { messageId: info.messageId },
			message: 'Email sent successfully' 
		}, { status: 200 });

	} catch (err) {
		console.error('Email API error:', err);
		
		// Provide helpful error messages
		let errorMessage = err.message || 'Failed to send email';
		if (err.code === 'EAUTH') {
			errorMessage = 'Email authentication failed. Please check your SMTP_USER and SMTP_PASSWORD in .env.local. For Gmail, use an App Password.';
		} else if (err.code === 'ECONNECTION') {
			errorMessage = 'Could not connect to email server. Please check SMTP_HOST and SMTP_PORT settings.';
		}
		
		return NextResponse.json({ 
			error: 'Failed to send email', 
			message: errorMessage,
			details: err.code || err.message
		}, { status: 500 });
	}
}
