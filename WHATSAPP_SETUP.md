# WhatsApp Business API Setup Guide

This document explains how to configure and test the WhatsApp chatbot integration for BOB Home Care.

## Features

The WhatsApp integration provides three main features:

1. **Booking Confirmations** - Instant WhatsApp message sent when a customer creates a booking
2. **24-Hour Reminders** - Automated reminder sent 24 hours before the scheduled appointment
3. **Interactive Chatbot** - Customers can chat with the bot to get information and make reservations

## Credentials Already Configured

The following Meta WhatsApp Business API credentials have been added to the environment:

- `META_WHATSAPP_ACCESS_TOKEN` - Your temporary access token from Meta
- `META_WHATSAPP_PHONE_NUMBER_ID` - 858040727398377
- `META_WHATSAPP_API_VERSION` - v22.0

## Webhook Configuration

### Step 1: Get Your Webhook URL

Your webhook is available at:
```
https://your-production-domain.com/api/whatsapp/webhook
```

For development/testing, you can use ngrok or similar tools to expose your local server.

### Step 2: Configure Webhook in Meta App Dashboard

1. Go to https://developers.facebook.com/apps
2. Select your "BOB Home Care" app
3. Navigate to **WhatsApp → Configuration**
4. Click **Edit** next to "Webhook"
5. Enter your webhook URL: `https://your-domain.com/api/whatsapp/webhook`
6. Enter the verify token: `BOB_HOME_CARE_VERIFY_TOKEN_2024`
7. Click **Verify and Save**
8. Subscribe to the following webhook fields:
   - ✅ messages
   - ✅ message_status

### Step 3: Test the Webhook

1. Send a WhatsApp message to your test number: `+1 555 162 1059`
2. Try these commands:
   - `hi` or `hello` - Show main menu
   - `1` or `services` - List all available services
   - `2` or `book` - Get booking instructions
   - `3` or `contact` - Get contact information

## Chatbot Commands

The chatbot supports both English and Arabic:

| Command | Arabic | Action |
|---------|--------|--------|
| `hi`, `hello`, `menu`, `help` | `مرحبا` | Show main menu |
| `1`, `services` | `خدمات` | List all services |
| `2`, `book`, `booking` | `حجز` | Booking instructions |
| `3`, `contact` | `تواصل` | Contact information |

## Testing the Integration

### Test Booking Confirmation

1. Create a booking through the website
2. Check that a WhatsApp confirmation message is sent to the customer's phone number
3. Verify the message includes booking details (service, date, time)

### Test 24-Hour Reminder

The reminder job needs to be scheduled to run hourly. You can test it manually:

```bash
cd /home/ubuntu/housekeeping-service-website
node server/jobs/sendBookingReminders.mjs
```

This will send reminders to all bookings scheduled for tomorrow.

### Test Chatbot

1. Send a WhatsApp message to your business number
2. Try the commands listed above
3. Verify responses are in both English and Arabic

## Production Deployment

### 1. Deploy the Reminder Cron Job

The reminder job (`server/jobs/sendBookingReminders.ts`) needs to run hourly. Options:

**Option A: Vercel Cron (Recommended)**
```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/send-reminders",
    "schedule": "0 * * * *"
  }]
}
```

**Option B: GitHub Actions**
```yaml
# .github/workflows/reminders.yml
name: Send Booking Reminders
on:
  schedule:
    - cron: '0 * * * *'
jobs:
  send-reminders:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: node server/jobs/sendBookingReminders.mjs
```

**Option C: External Cron Service**
Use https://cron-job.org to call your webhook endpoint hourly.

### 2. Update Webhook URL

After deploying to production, update the webhook URL in Meta App Dashboard to point to your production domain.

### 3. Get Permanent Access Token

The current access token is temporary (90 days). To get a permanent token:

1. Go to Meta Business Manager → System Users
2. Create a system user with WhatsApp permissions
3. Generate a permanent token (never expires)
4. Update `META_WHATSAPP_ACCESS_TOKEN` environment variable

## Troubleshooting

### Messages Not Sending

1. Check that credentials are correctly set in environment variables
2. Verify the phone number is in international format (e.g., +971501234567)
3. Check server logs for error messages
4. Ensure the recipient's number is verified in Meta App Dashboard (for test numbers)

### Webhook Not Receiving Messages

1. Verify webhook URL is publicly accessible
2. Check that verify token matches: `BOB_HOME_CARE_VERIFY_TOKEN_2024`
3. Ensure webhook fields are subscribed (messages, message_status)
4. Check server logs at `/api/whatsapp/webhook`

### Chatbot Not Responding

1. Check that incoming messages are being received in webhook logs
2. Verify database connection is working (chatbot fetches services from DB)
3. Test with simple commands like `hi` or `menu`

## Notification Preferences

The system respects user notification preferences:

- Users can disable WhatsApp notifications in their profile settings
- Booking confirmations and reminders will only be sent if the user has `whatsappNotifications` enabled
- Chatbot responses are always sent (they are user-initiated)

## Rate Limits

Meta WhatsApp Business API has the following limits:

- **Test Numbers**: 5 recipients, 250 messages per day
- **Production**: Based on your business verification tier
- **Rate Limit**: 80 messages per second (burst), 20 messages per second (sustained)

## Support

For issues with the WhatsApp integration, check:

- Meta WhatsApp Business Platform documentation: https://developers.facebook.com/docs/whatsapp
- Server logs for error messages
- Meta App Dashboard for webhook delivery status
