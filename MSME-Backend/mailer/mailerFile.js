const nodemailer = require('nodemailer');
const emailTemplate = require('./emailTemplate')
const CONFIG = require("../config/config");

// Email id :- undpmsme2025@gmail.com
// Password :- Saurabh@123

let subject;
let output;

async function sendEmail(payload, status, email) {

    console.log("payload", payload);

    if (status == 1) {
        subject = `Registration Request Received by Eswatini MSME Platform`
        output = emailTemplate.ragistrationEmail(payload);
    }
    if (status == 2) {
        subject = `Registration Request Approved by Eswatini MSME Administrator`
        output = emailTemplate.userApprovedEmailTemplate(payload);
    }
    if (status == 3) {
        subject = `Registration Request Update`
        output = emailTemplate.userRejectedEmailTemplate(payload);
    }

    if (status == 4) {
        subject = `OTP for Password Reset`
        output = emailTemplate.passwordResetOTPSend(payload);
    }


    try {
        let transporter = nodemailer.createTransport(CONFIG.mail)

        message = {
            from: CONFIG.mail_from,
            to: email,
            subject: subject,
            html: output
        }

        transporter.sendMail(message, function (error, info) {
            if (error) {
                console.log(error);
                return 0;
            } else {
                console.log('Email sent: ' + info.response);
                console.log('From:', message.from, '| To:', message.to);
                return 1;
            }
        });
    }
    catch (error) {
        console.error('Error sending email:', error);
        return 0;
    }
}

// ==================== HELP DESK EMAIL FUNCTIONS ====================

async function sendTicketConfirmationEmail(payload) {
    try {
        const transporter = nodemailer.createTransport(CONFIG.mail);
        
        const message = {
            from: CONFIG.mail_from,
            to: payload.email,
            subject: `[${payload.ticket_id}] Support Ticket Received - ${payload.subject}`,
            html: emailTemplate.ticketConfirmationEmail(payload)
        };

        const info = await transporter.sendMail(message);
        console.log('Ticket confirmation email sent:', info.response);
        return true;
    } catch (error) {
        console.error('Error sending ticket confirmation email:', error);
        throw error;
    }
}

async function sendTicketResponseEmail(payload) {
    try {
        const transporter = nodemailer.createTransport(CONFIG.mail);
        
        const message = {
            from: CONFIG.mail_from,
            to: payload.email,
            subject: `Re: [${payload.ticket_id}] ${payload.subject}`,
            html: emailTemplate.ticketResponseEmail(payload)
        };

        const info = await transporter.sendMail(message);
        console.log('Ticket response email sent:', info.response);
        return true;
    } catch (error) {
        console.error('Error sending ticket response email:', error);
        throw error;
    }
}

async function sendTicketAssignmentEmail(payload) {
    try {
        const transporter = nodemailer.createTransport(CONFIG.mail);
        
        const message = {
            from: CONFIG.mail_from,
            to: payload.admin_email,
            subject: `[Assigned] ${payload.ticket_id} - ${payload.subject}`,
            html: emailTemplate.ticketAssignmentEmail(payload)
        };

        const info = await transporter.sendMail(message);
        console.log('Ticket assignment email sent:', info.response);
        return true;
    } catch (error) {
        console.error('Error sending ticket assignment email:', error);
        throw error;
    }
}

async function sendTicketStatusUpdateEmail(payload) {
    try {
        const transporter = nodemailer.createTransport(CONFIG.mail);
        
        const message = {
            from: CONFIG.mail_from,
            to: payload.email,
            subject: `[${payload.ticket_id}] Ticket Status Updated - ${payload.status.replace('_', ' ').toUpperCase()}`,
            html: emailTemplate.ticketStatusUpdateEmail(payload)
        };

        const info = await transporter.sendMail(message);
        console.log('Ticket status update email sent:', info.response);
        return true;
    } catch (error) {
        console.error('Error sending ticket status update email:', error);
        throw error;
    }
}

module.exports = {
    sendEmail,
    sendTicketConfirmationEmail,
    sendTicketResponseEmail,
    sendTicketAssignmentEmail,
    sendTicketStatusUpdateEmail
};