/**
 * Email Service
 * 
 * Port of mailer/mailerFile.js to TypeScript for Cloud Functions
 * Sends transactional emails using Nodemailer
 */

import * as nodemailer from 'nodemailer';
import { defineString } from 'firebase-functions/params';

// Firebase environment config
const mailHost = defineString('MAIL_HOST');
const mailPort = defineString('MAIL_PORT');
const mailUser = defineString('MAIL_USER');
const mailPass = defineString('MAIL_PASS');
const mailFrom = defineString('MAIL_FROM');

/**
 * HTML escape helper to prevent XSS in email templates
 */
function escapeHtml(input: any): string {
  if (input === null || input === undefined) return '';
  const str = String(input);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Mask email for logging (hide most of local part)
 */
function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***';
  const [local, domain] = email.split('@');
  const masked = local.length > 2 
    ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
    : '*'.repeat(local.length);
  return `${masked}@${domain}`;
}

// Email templates
const emailTemplates = {
  // Business registration status emails
  1: {
    subject: 'Registration Request Received - MSME Platform',
    template: (data: any) => `
      <h2>Welcome to the MSME Platform!</h2>
      <p>Dear ${escapeHtml(data.name_of_organization)},</p>
      <p>Thank you for registering your business with the MSME Platform.</p>
      <p>Your registration is currently under review. We will notify you once it has been processed.</p>
      <p><strong>Business Details:</strong></p>
      <ul>
        <li>Organization: ${escapeHtml(data.name_of_organization)}</li>
        <li>Email: ${escapeHtml(data.email_address)}</li>
        <li>Region: ${escapeHtml(data.region)}</li>
      </ul>
      <p>Best regards,<br>MSME Platform Team</p>
    `,
  },
  2: {
    subject: 'Registration Approved - MSME Platform',
    template: (data: any) => `
      <h2>Congratulations!</h2>
      <p>Dear ${escapeHtml(data.name_of_organization)},</p>
      <p>Your business registration has been <strong>approved</strong>!</p>
      <p>Your business is now visible on the MSME Platform directory.</p>
      <p>You can log in to your account to manage your business profile.</p>
      <p>Best regards,<br>MSME Platform Team</p>
    `,
  },
  3: {
    subject: 'Registration Update Required - MSME Platform',
    template: (data: any) => `
      <h2>Registration Status Update</h2>
      <p>Dear ${escapeHtml(data.name_of_organization)},</p>
      <p>Unfortunately, your business registration requires some updates before it can be approved.</p>
      ${data.verification_notes ? `<p><strong>Notes:</strong> ${escapeHtml(data.verification_notes)}</p>` : ''}
      <p>Please log in to your account and update the required information.</p>
      <p>Best regards,<br>MSME Platform Team</p>
    `,
  },
  4: {
    subject: 'Password Reset OTP - MSME Platform',
    template: (data: any) => `
      <h2>Password Reset Request</h2>
      <p>Dear ${escapeHtml(data.name_of_organization) || 'User'},</p>
      <p>You have requested to reset your password. Use the following OTP code:</p>
      <h1 style="text-align: center; font-size: 32px; letter-spacing: 8px; color: #333;">${escapeHtml(data.otp)}</h1>
      <p>This code will expire in 10 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
      <p>Best regards,<br>MSME Platform Team</p>
    `,
  },
};

