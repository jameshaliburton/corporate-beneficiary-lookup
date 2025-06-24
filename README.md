# OwnedBy

**Discover who owns the companies behind your purchases**

OwnedBy is an AI-powered corporate ownership research tool that helps users discover who ultimately benefits from their purchases by scanning product barcodes and analyzing corporate ownership structures.

## Features

- **Barcode Scanning**: Scan product barcodes to instantly lookup ownership information
- **AI-Powered Research**: Advanced AI agents research corporate ownership using web sources and company databases
- **Static Mappings**: Pre-defined brand-to-owner mappings for instant lookups
- **User Contributions**: Allow users to contribute missing product information
- **Real-time Progress Tracking**: See the AI research process in real-time
- **Comprehensive Dashboard**: Monitor scan history and research results
- **Confidence Scoring**: AI confidence ratings for all research results

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Anthropic Claude AI
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel
- **AI Agents**: Custom research pipeline with multiple specialized agents

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- Anthropic API key
- Google API key (optional, for web research)

### Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.local.example` to `.env.local` and fill in your API keys
4. Run the development server: `npm run dev`

### Environment Variables

Required environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

Optional environment variables:

```bash
NEXT_PUBLIC_GOOGLE_API_KEY=your_google_api_key
NEXT_PUBLIC_GOOGLE_CSE_ID=your_google_cse_id
```

## Usage

1. **Scan a Barcode**: Use the barcode scanner on the homepage to scan any product
2. **View Results**: See the ownership research results, including confidence scores and sources
3. **Contribute Data**: Help improve the database by contributing missing product information
4. **Monitor Progress**: Watch the AI research process in real-time
5. **Dashboard**: View comprehensive statistics and scan history

## Architecture

The application uses a multi-agent AI research pipeline:

1. **Cache Check**: Check for existing research results
2. **Static Mapping**: Look up in pre-defined ownership database
3. **Query Builder**: Build optimized search queries
4. **Web Research**: Search web for ownership information
5. **Ownership Analysis**: Analyze corporate ownership structures
6. **Validation**: Validate findings and assign confidence scores

## Contributing

This is currently a private alpha/beta project. For access or contributions, please contact the OwnedBy team.

## License

Private - All rights reserved

## Contact

For questions or support, contact the OwnedBy team. 