# SN Chapter Management

A web application for managing chapter operations through integration with Blackbaud SKY API. This application provides a streamlined interface for chapter administrators and members to access essential chapter management functions.

## Features

### Main Functions
- **Verify Candidates** - Validate candidate information and status
- **Verify Initiates** - Check initiate records and verification
- **Roster Information** - Access member rosters by type (active, alumni, officers)
- **Officer Information** - View current chapter officer details
- **Chapter Contact Information** - Manage chapter contact details
- **Fee Status** - Check member fee payment status
- **Admin** - Administrative configuration and API testing

### Technical Features
- **Single Page Application (SPA)** - Fast, responsive navigation
- **Perpetual Authentication** - Automatic token refresh for uninterrupted access
- **URL Parameter Support** - Dynamic chapter and member identification via URL
- **Service Account Integration** - Server-side authentication with Blackbaud SKY API
- **Responsive Design** - Works on desktop and mobile devices

## Quick Start

### Access the Application

Visit your deployed application with chapter-specific parameters:
```
https://your-app.vercel.app?sid=12345&chapter=ALPHA
```

**URL Parameters:**
- `sid` - Student/Member ID
- `chapter` - Chapter identifier

### First-Time Setup

1. **Access Admin Panel** - Click the "Admin" button on the main page
2. **Configure API Credentials**:
   - Enter your Blackbaud Client ID
   - Enter your Blackbaud Client Secret
   - Enter your SKY API Subscription Key
3. **Authenticate** - Click "Authenticate & Get Token"
4. **Return to Main Menu** - Use the back button to access chapter functions

### Using Chapter Functions

1. Navigate to any function using the main menu buttons
2. Fill in required information (many fields auto-populate from URL parameters)
3. Click the action button to retrieve data
4. Use the back button to return to the main menu

## Installation & Deployment

### Prerequisites

- Node.js 18.x or higher
- Blackbaud Developer Account
- GitHub account
- Vercel account (free)

### Blackbaud API Setup

1. **Create Developer Account**:
   - Go to [developer.blackbaud.com](https://developer.blackbaud.com)
   - Sign up for a developer account

2. **Create Application**:
   - Create a new application in your developer account
   - Set application type to "Confidential"
   - Enable "Client Credentials" grant type
   - Note your Client ID and Client Secret

3. **Get Subscription Key**:
   - Subscribe to the SKY API
   - Note your Subscription Key

### Local Development

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/sn-chapter-management.git
cd sn-chapter-management

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API credentials

# Start development server
npm run dev
```

### Deployment to Vercel

#### Option 1: GitHub Integration (Recommended)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Initial deployment"
   git push origin main
   ```

2. **Deploy via Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Import your `sn-chapter-management` repository
   - Click "Deploy"

3. **Set Environment Variables**:
   - Go to your project dashboard on Vercel
   - Navigate to Settings > Environment Variables
   - Add:
     - `BLACKBAUD_CLIENT_ID`
     - `BLACKBAUD_CLIENT_SECRET`
     - `BLACKBAUD_SUBSCRIPTION_KEY`

4. **Redeploy**:
   - Trigger a new deployment to apply environment variables

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

## Project Structure

```
sn-chapter-management/
├── public/
│   └── index.html          # Main application (SPA)
├── api/
│   └── blackbaud.js        # Server-side API proxy
├── package.json            # Project dependencies
├── vercel.json            # Vercel deployment configuration
├── README.md              # This file
└── .env.example           # Environment variable template
```

## Configuration

### Environment Variables

Create a `.env.local` file for local development:

```env
BLACKBAUD_CLIENT_ID=your_client_id_here
BLACKBAUD_CLIENT_SECRET=your_client_secret_here
BLACKBAUD_SUBSCRIPTION_KEY=your_subscription_key_here
```

### Vercel Configuration

The `vercel.json` file configures:
- Static file serving from `public/`
- Serverless functions in `api/`
- Route handling for SPA functionality

## API Integration

### Authentication Flow

1. **Client Credentials Grant** - OAuth 2.0 service account authentication
2. **Automatic Token Refresh** - Tokens refresh 5 minutes before expiration
3. **Server-Side Proxy** - All API calls routed through secure server-side functions

### Supported Endpoints

The application integrates with various Blackbaud SKY API endpoints:

- **Constituents API** - Member and contact information
- **Gifts API** - Donation and fee tracking
- **Funds API** - Financial management
- **Appeals & Campaigns** - Fundraising management

### Custom API Calls

Use the Admin panel for testing custom API endpoints:
- Support for dynamic parameter substitution
- SID and Chapter parameters automatically included
- Full response debugging and error handling

## Usage Examples

### Chapter-Specific Access

Share links with embedded parameters for direct chapter access:

```
https://your-app.vercel.app?sid=54321&chapter=BETA
```

### Administrative Access

For system configuration and testing:

```
https://your-app.vercel.app
```
Navigate to Admin → Configure API → Test endpoints

## Security

### Data Protection
- All API credentials stored as environment variables
- No sensitive data exposed in client-side code
- HTTPS enforced for all communications

### Access Control
- Service account authentication (no user login required)
- Chapter-specific data access via URL parameters
- Admin functions separated from user functions

## Troublesh