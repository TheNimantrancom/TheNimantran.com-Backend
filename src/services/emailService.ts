// services/emailService.ts
import { transporter } from "../utils/sendMail.js";
import { EmailTemplates } from "./emailTemplate.js";
import { SentMessageInfo } from "nodemailer";

// Define interfaces for the data objects
interface OrderData {
  orderId: string;
  customerName?: string;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount?: number;
  orderDate?: string | Date;
  shippingAddress?: string;
  [key: string]: any; // Allow additional properties
}

interface SubscriptionData {
  planName?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  amount?: number;
  [key: string]: any; // Allow additional properties
}

interface ReturnData {
  returnId: string;
  orderId: string;
  reason?: string;
  [key: string]: any; // Allow additional properties
}

interface EmailResponse {
  success: boolean;
  messageId: string;
}

class EmailService {
  private from: string;

  constructor() {
    const emailFrom = process.env.EMAIL_FROM || 'noreply@thenimantran.com@gmail.com';
    this.from = `"TheNimantran.com" <${emailFrom}>`;
  }

  async sendEmail(to: string, subject: string, html: string): Promise<EmailResponse> {
    try {
      // Validate email parameters
      if (!to || !subject || !html) {
        throw new Error('Missing required email parameters');
      }

      const mailOptions = {
        from: this.from,
        to,
        subject,
        html,
        // Optional: Add text version for email clients that don't support HTML
        text: html.replace(/<[^>]*>/g, ''),
      };

      const info: SentMessageInfo = await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${to}: ${info.messageId}`);
      
      return { 
        success: true, 
        messageId: info.messageId 
      };
    } catch (error: any) {
      console.error('Error sending email:', error);
      throw new Error(`Failed to send email: ${error?.message || 'Unknown error'}`);
    }
  }

  async sendRegistrationOTP(email: string, name: string, otp: string): Promise<EmailResponse> {
    const html = EmailTemplates.registrationOTP(name, otp);
    return this.sendEmail(email, 'Verify Your Email - TheNimantran', html);
  }

  async sendLoginOTP(email: string, name: string, otp: string): Promise<EmailResponse> {
    const html = EmailTemplates.loginOTP(name, otp);
    return this.sendEmail(email, 'Login Verification - TheNimantran', html);
  }

  async sendPasswordResetOTP(email: string, name: string, otp: string): Promise<EmailResponse> {
    const html = EmailTemplates.passwordResetOTP(name, otp);
    return this.sendEmail(email, 'Password Reset Verification - TheNimantran', html);
  }

  async sendVerifyOrderOTP(email: string, otp: string): Promise<EmailResponse> {
    const html = EmailTemplates.verifyOrderOTP(otp);
    return this.sendEmail(email, 'Order Verification - TheNimantran', html);
  }

  async sendOrderCancelled(email: string, orderData: OrderData): Promise<EmailResponse> {
    const html = EmailTemplates.orderCancelled(orderData);
    return this.sendEmail(email, `Order Cancelled #${orderData.orderId} - TheNimantran`, html);
  }

  async sendOrderReturnRequested(email: string, returnData: ReturnData): Promise<EmailResponse> {
    const html = EmailTemplates.orderReturnRequested(returnData);
    return this.sendEmail(email, `Return Request #${returnData.returnId} - TheNimantran`, html);
  }

  async sendSubscriptionConfirmation(email: string, subscriptionData: SubscriptionData): Promise<EmailResponse> {
    const html = EmailTemplates.subscriptionConfirmation(subscriptionData);
    return this.sendEmail(email, 'Subscription Confirmed - TheNimantran', html);
  }

  async sendOrderConfirmation(email: string, orderData: OrderData): Promise<EmailResponse> {
    const html = EmailTemplates.orderConfirmation(orderData);
    return this.sendEmail(email, `Order Confirmed #${orderData.orderId} - TheNimantran`, html);
  }

  async sendOrderShipped(email: string, orderData: OrderData): Promise<EmailResponse> {
    const html = EmailTemplates.orderShipped(orderData);
    return this.sendEmail(email, `Your Order is Shipped #${orderData.orderId} - TheNimantran`, html);
  }

  async sendOrderDelivered(email: string, orderData: OrderData): Promise<EmailResponse> {
    const html = EmailTemplates.orderDelivered(orderData);
    return this.sendEmail(email, `Order Delivered #${orderData.orderId} - TheNimantran`, html);
  }

  async sendNewOrderAdmin(adminEmail: string, orderData: OrderData): Promise<EmailResponse> {
    const html = EmailTemplates.newOrderAdmin(orderData);
    return this.sendEmail(adminEmail, `New Order Alert #${orderData.orderId} - TheNimantran`, html);
  }

  async sendPasswordReset(email: string, name: string, resetLink: string): Promise<EmailResponse> {
    const html = EmailTemplates.passwordReset(name, resetLink);
    return this.sendEmail(email, 'Reset Your Password - TheNimantran', html);
  }

  async sendWelcomeEmail(email: string, name: string): Promise<EmailResponse> {
    const html = EmailTemplates.welcomeEmail(name);
    return this.sendEmail(email, 'Welcome to TheNimantran!', html);
  }
}

// Export a singleton instance
export default new EmailService();