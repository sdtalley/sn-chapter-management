# SN Chapter Management System

A comprehensive web application for managing Sigma Nu chapter operations through seamless integration with Blackbaud SKY API. This system provides chapter administrators and members with a unified interface for all essential chapter management functions.

## 🚀 Features

### Core Chapter Management Functions

1. **Verify Candidates Information**
   - Validate and update candidate records
   - Submit batch changes for multiple candidates
   - Track candidate fee payment status
   - Manage candidate progression through the program

2. **Verify Initiates Information**
   - Verify initiate records and status
   - Process batch updates for initiates
   - Track initiation fee payments
   - Manage initiate roster information

3. **Roster Information**
   - View complete chapter roster (candidates and initiates)
   - Update member status (Alumni, De-pledge, etc.)
   - Process batch status changes with effective dates
   - Track member progression and history

4. **Returning Students**
   - Add returning students back to active roster
   - Restore members previously marked as Alumni (Left School) or De-pledged
   - Manage affiliate transfers from other chapters

5. **Officer Information**
   - View current chapter officers and their positions
   - Update officer assignments
   - Track officer terms and transitions
   - Manage officer contact information

6. **Chapter Contact Information**
   - Update chapter physical and mailing addresses
   - Manage chapter phone numbers
   - Maintain current contact details for national headquarters

7. **Fee Status**
   - Review candidate fee payment status
   - Check initiate fee payment status
   - View comprehensive fee status reports
   - Identify members with outstanding fees

8. **Admin Panel**
   - Configure Blackbaud API credentials
   - Test API connections and endpoints
   - Monitor authentication status
   - Manage system configuration

### Technical Features

- **Modular Architecture** - Clean separation of concerns with organized file structure
- **Single Page Application (SPA)** - Fast, responsive navigation without page reloads
- **Perpetual Authentication** - Automatic token refresh ensures uninterrupted access
- **Rate Limiting** - Built-in rate limiting (10 API calls/second) prevents API throttling
- **URL Parameter Support** - Dynamic chapter and member identification via URL parameters
- **Service Account Integration** - Secure server-side authentication with Blackbaud SKY API
- **Responsive Design** - Optimized for desktop and mobile devices
- **Redis Caching** - Efficient caching using Upstash Redis for improved performance
- **View-Only Mode** - Support for different access levels (STS parameters)

## 📁 Project Structure

```
sn-chapter-management/
├── public/
│   ├── index.html          # Main application HTML
│   ├── reauth.html         # Blackbaud reauthorization page
│   ├── css/
│   │   └── styles.css      # Application styles
│   └── js/
│       ├── main.js         # Core initialization & navigation
│       ├── api.js          # API communication with rate limiting
│       ├── queries.js      # Query builders for Blackbaud API
│       ├── candidates.js   # Verify candidates functionality
│       ├── initiates.js    # Verify initiates functionality
│       ├── roster.js       # Roster management
│       ├── returning.js    # Returning students management
│       ├── officers.js     # Officer management
│       ├── contact.js      # Contact information management
│       ├── fees.js         # Fee status tracking
│       ├── admin.js        # Admin panel functionality
│       └── utils.js        # Shared utility functions
├── api/
│   ├── blackbaud.js        # Server-side Blackbaud API proxy
│   └── chapter-records.js  # Chapter lookup data
├── package.json            # Project dependencies
├── vercel.json            # Vercel deployment configuration
└── README.md              # This file
```

## 🚀 Quick Start

### Access the Application

The application can be accessed with chapter-specific parameters:

```
https://your-app.vercel.app?sid=12345&chapter=ALPHA&sts=1&offname=John%20Doe
```

**URL Parameters:**
- `sid` - Student/Member ID (required for most functions)
- `chapter` - Chapter identifier (e.g., ALPHA, BETA)
- `sts` - Security/Status level (0-4, determines access permissions)
- `offname` - Officer name (for officer-specific functions)

### Access Levels (STS Parameter)

- **STS 0, 3, 4** - Full access to all functions (requires chapter parameter)
- **STS 1** - Standard access with edit capabilities
- **STS 2** - View-only access (cannot submit changes)

