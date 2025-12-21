// services/emailTemplates.js
class EmailTemplates {
  static getLogoUrl() {
    // Use your company logo URL or base64 encoded image
    return process.env.LOGO_URL || 'https://thenimantran.com/logo.png';
  }

  static getBaseTemplate(htmlContent, title) {
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
            font-family: 'Arial', sans-serif;
          }
          
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          }
          
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px 20px;
            text-align: center;
          }
          
          .logo {
            max-width: 200px;
            height: auto;
            margin-bottom: 20px;
          }
          
          .company-name {
            color: white;
            font-size: 28px;
            font-weight: bold;
            margin-top: 10px;
          }
          
          .content {
            padding: 40px 30px;
            color: #333333;
            line-height: 1.6;
          }
          
          .otp-container {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            margin: 30px 0;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 10px;
          }
          
          .button {
            display: inline-block;
            padding: 14px 32px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 30px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
          }
          
          .order-details {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #eaeaea;
          }
          
          .detail-row:last-child {
            border-bottom: none;
          }
          
          .footer {
            background-color: #f8f9fa;
            padding: 30px;
            text-align: center;
            color: #666666;
            font-size: 14px;
          }
          
          .social-links {
            margin: 20px 0;
          }
          
          .social-icon {
            display: inline-block;
            margin: 0 10px;
            color: #667eea;
            text-decoration: none;
          }
          
          @media only screen and (max-width: 600px) {
            .content {
              padding: 20px 15px;
            }
            
            .otp-container {
              font-size: 24px;
              letter-spacing: 5px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <img src="${this.getLogoUrl()}" alt="TheNimantran Logo" class="logo">
            <div class="company-name">TheNimantran.com</div>
          </div>
          ${htmlContent}
        </div>
      </body>
      </html>
    `;
  }

  static registrationOTP(name, otp) {
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

  static loginOTP(name, otp) {
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
  static passwordResetOTP(name, otp) {
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

  static verifyOrderOTP(order) {
    const content = `
      <div class="content">
        <h2>✅ Order Verification Required</h2>
        <p>Dear ${order.customerName},</p>
        <p>Your order has been processed successfully! To complete the verification process, please use the OTP below:</p>
        
        <div class="otp-container">
          ${order.otp}
        </div>
        
        <div class="order-details">
          <h3>Order Summary</h3>
          <div class="detail-row">
            <span>Order ID:</span>
            <strong>${order.orderId}</strong>
          </div>
          <div class="detail-row">
            <span>Order Date:</span>
            <span>${new Date(order.orderDate).toLocaleDateString()}</span>
          </div>
          <div class="detail-row">
            <span>Total Amount:</span>
            <strong>₹${order.totalAmount}</strong>
          </div>
          <div class="detail-row">
            <span>Items:</span>
            <span>${order.itemCount || '1'} item(s)</span>
          </div>
          <div class="detail-row">
            <span>Delivery Address:</span>
            <span>${order.shippingAddress}</span>
          </div>
        </div>
        
        <p style="margin: 20px 0; padding: 15px; background-color: #e7f4ff; border-radius: 5px; border-left: 4px solid #007bff;">
          <strong>📝 Note:</strong> Please provide this OTP to our delivery executive when you receive your order. 
          This is required to complete the delivery process.
        </p>
        
        <center>
          <a href="${process.env.BASE_URL}/orders/${order.orderId}/track" class="button">Track Your Order</a>
        </center>
        
        <p>Thank you for shopping with us!<br>TheNimantran Team</p>
      </div>
      
      <div class="footer">
        <p>For delivery-related queries, contact us at delivery@thenimantran.com or call +91-XXXXXXXXXX</p>
        <p>© ${new Date().getFullYear()} TheNimantran.com. All rights reserved.</p>
      </div>
    `;
    
    return this.getBaseTemplate(content, `Order Verification #${order.orderId} - TheNimantran`);
  }

  static orderCancelled(order) {
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

  static orderReturnRequested(order) {
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

  static subscriptionConfirmation(subscription) {
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
          ${subscription.benefits.map(benefit => `• ${benefit}`).join('<br>')}
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

  static orderConfirmation(order) {
    const content = `
      <div class="content">
        <h2>🎉 Order Confirmed!</h2>
        <p>Dear ${order.customerName},</p>
        <p>Thank you for your order! We're excited to let you know that we've received your order and it's being processed.</p>
        
        <div class="order-details">
          <h3>Order Details</h3>
          <div class="detail-row">
            <span>Order ID:</span>
            <strong>${order.orderId}</strong>
          </div>
          <div class="detail-row">
            <span>Order Date:</span>
            <span>${new Date(order.orderDate).toLocaleDateString()}</span>
          </div>
          <div class="detail-row">
            <span>Total Amount:</span>
            <strong>₹${order.totalAmount}</strong>
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

  static orderShipped(order) {
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

  static orderDelivered(order) {
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

  static newOrderAdmin(order) {
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

  static passwordReset(name, resetLink) {
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

  static welcomeEmail(name) {
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