import { SendEmailCommand } from '@aws-sdk/client-ses';
import { sesClient } from '../config/aws.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Helper to render structured detail table rows
 */
const renderDetailRow = (label, value) => `
  <tr>
    <td style="padding: 10px 14px; font-size: 14px; color: #6B7280; font-weight: 500; width: 38%; vertical-align: middle; border-bottom: 1px solid #F3F4F6;">${label}</td>
    <td style="padding: 10px 14px; font-size: 14px; color: #111827; font-weight: 600; width: 62%; vertical-align: middle; border-bottom: 1px solid #F3F4F6;">${value}</td>
  </tr>
`;

/**
 * Helper to render a styled container card for details
 */
const renderDetailsCard = (rowsHtml) => `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F9FAFB; border-radius: 8px; border: 1px solid #E5E7EB; margin: 20px 0; border-collapse: collapse; overflow: hidden;">
    ${rowsHtml}
  </table>
`;

/**
 * Base responsive email template with BorrowBack indigo theme (#4F46E5)
 */
const renderEmailTemplate = ({ title, preheader = '', heading, bodyHtml }) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body, table, td, p, a, li {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F3F4F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1F2937; line-height: 1.6;">
  <div style="display: none; font-size: 1px; color: #F3F4F6; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${preheader}
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F3F4F6; width: 100%;">
    <tr>
      <td align="center" style="padding: 36px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #E5E7EB;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #4F46E5 0%, #3730A3 100%); padding: 32px 24px; text-align: center;">
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px;">BorrowBack</h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #E0E7FF; font-weight: 500; letter-spacing: 0.5px;">Community Sharing & Peer Lending</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 36px 32px; background-color: #FFFFFF;">
              ${heading ? `<h2 style="margin: 0 0 20px 0; font-size: 20px; font-weight: 700; color: #111827; letter-spacing: -0.3px;">${heading}</h2>` : ''}
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 24px 32px; text-align: center; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: #4B5563;">BorrowBack Platform</p>
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #6B7280;">This is an automated notification. Please do not reply directly to this email.</p>
              <p style="margin: 0; font-size: 12px; color: #9CA3AF;">&copy; ${new Date().getFullYear()} BorrowBack. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

/**
 * Core sendEmail helper
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const fromEmail = process.env.SES_FROM_EMAIL || 'noreply@borrowback.com';

    if (!sesClient) {
      console.log(`[SES Dev Mode] AWS SES client is not configured. Email suppressed.`);
      console.log(`[SES Dev Mode] To: ${to}`);
      console.log(`[SES Dev Mode] From: ${fromEmail}`);
      console.log(`[SES Dev Mode] Subject: ${subject}`);
      console.log(`[SES Dev Mode] Message preview:\n${text || html}`);
      return { success: true, simulated: true };
    }

    const command = new SendEmailCommand({
      Source: fromEmail,
      Destination: {
        ToAddresses: Array.isArray(to) ? to : [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: html,
            Charset: 'UTF-8',
          },
          ...(text
            ? {
                Text: {
                  Data: text,
                  Charset: 'UTF-8',
                },
              }
            : {}),
        },
      },
    });

    const response = await sesClient.send(command);
    console.log(`[SES] Email successfully sent to ${to} (MessageId: ${response.MessageId})`);
    return { success: true, messageId: response.MessageId };
  } catch (error) {
    console.error(`[SES] Failed to send email to ${to}:`, error.message || error);
    return null;
  }
};

/**
 * 1. sendWelcomeEmail(name, email) - Welcome to BorrowBack
 */
export const sendWelcomeEmail = async (name, email) => {
  try {
    const subject = `Welcome to BorrowBack, ${name}!`;
    const preheader = `Welcome to BorrowBack! Start sharing, borrowing, and lending in your community.`;
    const heading = `Welcome to BorrowBack!`;

    const bodyHtml = `
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151;">Hi <strong>${name}</strong>,</p>
      <p style="margin: 0 0 18px 0; font-size: 15px; color: #4B5563; line-height: 1.6;">
        Welcome to <strong>BorrowBack</strong>! We're excited to have you join our trusted peer-to-peer sharing and lending community.
      </p>
      <div style="background-color: #EEF2FF; border-left: 4px solid #4F46E5; padding: 18px 20px; border-radius: 0 8px 8px 0; margin: 24px 0;">
        <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #4F46E5;">What you can do with BorrowBack:</p>
        <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #374151; line-height: 1.8;">
          <li><strong>Borrow Items:</strong> Find tools, books, gadgets, and equipment nearby.</li>
          <li><strong>Lend Items:</strong> Monetize or share idle items safely with neighbors.</li>
          <li><strong>Peer Loans:</strong> Request or support micro-loans with clear terms.</li>
        </ul>
      </div>
      <p style="margin: 0 0 24px 0; font-size: 15px; color: #4B5563; line-height: 1.6;">
        Explore your dashboard to start browsing items or list your first item today!
      </p>
      <p style="margin: 0; font-size: 14px; color: #6B7280;">
        Happy sharing,<br>
        <strong>The BorrowBack Team</strong>
      </p>
    `;

    const text = `Hi ${name},\n\nWelcome to BorrowBack! We're excited to have you join our peer-to-peer community.\n\nYou can now browse items to borrow, list items for lending, or request micro-loans with fellow members.\n\nHappy sharing,\nThe BorrowBack Team`;

    const html = renderEmailTemplate({ title: subject, preheader, heading, bodyHtml });
    return await sendEmail({ to: email, subject, html, text });
  } catch (error) {
    console.error(`[SES] Unexpected error in sendWelcomeEmail for ${email}:`, error.message || error);
    return null;
  }
};

/**
 * 2. sendBorrowRequestEmail(ownerEmail, ownerName, borrowerName, itemName) - Someone wants to borrow your item
 */
export const sendBorrowRequestEmail = async (ownerEmail, ownerName, borrowerName, itemName) => {
  try {
    const subject = `New Borrow Request: ${borrowerName} wants to borrow ${itemName}`;
    const preheader = `${borrowerName} has requested to borrow ${itemName}. Review this request on BorrowBack.`;
    const heading = `New Borrow Request Received`;

    const details = renderDetailsCard(
      renderDetailRow('Item', itemName) +
      renderDetailRow('Borrower', borrowerName) +
      renderDetailRow('Status', '<span style="color: #D97706; font-weight: 600;">Pending Your Approval</span>')
    );

    const bodyHtml = `
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151;">Hello <strong>${ownerName}</strong>,</p>
      <p style="margin: 0 0 18px 0; font-size: 15px; color: #4B5563; line-height: 1.6;">
        Good news! <strong>${borrowerName}</strong> has sent a request to borrow your item: <strong>${itemName}</strong>.
      </p>
      ${details}
      <p style="margin: 20px 0 24px 0; font-size: 15px; color: #4B5563; line-height: 1.6;">
        Please log in to your BorrowBack dashboard to review the borrower's details and approve or reject the request.
      </p>
      <p style="margin: 0; font-size: 14px; color: #6B7280;">
        Best regards,<br>
        <strong>The BorrowBack Team</strong>
      </p>
    `;

    const text = `Hello ${ownerName},\n\n${borrowerName} has requested to borrow your item "${itemName}".\n\nStatus: Pending Your Approval\n\nPlease log in to BorrowBack to approve or reject this request.\n\nBest regards,\nThe BorrowBack Team`;

    const html = renderEmailTemplate({ title: subject, preheader, heading, bodyHtml });
    return await sendEmail({ to: ownerEmail, subject, html, text });
  } catch (error) {
    console.error(`[SES] Unexpected error in sendBorrowRequestEmail for ${ownerEmail}:`, error.message || error);
    return null;
  }
};

/**
 * 3. sendBorrowApprovedEmail(borrowerEmail, borrowerName, itemName, ownerName) - Your borrow request was approved
 */
export const sendBorrowApprovedEmail = async (borrowerEmail, borrowerName, itemName, ownerName) => {
  try {
    const subject = `Borrow Request Approved: ${itemName}`;
    const preheader = `Your request to borrow ${itemName} was approved by ${ownerName}.`;
    const heading = `Borrow Request Approved!`;

    const details = renderDetailsCard(
      renderDetailRow('Item', itemName) +
      renderDetailRow('Owner', ownerName) +
      renderDetailRow('Status', '<span style="color: #059669; font-weight: 600;">Approved</span>')
    );

    const bodyHtml = `
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151;">Hello <strong>${borrowerName}</strong>,</p>
      <p style="margin: 0 0 18px 0; font-size: 15px; color: #4B5563; line-height: 1.6;">
        Great news! <strong>${ownerName}</strong> has approved your borrow request for <strong>${itemName}</strong>.
      </p>
      ${details}
      <div style="background-color: #ECFDF5; border-left: 4px solid #10B981; padding: 14px 18px; border-radius: 0 8px 8px 0; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #065F46; line-height: 1.5;">
          You can now coordinate pickup or delivery with <strong>${ownerName}</strong>. Please take good care of the item and remember to return it on or before the due date.
        </p>
      </div>
      <p style="margin: 0; font-size: 14px; color: #6B7280;">
        Happy borrowing,<br>
        <strong>The BorrowBack Team</strong>
      </p>
    `;

    const text = `Hello ${borrowerName},\n\nYour borrow request for "${itemName}" has been approved by ${ownerName}!\n\nPlease coordinate pickup with the owner and ensure returning it on time.\n\nHappy borrowing,\nThe BorrowBack Team`;

    const html = renderEmailTemplate({ title: subject, preheader, heading, bodyHtml });
    return await sendEmail({ to: borrowerEmail, subject, html, text });
  } catch (error) {
    console.error(`[SES] Unexpected error in sendBorrowApprovedEmail for ${borrowerEmail}:`, error.message || error);
    return null;
  }
};

/**
 * 4. sendBorrowRejectedEmail(borrowerEmail, borrowerName, itemName, ownerName) - Your borrow request was rejected
 */
export const sendBorrowRejectedEmail = async (borrowerEmail, borrowerName, itemName, ownerName) => {
  try {
    const subject = `Borrow Request Update: ${itemName}`;
    const preheader = `Update on your borrow request for ${itemName}.`;
    const heading = `Borrow Request Update`;

    const details = renderDetailsCard(
      renderDetailRow('Item', itemName) +
      renderDetailRow('Owner', ownerName) +
      renderDetailRow('Status', '<span style="color: #DC2626; font-weight: 600;">Not Approved</span>')
    );

    const bodyHtml = `
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151;">Hello <strong>${borrowerName}</strong>,</p>
      <p style="margin: 0 0 18px 0; font-size: 15px; color: #4B5563; line-height: 1.6;">
        We wanted to let you know that <strong>${ownerName}</strong> was unable to approve your request to borrow <strong>${itemName}</strong> at this time.
      </p>
      ${details}
      <p style="margin: 20px 0 24px 0; font-size: 15px; color: #4B5563; line-height: 1.6;">
        Don't worry! There are many other items listed on BorrowBack. Visit the catalog to find another item that fits your needs.
      </p>
      <p style="margin: 0; font-size: 14px; color: #6B7280;">
        Best regards,<br>
        <strong>The BorrowBack Team</strong>
      </p>
    `;

    const text = `Hello ${borrowerName},\n\nYour borrow request for "${itemName}" could not be approved by ${ownerName} at this time.\n\nPlease check BorrowBack to explore other available items.\n\nBest regards,\nThe BorrowBack Team`;

    const html = renderEmailTemplate({ title: subject, preheader, heading, bodyHtml });
    return await sendEmail({ to: borrowerEmail, subject, html, text });
  } catch (error) {
    console.error(`[SES] Unexpected error in sendBorrowRejectedEmail for ${borrowerEmail}:`, error.message || error);
    return null;
  }
};

/**
 * 5. sendOverdueReminderEmail(borrowerEmail, borrowerName, itemName, daysOverdue) - Item is overdue
 */
export const sendOverdueReminderEmail = async (borrowerEmail, borrowerName, itemName, daysOverdue) => {
  try {
    const subject = `Overdue Reminder: Return ${itemName}`;
    const preheader = `Urgent: The borrowed item ${itemName} is overdue by ${daysOverdue} day(s).`;
    const heading = `Overdue Item Reminder`;

    const details = renderDetailsCard(
      renderDetailRow('Item', itemName) +
      renderDetailRow('Days Overdue', `<span style="color: #DC2626; font-weight: 700;">${daysOverdue} day${Number(daysOverdue) === 1 ? '' : 's'}</span>`) +
      renderDetailRow('Status', '<span style="color: #DC2626; font-weight: 600;">Overdue</span>')
    );

    const bodyHtml = `
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151;">Hello <strong>${borrowerName}</strong>,</p>
      <p style="margin: 0 0 18px 0; font-size: 15px; color: #4B5563; line-height: 1.6;">
        This is an urgent reminder that the item <strong>${itemName}</strong> is currently past its scheduled return date.
      </p>
      ${details}
      <div style="background-color: #FEF2F2; border-left: 4px solid #DC2626; padding: 14px 18px; border-radius: 0 8px 8px 0; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #991B1B; line-height: 1.5;">
          <strong>Action Required:</strong> Please return the item to its owner immediately. Overdue items are subject to daily penalty fines and may result in temporary suspension of borrowing privileges.
        </p>
      </div>
      <p style="margin: 0; font-size: 14px; color: #6B7280;">
        Regards,<br>
        <strong>The BorrowBack Team</strong>
      </p>
    `;

    const text = `Hello ${borrowerName},\n\nUrgent: The item "${itemName}" is overdue by ${daysOverdue} day(s).\n\nPlease return the item immediately to avoid accumulating daily fines.\n\nRegards,\nThe BorrowBack Team`;

    const html = renderEmailTemplate({ title: subject, preheader, heading, bodyHtml });
    return await sendEmail({ to: borrowerEmail, subject, html, text });
  } catch (error) {
    console.error(`[SES] Unexpected error in sendOverdueReminderEmail for ${borrowerEmail}:`, error.message || error);
    return null;
  }
};

/**
 * 6. sendReturnConfirmedEmail(borrowerEmail, borrowerName, itemName) - Return confirmed
 */
export const sendReturnConfirmedEmail = async (borrowerEmail, borrowerName, itemName) => {
  try {
    const subject = `Return Confirmed: ${itemName}`;
    const preheader = `Return of ${itemName} has been confirmed. Thank you!`;
    const heading = `Item Return Confirmed`;

    const details = renderDetailsCard(
      renderDetailRow('Item', itemName) +
      renderDetailRow('Status', '<span style="color: #059669; font-weight: 600;">Returned & Completed</span>')
    );

    const bodyHtml = `
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151;">Hello <strong>${borrowerName}</strong>,</p>
      <p style="margin: 0 0 18px 0; font-size: 15px; color: #4B5563; line-height: 1.6;">
        The owner has officially confirmed the return of <strong>${itemName}</strong>. Your borrow transaction is now successfully closed.
      </p>
      ${details}
      <div style="background-color: #ECFDF5; border-left: 4px solid #10B981; padding: 14px 18px; border-radius: 0 8px 8px 0; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #065F46; line-height: 1.5;">
          Thank you for taking good care of the item and returning it. Your reliability helps keep our sharing community strong!
        </p>
      </div>
      <p style="margin: 0; font-size: 14px; color: #6B7280;">
        Best regards,<br>
        <strong>The BorrowBack Team</strong>
      </p>
    `;

    const text = `Hello ${borrowerName},\n\nThe owner has confirmed the return of "${itemName}". The transaction is now closed.\n\nThank you for being a responsible community member!\n\nBest regards,\nThe BorrowBack Team`;

    const html = renderEmailTemplate({ title: subject, preheader, heading, bodyHtml });
    return await sendEmail({ to: borrowerEmail, subject, html, text });
  } catch (error) {
    console.error(`[SES] Unexpected error in sendReturnConfirmedEmail for ${borrowerEmail}:`, error.message || error);
    return null;
  }
};

/**
 * 7. sendFineIssuedEmail(borrowerEmail, borrowerName, itemName, fineAmount) - Fine issued
 */
export const sendFineIssuedEmail = async (borrowerEmail, borrowerName, itemName, fineAmount) => {
  try {
    const formattedAmount = `\u20B9${fineAmount}`;
    const subject = `Fine Notice: Overdue item ${itemName}`;
    const preheader = `A fine of ${formattedAmount} has been issued for the overdue item ${itemName}.`;
    const heading = `Fine Issued Notice`;

    const details = renderDetailsCard(
      renderDetailRow('Item', itemName) +
      renderDetailRow('Fine Amount', `<span style="color: #DC2626; font-size: 16px; font-weight: 700;">${formattedAmount}</span>`) +
      renderDetailRow('Status', '<span style="color: #DC2626; font-weight: 600;">Payment Due</span>')
    );

    const bodyHtml = `
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151;">Hello <strong>${borrowerName}</strong>,</p>
      <p style="margin: 0 0 18px 0; font-size: 15px; color: #4B5563; line-height: 1.6;">
        A late return fine has been issued on your BorrowBack account for <strong>${itemName}</strong>.
      </p>
      ${details}
      <div style="background-color: #FEF2F2; border-left: 4px solid #DC2626; padding: 14px 18px; border-radius: 0 8px 8px 0; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #991B1B; line-height: 1.5;">
          Please log in to BorrowBack to settle the outstanding fine of <strong>${formattedAmount}</strong> and complete the return of the item to keep your account in good standing.
        </p>
      </div>
      <p style="margin: 0; font-size: 14px; color: #6B7280;">
        Regards,<br>
        <strong>The BorrowBack Team</strong>
      </p>
    `;

    const text = `Hello ${borrowerName},\n\nA fine of ${formattedAmount} has been issued for the overdue item "${itemName}".\n\nPlease log in to BorrowBack to settle your dues and return the item.\n\nRegards,\nThe BorrowBack Team`;

    const html = renderEmailTemplate({ title: subject, preheader, heading, bodyHtml });
    return await sendEmail({ to: borrowerEmail, subject, html, text });
  } catch (error) {
    console.error(`[SES] Unexpected error in sendFineIssuedEmail for ${borrowerEmail}:`, error.message || error);
    return null;
  }
};

/**
 * 8. sendLoanRequestEmail(lenderEmail, lenderName, borrowerName, amount) - Someone wants a loan from you
 */
export const sendLoanRequestEmail = async (lenderEmail, lenderName, borrowerName, amount) => {
  try {
    const formattedAmount = `\u20B9${amount}`;
    const subject = `New Loan Request: ${formattedAmount} from ${borrowerName}`;
    const preheader = `${borrowerName} has requested a peer loan of ${formattedAmount}. Review the request on BorrowBack.`;
    const heading = `New Loan Request Received`;

    const details = renderDetailsCard(
      renderDetailRow('Borrower', borrowerName) +
      renderDetailRow('Requested Amount', `<span style="color: #4F46E5; font-size: 16px; font-weight: 700;">${formattedAmount}</span>`) +
      renderDetailRow('Status', '<span style="color: #D97706; font-weight: 600;">Pending Review</span>')
    );

    const bodyHtml = `
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151;">Hello <strong>${lenderName}</strong>,</p>
      <p style="margin: 0 0 18px 0; font-size: 15px; color: #4B5563; line-height: 1.6;">
        You have received a new peer-to-peer loan request from <strong>${borrowerName}</strong>.
      </p>
      ${details}
      <p style="margin: 20px 0 24px 0; font-size: 15px; color: #4B5563; line-height: 1.6;">
        Please log in to your BorrowBack dashboard to review the borrower's profile, history, and repayment terms before deciding to approve or decline.
      </p>
      <p style="margin: 0; font-size: 14px; color: #6B7280;">
        Best regards,<br>
        <strong>The BorrowBack Team</strong>
      </p>
    `;

    const text = `Hello ${lenderName},\n\n${borrowerName} has requested a loan of ${formattedAmount} on BorrowBack.\n\nStatus: Pending Review\n\nPlease log in to BorrowBack to review and respond to this request.\n\nBest regards,\nThe BorrowBack Team`;

    const html = renderEmailTemplate({ title: subject, preheader, heading, bodyHtml });
    return await sendEmail({ to: lenderEmail, subject, html, text });
  } catch (error) {
    console.error(`[SES] Unexpected error in sendLoanRequestEmail for ${lenderEmail}:`, error.message || error);
    return null;
  }
};

/**
 * 9. sendLoanApprovedEmail(borrowerEmail, borrowerName, amount) - Loan approved
 */
export const sendLoanApprovedEmail = async (borrowerEmail, borrowerName, amount) => {
  try {
    const formattedAmount = `\u20B9${amount}`;
    const subject = `Loan Request Approved: ${formattedAmount}`;
    const preheader = `Your peer loan request of ${formattedAmount} has been approved!`;
    const heading = `Loan Request Approved!`;

    const details = renderDetailsCard(
      renderDetailRow('Approved Amount', `<span style="color: #059669; font-size: 16px; font-weight: 700;">${formattedAmount}</span>`) +
      renderDetailRow('Status', '<span style="color: #059669; font-weight: 600;">Approved</span>')
    );

    const bodyHtml = `
      <p style="margin: 0 0 16px 0; font-size: 16px; color: #374151;">Hello <strong>${borrowerName}</strong>,</p>
      <p style="margin: 0 0 18px 0; font-size: 15px; color: #4B5563; line-height: 1.6;">
        Great news! Your peer loan request for <strong>${formattedAmount}</strong> has been approved.
      </p>
      ${details}
      <div style="background-color: #ECFDF5; border-left: 4px solid #10B981; padding: 14px 18px; border-radius: 0 8px 8px 0; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #065F46; line-height: 1.5;">
          Please log in to your BorrowBack dashboard to review the repayment schedule and disbursement details.
        </p>
      </div>
      <p style="margin: 0; font-size: 14px; color: #6B7280;">
        Best regards,<br>
        <strong>The BorrowBack Team</strong>
      </p>
    `;

    const text = `Hello ${borrowerName},\n\nYour peer loan request for ${formattedAmount} has been approved!\n\nPlease check your BorrowBack dashboard for disbursement and repayment schedule details.\n\nBest regards,\nThe BorrowBack Team`;

    const html = renderEmailTemplate({ title: subject, preheader, heading, bodyHtml });
    return await sendEmail({ to: borrowerEmail, subject, html, text });
  } catch (error) {
    console.error(`[SES] Unexpected error in sendLoanApprovedEmail for ${borrowerEmail}:`, error.message || error);
    return null;
  }
};

export default {
  sendWelcomeEmail,
  sendBorrowRequestEmail,
  sendBorrowApprovedEmail,
  sendBorrowRejectedEmail,
  sendOverdueReminderEmail,
  sendReturnConfirmedEmail,
  sendFineIssuedEmail,
  sendLoanRequestEmail,
  sendLoanApprovedEmail,
};
