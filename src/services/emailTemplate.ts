// services/emailTemplates.js
class EmailTemplates {
  static getLogoUrl() {
    return process.env.LOGO_URL || 'https://thenimantran.com/weblogo.png';
  }

static getBaseTemplate(htmlContent:any, title:any) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
          }
          
          body {
            background-color: #FFFBF5;
            padding: 20px 10px;
          }
          
          .email-container {
            max-width: 650px;
            margin: 0 auto;
            background-color: #FFFFFF;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(139, 69, 19, 0.08);
            border: 1px solid #F5E6D3;
          }
          
          .header {
            background: linear-gradient(135deg, #FFFBF5 0%, #F8F0E3 100%);
            padding: 40px 20px 30px;
            text-align: center;
            border-bottom: 1px solid #F5E6D3;
          }
          
          .logo-container {
            display: inline-block;
            padding: 15px;
            background: #FFFFFF;
            border-radius: 50%;
            box-shadow: 0 5px 15px rgba(139, 69, 19, 0.1);
            margin-bottom: 20px;
          }
          
          .logo {
            max-width: 180px;
            height: auto;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
          }
          
          .company-name {
            color: #8B4513;
            font-size: 32px;
            font-weight: 700;
            margin-top: 15px;
            letter-spacing: -0.5px;
            text-shadow: 0 2px 4px rgba(139, 69, 19, 0.1);
          }
          
          .tagline {
            color: #A67C52;
            font-size: 16px;
            font-weight: 500;
            margin-top: 8px;
            letter-spacing: 0.5px;
          }
          
          .content {
            padding: 50px 40px;
            color: #5D4037;
            line-height: 1.7;
            background-color: #FFFFFF;
          }
          
          .content h1, .content h2, .content h3 {
            color: #8B4513;
            margin-bottom: 20px;
            font-weight: 600;
          }
          
          .content p {
            margin-bottom: 20px;
            font-size: 16px;
            color: #5D4037;
          }
          
          .otp-container {
            background: linear-gradient(135deg, #FFF9F0 0%, #FFEDD5 100%);
            color: #8B4513;
            padding: 25px;
            border-radius: 15px;
            text-align: center;
            margin: 40px 0;
            font-size: 42px;
            font-weight: 800;
            letter-spacing: 15px;
            border: 2px dashed #E6B89C;
            box-shadow: 0 8px 20px rgba(230, 184, 156, 0.2);
          }
          
          .button {
            display: inline-block;
            padding: 16px 40px;
            background: linear-gradient(135deg, #E6B89C 0%, #D4A574 100%);
            color: #5D4037;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 700;
            font-size: 16px;
            margin: 25px 0;
            text-align: center;
            border: none;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 6px 15px rgba(230, 184, 156, 0.3);
          }
          
          .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(230, 184, 156, 0.4);
            background: linear-gradient(135deg, #D4A574 0%, #C9966F 100%);
          }
          
          .order-details {
            background-color: #FFFBF5;
            border-radius: 15px;
            padding: 25px;
            margin: 30px 0;
            border: 2px solid #F5E6D3;
          }
          
          .order-details h3 {
            color: #8B4513;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #E6B89C;
          }
          
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #F5E6D3;
          }
          
          .detail-row:last-child {
            border-bottom: none;
          }
          
          .detail-row span:first-child {
            color: #A67C52;
            font-weight: 500;
          }
          
          .detail-row span:last-child {
            color: #5D4037;
            font-weight: 600;
          }
          
          .footer {
            background: linear-gradient(135deg, #FFFBF5 0%, #F8F0E3 100%);
            padding: 40px 30px;
            text-align: center;
            color: #8B4513;
            border-top: 1px solid #F5E6D3;
          }
          
          .footer p {
            margin-bottom: 15px;
            font-size: 15px;
            line-height: 1.6;
          }
          
          .social-links {
            margin: 30px 0;
            display: flex;
            justify-content: center;
            gap: 25px;
          }
          
          .social-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 45px;
            height: 45px;
            background: #FFFFFF;
            border-radius: 50%;
            color: #8B4513;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.3s ease;
            box-shadow: 0 4px 10px rgba(139, 69, 19, 0.1);
            border: 1px solid #F5E6D3;
          }
          
          .social-icon:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 15px rgba(139, 69, 19, 0.2);
            background: #8B4513;
            color: #FFFFFF;
          }
          
          .contact-info {
            margin: 25px 0;
            padding: 20px;
            background: #FFFFFF;
            border-radius: 12px;
            border: 1px solid #F5E6D3;
          }
          
          .contact-info a {
            color: #8B4513;
            text-decoration: none;
            font-weight: 600;
          }
          
          .contact-info a:hover {
            text-decoration: underline;
          }
          
          .divider {
            height: 1px;
            background: linear-gradient(to right, transparent, #E6B89C, transparent);
            margin: 30px 0;
          }
          
          .highlight-box {
            background: linear-gradient(135deg, #FFF9F0 0%, #FFEDD5 100%);
            border-left: 5px solid #E6B89C;
            padding: 20px;
            border-radius: 10px;
            margin: 25px 0;
          }
          
          .highlight-box strong {
            color: #8B4513;
          }
          
          .badge {
            display: inline-block;
            padding: 8px 20px;
            background: linear-gradient(135deg, #E6B89C 0%, #D4A574 100%);
            color: #FFFFFF;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            margin: 5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          @media only screen and (max-width: 650px) {
            .email-container {
              border-radius: 15px;
            }
            
            .content {
              padding: 30px 20px;
            }
            
            .header {
              padding: 30px 15px 20px;
            }
            
            .company-name {
              font-size: 26px;
            }
            
            .otp-container {
              font-size: 32px;
              letter-spacing: 10px;
              padding: 20px;
            }
            
            .button {
              padding: 14px 30px;
              font-size: 15px;
            }
            
            .social-links {
              gap: 15px;
            }
            
            .social-icon {
              width: 40px;
              height: 40px;
              font-size: 14px;
            }
            
            .order-details {
              padding: 20px;
            }
          }
          
          @media only screen and (max-width: 480px) {
            .otp-container {
              font-size: 28px;
              letter-spacing: 8px;
            }
            
            .company-name {
              font-size: 22px;
            }
            
            .detail-row {
              flex-direction: column;
              gap: 5px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo-container">
              <img src="${this.getLogoUrl()}" alt="TheNimantran Logo" class="logo">
            </div>
            <div class="company-name">TheNimantran.com</div>
            <div class="tagline">Elegant Invitations & Gifts</div>
          </div>
          ${htmlContent}
        </div>
      </body>
      </html>
    `;
  }

  static registrationOTP(name:string, otp:string) {
    const content = `
      <div class="content">
        <h2>Welcome to TheNimantran!</h2>
        <p>Dear ${name},</p>
        <p>Thank you for registering with TheNimantran.com. To complete your registration, please use the OTP below:</p>
        
        <div class="otp-container">
          ${otp}
        </div>
        
        <p>This OTP is valid for 10 minutes. Please do not share this code with anyone.</p>
        <p>If you didn't create an account with us, please ignore this email.</p>
        
        <p>Best regards,<br>TheNimantran Team</p>
      </div>
      
      <div class="footer">
        <p>Need help? Contact our support team at support@thenimantran.com</p>
        <div class="social-links">
          <a href="https://facebook.com/thenimantran" class="social-icon">Facebook</a> |
          <a href="https://instagram.com/thenimantran" class="social-icon">Instagram</a> |
          <a href="https://twitter.com/thenimantran" class="social-icon">Twitter</a>
        </div>
        <p>© ${new Date().getFullYear()} TheNimantran.com. All rights reserved.</p>
      </div>
    `;
    
    return this.getBaseTemplate(content, 'Complete Your Registration - TheNimantran');
  }

  static loginOTP(name:string, otp:string) {
    const content = `
      <div class="content">
        <h2>Login Verification</h2>
        <p>Hello ${name},</p>
        <p>We received a login request for your account. Use the OTP below to verify your identity:</p>
        
        <div class="otp-container">
          ${otp}
        </div>
        
        <p>This OTP is valid for 5 minutes. If you didn't attempt to login, please secure your account immediately.</p>
        
        <p>Stay secure,<br>TheNimantran Security Team</p>
      </div>
      
      <div class="footer">
        <p>If you suspect any unauthorized activity, contact us immediately at security@thenimantran.com</p>
        <p>© ${new Date().getFullYear()} TheNimantran.com. All rights reserved.</p>
      </div>
    `;
    
    return this.getBaseTemplate(content, 'Login Verification - TheNimantran');
  }
  static passwordResetOTP(name:string, otp:string) {
    const content = `
      <div class="content">
        <h2>🔐 Password Reset Verification</h2>
        <p>Hello ${name},</p>
        <p>We received a request to reset your password. To verify it's you, please use the OTP below:</p>
        
        <div class="otp-container">
          ${otp}
        </div>
        
        <p style="margin: 20px 0; padding: 15px; background-color: #fff3cd; border-radius: 5px; border-left: 4px solid #ffc107;">
          <strong>⚠️ Security Alert:</strong> This OTP is valid for 10 minutes only. 
          If you didn't request a password reset, please ignore this email and secure your account immediately.
        </p>
        
        <p>Once verified, you'll be able to set a new password for your account.</p>
        
        <p>Stay secure,<br>TheNimantran Security Team</p>
      </div>
      
      <div class="footer">
        <p>If you suspect any unauthorized access, contact us immediately at security@thenimantran.com</p>
        <p>© ${new Date().getFullYear()} TheNimantran.com. All rights reserved.</p>
      </div>
    `;
    
    return this.getBaseTemplate(content, 'Password Reset Verification - TheNimantran');
  }

  static verifyOrderOTP(otp:string) {
    const content = `
      <div class="content">
        <h2>✅ Order Verification Required</h2>
        <p>Your order has been processed successfully! To complete the verification process, please use the OTP below:</p>
        
        <div class="otp-container">
          ${otp}
        </div>
        
     
  
        
        <p style="margin: 20px 0; padding: 15px; background-color: #e7f4ff; border-radius: 5px; border-left: 4px solid #007bff;">
          <strong>📝 Note:</strong> Please provide this OTP to further confirm your order and avoid any fraud. 
          This is required to complete the delivery process via Cash on Delivery.
        </p>
        

        
        <p>Thank you for shopping with us!<br>TheNimantran Team</p>
      </div>
      
      <div class="footer">
        <p>For delivery-related queries, contact us at delivery@thenimantran.com or call +91-XXXXXXXXXX</p>
        <p>© ${new Date().getFullYear()} TheNimantran.com. All rights reserved.</p>
      </div>
    `;
    
    return this.getBaseTemplate(content, `Order Verification - TheNimantran.com`);
  }

  static orderCancelled(order: any) {
    const content = `
      <div class="content">
        <h2>❌ Order Cancelled</h2>
        <p>Dear ${order.customerName},</p>
        <p>Your order has been cancelled as per your request. Here are the details:</p>
        
        <div class="order-details">
          <h3>Cancelled Order Details</h3>
          <div class="detail-row">
            <span>Order ID:</span>
            <strong>${order.orderId}</strong>
          </div>
          <div class="detail-row">
            <span>Order Date:</span>
            <span>${new Date(order.orderDate).toLocaleDateString()}</span>
          </div>
          <div class="detail-row">
            <span>Cancelled On:</span>
            <span>${new Date().toLocaleDateString()}</span>
          </div>
          <div class="detail-row">
            <span>Refund Amount:</span>
            <strong>₹${order.refundAmount || order.totalAmount}</strong>
          </div>
          <div class="detail-row">
            <span>Refund Method:</span>
            <span>${order.refundMethod || 'Original payment method'}</span>
          </div>
        </div>
        
        <p style="margin: 20px 0; padding: 15px; background-color: #f8d7da; border-radius: 5px; border-left: 4px solid #dc3545;">
          <strong>💰 Refund Status:</strong> Your refund has been initiated and will be processed within 7-10 business days.
        </p>
        
        <p>We're sorry to see you go! If there's anything we can do better, please let us know.</p>
        
        <center>
          <a href="${process.env.BASE_URL}/shop" class="button">Continue Shopping</a>
        </center>
        
        <p>Hope to see you again soon!<br>TheNimantran Team</p>
      </div>
      
      <div class="footer">
        <p>For refund-related queries, contact us at payments@thenimantran.com</p>
        <p>© ${new Date().getFullYear()} TheNimantran.com. All rights reserved.</p>
      </div>
    `;
    
    return this.getBaseTemplate(content, `Order Cancelled #${order.orderId} - TheNimantran`);
  }

  static orderReturnRequested(order: any) {
    const content = `
      <div class="content">
        <h2>📦 Return Request Received</h2>
        <p>Dear ${order.customerName},</p>
        <p>We have received your return request. Here are the details:</p>
        
        <div class="order-details">
          <h3>Return Details</h3>
          <div class="detail-row">
            <span>Order ID:</span>
            <strong>${order.orderId}</strong>
          </div>
          <div class="detail-row">
            <span>Return ID:</span>
            <strong>RET-${order.returnId}</strong>
          </div>
          <div class="detail-row">
            <span>Request Date:</span>
            <span>${new Date().toLocaleDateString()}</span>
          </div>
          <div class="detail-row">
            <span>Return Reason:</span>
            <span>${order.returnReason}</span>
          </div>
          <div class="detail-row">
            <span>Items to Return:</span>
            <span>${order.itemCount} item(s)</span>
          </div>
        </div>
        
        <p style="margin: 20px 0; padding: 15px; background-color: #e7f4ff; border-radius: 5px; border-left: 4px solid #007bff;">
          <strong>📋 Next Steps:</strong><br>
          1. Our team will verify your request within 24 hours<br>
          2. You'll receive pickup details once approved<br>
          3. Refund will be processed after quality check
        </p>
        
        <center>
          <a href="${process.env.BASE_URL}/returns/${order.returnId}/track" class="button">Track Return Status</a>
        </center>
        
        <p>We apologize for any inconvenience caused.<br>TheNimantran Support Team</p>
      </div>
      
      <div class="footer">
        <p>For return-related queries, contact us at returns@thenimantran.com</p>
        <p>© ${new Date().getFullYear()} TheNimantran.com. All rights reserved.</p>
      </div>
    `;
    
    return this.getBaseTemplate(content, `Return Request #${order.returnId} - TheNimantran`);
  }

  static subscriptionConfirmation(subscription: any) {
    const content = `
      <div class="content">
        <h2>🎁 Subscription Confirmed!</h2>
        <p>Dear ${subscription.customerName},</p>
        <p>Thank you for subscribing to our ${subscription.planName}! Your subscription has been activated successfully.</p>
        
        <div class="order-details">
          <h3>Subscription Details</h3>
          <div class="detail-row">
            <span>Subscription ID:</span>
            <strong>${subscription.subscriptionId}</strong>
          </div>
          <div class="detail-row">
            <span>Plan Name:</span>
            <strong>${subscription.planName}</strong>
          </div>
          <div class="detail-row">
            <span>Start Date:</span>
            <span>${new Date(subscription.startDate).toLocaleDateString()}</span>
          </div>
          <div class="detail-row">
            <span>Renewal Date:</span>
            <span>${new Date(subscription.renewalDate).toLocaleDateString()}</span>
          </div>
          <div class="detail-row">
            <span>Amount:</span>
            <strong>₹${subscription.amount}/${subscription.billingCycle}</strong>
          </div>
          <div class="detail-row">
            <span>Payment Method:</span>
            <span>${subscription.paymentMethod}</span>
          </div>
        </div>
        
        <p style="margin: 20px 0; padding: 15px; background-color: #d4edda; border-radius: 5px; border-left: 4px solid #28a745;">
          <strong>✨ Benefits Activated:</strong><br>
          ${subscription.benefits.map((benefit: string) => `• ${benefit}`).join('<br>')}
        </p>
        
        <center>
          <a href="${process.env.BASE_URL}/subscriptions/manage" class="button">Manage Subscription</a>
        </center>
        
        <p>Welcome to our premium family!<br>TheNimantran Team</p>
      </div>
      
      <div class="footer">
        <p>To modify or cancel your subscription, visit your account dashboard</p>
        <p>© ${new Date().getFullYear()} TheNimantran.com. All rights reserved.</p>
      </div>
    `;
    
    return this.getBaseTemplate(content, `Subscription Confirmed - TheNimantran`);
  }

  static orderConfirmation(order: any) {
    const content = `
      <div class="content">
        <h2>🎉 Order Confirmed!</h2>
        <p>Dear ${order.user.name || "N/A"}</p>
        <p>Thank you for your order! We're excited to let you know that we've received your order and it's being processed.</p>
        
        <div class="order-details">
          <h3>Order Details</h3>
          <div class="detail-row">
            <span>Order ID:</span>
            <strong>${order.orderId}</strong>
          </div>
          <div class="detail-row">
            <span>Order Date:</span>
            <span>${new Date(order.createdAt).toLocaleDateString()}</span>
          </div>
          <div class="detail-row">
            <span>Total Amount:</span>
            <strong>₹${order.finalAmount}</strong>
          </div>
          <div class="detail-row">
            <span>Payment Method:</span>
            <span>${order.paymentMethod}</span>
          </div>
          <div class="detail-row">
            <span>Delivery Address:</span>
            <span>${order.shippingAddress}</span>
          </div>
        </div>
        
        <p>We'll send you another email when your order ships. You can track your order status from your account.</p>
        
        <center>
          <a href="${process.env.BASE_URL}/orders/${order.orderId}" class="button">Track Your Order</a>
        </center>
        
        <p>Thank you for shopping with us!<br>TheNimantran Team</p>
      </div>
      
      <div class="footer">
        <p>Questions about your order? Contact us at orders@thenimantran.com or call +91-XXXXXXXXXX</p>
        <div class="social-links">
          <a href="https://facebook.com/thenimantran" class="social-icon">Facebook</a> |
          <a href="https://instagram.com/thenimantran" class="social-icon">Instagram</a>
        </div>
        <p>© ${new Date().getFullYear()} TheNimantran.com. All rights reserved.</p>
      </div>
    `;
    
    return this.getBaseTemplate(content, 'Order Confirmed - TheNimantran');
  }

  static orderShipped(order: any) {
    const content = `
      <div class="content">
        <h2>🚚 Your Order is on the Way!</h2>
        <p>Dear ${order.customerName},</p>
        <p>Great news! Your order has been shipped and is on its way to you.</p>
        
        <div class="order-details">
          <h3>Shipping Details</h3>
          <div class="detail-row">
            <span>Order ID:</span>
            <strong>${order.orderId}</strong>
          </div>
          <div class="detail-row">
            <span>Tracking Number:</span>
            <strong>${order.trackingNumber}</strong>
          </div>
          <div class="detail-row">
            <span>Carrier:</span>
            <span>${order.carrier}</span>
          </div>
          <div class="detail-row">
            <span>Estimated Delivery:</span>
            <strong>${order.estimatedDelivery}</strong>
          </div>
        </div>
        
        <center>
          <a href="${order.trackingUrl}" class="button">Track Shipment</a>
        </center>
        
        <p>We hope you enjoy your purchase!<br>TheNimantran Team</p>
      </div>
      
      <div class="footer">
        <p>Need help with delivery? Contact our delivery team at delivery@thenimantran.com</p>
        <p>© ${new Date().getFullYear()} TheNimantran.com. All rights reserved.</p>
      </div>
    `;
    
    return this.getBaseTemplate(content, 'Your Order is Shipped - TheNimantran');
  }

  static orderDelivered(order: any) {
    const content = `
      <div class="content">
        <h2>✅ Order Delivered Successfully!</h2>
        <p>Dear ${order.customerName},</p>
        <p>Your order has been delivered successfully. We hope you're happy with your purchase!</p>
        
        <div class="order-details">
          <h3>Delivery Details</h3>
          <div class="detail-row">
            <span>Order ID:</span>
            <strong>${order.orderId}</strong>
          </div>
          <div class="detail-row">
            <span>Delivered On:</span>
            <span>${new Date().toLocaleDateString()}</span>
          </div>
          <div class="detail-row">
            <span>Delivery Address:</span>
            <span>${order.shippingAddress}</span>
          </div>
        </div>
        
        <p>We'd love to hear about your experience! Please consider leaving a review.</p>
        
        <center>
          <a href="${process.env.BASE_URL}/orders/${order.orderId}/review" class="button">Leave a Review</a>
        </center>
        
        <p>Thank you for choosing TheNimantran!<br>TheNimantran Team</p>
      </div>
      
      <div class="footer">
        <p>Not satisfied with your order? Contact customer support within 7 days for returns.</p>
        <p>© ${new Date().getFullYear()} TheNimantran.com. All rights reserved.</p>
      </div>
    `;
    
    return this.getBaseTemplate(content, 'Order Delivered - TheNimantran');
  }

  static newOrderAdmin(order: any) {
    const content = `
      <div class="content">
        <h2>🛒 New Order Received!</h2>
        <p>Dear Admin Team,</p>
        <p>A new order has been placed on TheNimantran.com. Please process it immediately.</p>
        
        <div class="order-details">
          <h3>Order Information</h3>
          <div class="detail-row">
            <span>Order ID:</span>
            <strong>${order.orderId}</strong>
          </div>
          <div class="detail-row">
            <span>Customer Name:</span>
            <span>${order.customerName}</span>
          </div>
          <div class="detail-row">
            <span>Customer Email:</span>
            <span>${order.customerEmail}</span>
          </div>
          <div class="detail-row">
            <span>Order Total:</span>
            <strong>₹${order.totalAmount}</strong>
          </div>
          <div class="detail-row">
            <span>Items:</span>
            <span>${order.itemCount} items</span>
          </div>
          <div class="detail-row">
            <span>Shipping Address:</span>
            <span>${order.shippingAddress}</span>
          </div>
        </div>
        
        <center>
          <a href="${process.env.ADMIN_URL}/orders/${order.orderId}" class="button">View Order Details</a>
        </center>
        
        <p>Please ensure timely processing and shipping.<br>TheNimantran System</p>
      </div>
      
      <div class="footer">
        <p>This is an automated notification. Please check the admin panel for more details.</p>
        <p>© ${new Date().getFullYear()} TheNimantran.com. All rights reserved.</p>
      </div>
    `;
    
    return this.getBaseTemplate(content, 'New Order Alert - TheNimantran');
  }

  static passwordReset(name: string, resetLink: string) {
    const content = `
      <div class="content">
        <h2>🔐 Password Reset Request</h2>
        <p>Hello ${name},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        
        <center>
          <a href="${resetLink}" class="button">Reset Password</a>
        </center>
        
        <p>This link will expire in 30 minutes. If you didn't request a password reset, please ignore this email.</p>
        
        <p>For security, never share your password with anyone.<br>TheNimantran Security Team</p>
      </div>
      
      <div class="footer">
        <p>If you're having trouble clicking the button, copy and paste this URL: ${resetLink}</p>
        <p>© ${new Date().getFullYear()} TheNimantran.com. All rights reserved.</p>
      </div>
    `;
    
    return this.getBaseTemplate(content, 'Password Reset - TheNimantran');
  }

  static welcomeEmail(name: string) {
    const content = `
      <div class="content">
        <h2>🌟 Welcome to TheNimantran Family!</h2>
        <p>Dear ${name},</p>
        <p>We're thrilled to welcome you to TheNimantran.com! Your account has been successfully created.</p>
        
        <p>Here's what you can do now:</p>
        <ul style="margin: 20px 0; padding-left: 20px;">
          <li>Browse our exclusive collection</li>
          <li>Save items to your wishlist</li>
          <li>Track your orders</li>
          <li>Enjoy special member discounts</li>
        </ul>
        
        <center>
          <a href="${process.env.BASE_URL}/shop" class="button">Start Shopping</a>
        </center>
        
        <p>As a welcome gift, use code <strong>WELCOME10</strong> to get 10% off on your first order!</p>
        
        <p>Happy shopping!<br>TheNimantran Team</p>
      </div>
      
      <div class="footer">
        <div class="social-links">
          <a href="https://facebook.com/thenimantran" class="social-icon">Follow us on Facebook</a><br>
          <a href="https://instagram.com/thenimantran" class="social-icon">Follow us on Instagram</a>
        </div>
        <p>© ${new Date().getFullYear()} TheNimantran.com. All rights reserved.</p>
      </div>
    `;
    
    return this.getBaseTemplate(content, 'Welcome to TheNimantran!');
  }
}

// module.exports = EmailTemplates;
export {EmailTemplates}