// Help desk email templates
const helpdeskTemplates = {
  ticketCreated: {
    subject: (ticketId: string) => `Ticket ${escapeHtml(ticketId)} - We received your request`,
    template: (data: any) => `
      <h2>Support Request Received</h2>
      <p>Dear ${escapeHtml(data.name)},</p>
      <p>Thank you for contacting us. We have received your support request.</p>
      <p><strong>Ticket Details:</strong></p>
      <ul>
        <li>Ticket ID: ${escapeHtml(data.ticket_id)}</li>
        <li>Subject: ${escapeHtml(data.subject)}</li>
        <li>Category: ${escapeHtml(data.category_name || 'General')}</li>
      </ul>
      <p>Our team will review your request and respond as soon as possible.</p>
      <p>Best regards,<br>MSME Support Team</p>
    `,
  },
  ticketResponse: {
    subject: (ticketId: string) => `Ticket ${escapeHtml(ticketId)} - New Response`,
    template: (data: any) => `
      <h2>New Response on Your Ticket</h2>
      <p>Dear ${escapeHtml(data.name)},</p>
      <p>There is a new response on your support ticket.</p>
      <p><strong>Ticket:</strong> ${escapeHtml(data.ticket_id)} - ${escapeHtml(data.subject)}</p>
      <hr>
      <p>${escapeHtml(data.response_message).replace(/\n/g, '<br>')}</p>
      <hr>
      <p>Best regards,<br>MSME Support Team</p>
    `,
  },
  ticketAssigned: {
    subject: (ticketId: string) => `Ticket ${escapeHtml(ticketId)} - Assigned to you`,
    template: (data: any) => `
      <h2>New Ticket Assigned</h2>
      <p>Dear ${escapeHtml(data.admin_name)},</p>
      <p>A new ticket has been assigned to you.</p>
      <p><strong>Ticket Details:</strong></p>
      <ul>
        <li>Ticket ID: ${escapeHtml(data.ticket_id)}</li>
        <li>Subject: ${escapeHtml(data.subject)}</li>
        <li>Priority: ${escapeHtml(data.priority)}</li>
        <li>From: ${escapeHtml(data.customer_name)} (${escapeHtml(data.customer_email)})</li>
      </ul>
      <p>Please log in to the CMS to view and respond.</p>
      <p>Best regards,<br>MSME Platform</p>
    `,
  },
  ticketStatusChanged: {
    subject: (ticketId: string, status: string) => `Ticket ${escapeHtml(ticketId)} - Status: ${escapeHtml(status)}`,
    template: (data: any) => `
      <h2>Ticket Status Update</h2>
      <p>Dear ${escapeHtml(data.name)},</p>
      <p>Your support ticket status has been updated.</p>
      <p><strong>Ticket:</strong> ${escapeHtml(data.ticket_id)} - ${escapeHtml(data.subject)}</p>
      <p><strong>New Status:</strong> ${escapeHtml(data.status)}</p>
      ${data.resolution_notes ? `<p><strong>Resolution Notes:</strong> ${escapeHtml(data.resolution_notes)}</p>` : ''}
      <p>Best regards,<br>MSME Support Team</p>
    `,
  },
};

/**
 * Create email transporter
 */
function createTransporter(): nodemailer.Transporter {
  return nodemailer.createTransport({
    host: mailHost.value(),
    port: parseInt(mailPort.value() || '587'),
    secure: mailPort.value() === '465',
    auth: {
      user: mailUser.value(),
      pass: mailPass.value(),
    },
  });
}

/**
 * Send business status email
 */
export async function sendBusinessEmail(
  data: any,
  status: 1 | 2 | 3 | 4,
  toEmail: string
): Promise<boolean> {
  try {
    const transporter = createTransporter();
    const template = emailTemplates[status];
    
    await transporter.sendMail({
      from: `MSME Platform <${mailFrom.value()}>`,
      to: toEmail,
      subject: template.subject,
      html: template.template(data),
    });
    
    console.log(`Email sent: ${template.subject} to ${maskEmail(toEmail)}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send help desk email
 */
export async function sendHelpdeskEmail(
  type: keyof typeof helpdeskTemplates,
  data: any,
  toEmail: string
): Promise<boolean> {
  try {
    const transporter = createTransporter();
    const template = helpdeskTemplates[type];
    
    const subject = typeof template.subject === 'function' 
      ? template.subject(data.ticket_id, data.status)
      : template.subject;
    
    await transporter.sendMail({
      from: `MSME Support <${mailFrom.value()}>`,
      to: toEmail,
      subject,
      html: template.template(data),
    });
    
    console.log(`Helpdesk email sent: ${subject} to ${maskEmail(toEmail)}`);
    return true;
  } catch (error) {
    console.error('Error sending helpdesk email:', error);
    return false;
  }
}

/**
 * Send critical system error notification
 */
export async function sendCriticalErrorEmail(
  errorType: string,
  errorMessage: string,
  context: Record<string, any>
): Promise<boolean> {
  try {
    const transporter = createTransporter();
    const adminEmails = process.env.ADMIN_ERROR_EMAILS?.split(',') || [];
    
    if (adminEmails.length === 0) {
      console.warn('No admin emails configured for error notifications');
      return false;
    }
    
    await transporter.sendMail({
      from: `MSME System <${mailFrom.value()}>`,
      to: adminEmails.join(','),
      subject: `[CRITICAL] MSME Platform Error: ${errorType}`,
      html: `
        <h2>Critical System Error</h2>
        <p><strong>Type:</strong> ${escapeHtml(errorType)}</p>
        <p><strong>Message:</strong> ${escapeHtml(errorMessage)}</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        <h3>Context:</h3>
        <pre>${escapeHtml(JSON.stringify(context, null, 2))}</pre>
      `,
    });
    
    return true;
  } catch (error) {
    console.error('Error sending critical error email:', error);
    return false;
  }
}

export default {
  sendBusinessEmail,
  sendHelpdeskEmail,
  sendCriticalErrorEmail,
};