## 💻 Installation & Deployment

### Prerequisites

- Node.js 22.x or higher
- Blackbaud Developer Account with SKY API access
- GitHub account
- Vercel account (free tier sufficient)
- Upstash Redis account (for caching)

### Blackbaud API Setup

1. **Create Developer Account**
   - Visit [developer.blackbaud.com](https://developer.blackbaud.com)
   - Sign up for a developer account

2. **Create Application**
   - Create a new application in your developer portal
   - Set application type to "Confidential"
   - Enable "Client Credentials" grant type
   - Save your Client ID and Client Secret

3. **Subscribe to SKY API**
   - Subscribe to required SKY API services
   - Note your Subscription Key

### Local Development

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/sn-chapter-management.git
cd sn-chapter-management

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local with your credentials:
# BLACKBAUD_CLIENT_ID=your_client_id
# BLACKBAUD_CLIENT_SECRET=your_client_secret
# BLACKBAUD_SUBSCRIPTION_KEY=your_subscription_key
# KV_REST_API_URL=your_upstash_redis_url
# KV_REST_API_TOKEN=your_upstash_redis_token

# Start development server
npm run dev
```

### Deployment to Vercel

#### Option 1: GitHub Integration (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial deployment"
   git push origin main
   ```

2. **Deploy via Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Import your repository
   - Click "Deploy"

3. **Configure Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add all required variables:
     - `BLACKBAUD_CLIENT_ID`
     - `BLACKBAUD_CLIENT_SECRET`
     - `BLACKBAUD_SUBSCRIPTION_KEY`
     - `KV_REST_API_URL` (from Upstash)
     - `KV_REST_API_TOKEN` (from Upstash)

4. **Connect Upstash Redis**
   - In Vercel dashboard, go to Storage
   - Connect Upstash KV store
   - This automatically sets KV environment variables

#### Option 2: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Set environment variables
vercel env add BLACKBAUD_CLIENT_ID
vercel env add BLACKBAUD_CLIENT_SECRET
vercel env add BLACKBAUD_SUBSCRIPTION_KEY

# Redeploy with environment variables
vercel --prod
```

## 🔧 Configuration

### Environment Variables

Required environment variables for production:

```env
# Blackbaud API Credentials
BLACKBAUD_CLIENT_ID=your_client_id_here
BLACKBAUD_CLIENT_SECRET=your_client_secret_here
BLACKBAUD_SUBSCRIPTION_KEY=your_subscription_key_here

# Upstash Redis (auto-configured when connected via Vercel)
KV_REST_API_URL=your_upstash_url
KV_REST_API_TOKEN=your_upstash_token
```

### Rate Limiting Configuration

The application implements automatic rate limiting for Blackbaud API calls:
- Maximum 10 API calls per second
- Automatic queuing of excess requests
- Transparent to the user experience
- Configurable in `api.js`

## 📖 Usage Guide

### First-Time Setup

1. **Access Admin Panel**
   - Navigate to the main page
   - Click the "Admin" button
   
2. **Configure API Credentials** (if not using environment variables)
   - Enter Blackbaud Client ID
   - Enter Blackbaud Client Secret
   - Enter SKY API Subscription Key
   
3. **Authenticate**
   - Click "Authenticate & Get Token"
   - Verify successful authentication
   
4. **Return to Main Menu**
   - Use back button to access chapter functions

### Using Chapter Functions

#### Verify Candidates
1. Click "Verify Candidates Information"
2. System loads current candidates automatically
3. Make necessary changes to candidate information
4. Click "Submit All Changes" to process updates

#### Verify Initiates
1. Click "Verify Initiates Information"
2. Review loaded initiate data
3. Update information as needed
4. Submit batch changes

#### Roster Management
1. Click "Roster Information"
2. View complete chapter roster
3. Select status changes for members:
   - Alumni (Graduated)
   - Alumni (Left School)
   - De-pledge
4. Set effective dates for changes
5. Submit all changes at once

#### Returning Students
1. Click "Returning Students"
2. Search for previously inactive members
3. Select members to reactivate
4. Process reactivation

#### Officer Information
1. Click "Officer Information"
2. View current officer assignments
3. Update officer positions as needed
4. Submit changes

#### Fee Status
1. Click "Fee Status"
2. Review payment status for all members
3. Identify members with outstanding fees
4. Export data as needed

## 🔒 Security

### Data Protection
- All API credentials stored as environment variables
- No sensitive data exposed in client-side code
- HTTPS enforced for all communications
- Server-side proxy prevents direct API access

### Access Control
- Service account authentication (no individual user login required)
- Chapter-specific data access via URL parameters
- View-only mode for restricted access
- Admin functions separated from user functions

## 🐛 Troubleshooting

### Common Issues

**Authentication Failures**
- Verify API credentials are correct
- Check environment variables are properly set
- Ensure Blackbaud application has proper permissions
- Confirm SKY API subscription is active

**API Call Errors**
- Check token expiration and refresh status
- Verify endpoint URLs and parameters
- Review rate limiting queue in console
- Check Blackbaud API documentation for endpoint changes

**Deployment Issues**
- Confirm all environment variables are set in Vercel
- Check build logs for errors
- Verify `vercel.json` configuration
- Ensure Node.js version compatibility (22.x)

**Data Not Loading**
- Verify chapter parameter is correct
- Check member has proper permissions (STS level)
- Confirm data exists in Blackbaud system
- Review browser console for errors

### Debug Mode

Enable debug mode by adding `?debug=true` to the URL for verbose console logging.

### Getting Help

1. **Check Status Messages** - Application displays detailed status for all operations
2. **Console Logs** - Browser console provides detailed debugging information
3. **Admin Panel** - Test API calls and view token information
4. **Vercel Logs** - Check function logs for server-side errors
5. **Documentation** - [Blackbaud SKY API Docs](https://developer.blackbaud.com)

## 🔄 Development Workflow

### Adding New Features

1. **Create New Module**
   ```javascript
   // public/js/newfeature.js
   const NewFeatureModule = (function() {
       return {
           init: function() {
               // Initialization code
           },
           load: async function() {
               // Load data
           }
       };
   })();
   ```

2. **Add HTML Structure**
   - Add new page div in `index.html`
   - Include navigation button

3. **Update Navigation**
   - Add button handler in `main.js`
   - Include module script tag

4. **Test Locally**
   - Run `npm run dev`
   - Test all functionality

### Code Style Guidelines

- Use modular pattern for JavaScript modules
- Implement rate limiting for all API calls
- Add comprehensive error handling
- Include console logging for debugging
- Follow existing naming conventions
- Comment complex logic

## 📊 Performance Optimization

### Implemented Optimizations

- **Rate Limiting** - Prevents API throttling with intelligent queuing
- **Redis Caching** - Reduces redundant API calls
- **Modular Loading** - Only loads necessary code
- **Batch Processing** - Groups multiple updates into single operations
- **Efficient Queries** - Optimized Blackbaud query structures

### Monitoring

- Check browser console for timing information
- Monitor Vercel Analytics for performance metrics
- Review Upstash Redis dashboard for cache hits
- Track API usage in Blackbaud developer portal

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/NewFeature`)
3. Commit changes (`git commit -m 'Add NewFeature'`)
4. Push to branch (`git push origin feature/NewFeature`)
5. Open a Pull Request

### Contribution Guidelines

- Follow existing code structure
- Add appropriate error handling
- Include console logging for debugging
- Test thoroughly before submitting
- Update documentation as needed

## 📄 License

This project is proprietary software for Sigma Nu Fraternity chapter management.

## 🆘 Support

For technical support or questions:
- **Blackbaud API Issues**: [developer.blackbaud.com/support](https://developer.blackbaud.com)
- **Chapter-Specific Issues**: Contact your chapter administrator
- **Technical Implementation**: Review console logs and status messages

## 🔮 Future Enhancements

Planned improvements include:
- Enhanced reporting capabilities
- Bulk import/export functionality
- Advanced search and filtering
- Mobile app development
- Real-time notifications
- Analytics dashboard
- Automated report generation

---

**Version**: 1.0.0  
**Last Updated**: 2025  
**Maintained By**: SN Chapter Technology Team