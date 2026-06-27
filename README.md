# AI Hustle Academy

**Learn AI Skills. Unlock Opportunities.**

A premium mobile application built with React Native + Expo that helps users in Kenya, Qatar, Africa, and the Middle East learn AI skills, complete challenges, earn XP, and unlock real remote work opportunities.

---

## Tech Stack

| Category | Technology |
|---|---|
| Framework | React Native + Expo SDK 52 |
| Routing | Expo Router v4 |
| Language | TypeScript (strict) |
| Styling | NativeWind v4 (Tailwind CSS) |
| State | Zustand v5 |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Forms | React Hook Form + Zod |
| Animations | React Native Reanimated v3 |
| Icons | Lucide React Native |
| Analytics | Firebase Analytics (JS SDK) |
| Error Tracking | Sentry |
| Ads | Google AdMob (EAS build required) |

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo Go app (iOS or Android)
- Supabase account (free tier works)
- Firebase project (optional, for analytics)

### 1. Clone & Install

```bash
git clone <your-repo>
cd ai-hustle-academy
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** in your Supabase dashboard
3. Run the migration file:
   ```
   supabase/migrations/001_initial_schema.sql
   ```
4. Run the seed data:
   ```
   supabase/seed.sql
   ```

#### Supabase Auth Configuration

1. Go to **Authentication → Providers**
2. Enable **Email** (Email + Password)
3. Enable **Google** (add your OAuth credentials)
4. Go to **Authentication → URL Configuration**
5. Add: `aihustleacademy://` to allowed redirect URLs

### 4. Google OAuth Setup (Optional)

1. Create OAuth credentials at [console.cloud.google.com](https://console.cloud.google.com)
2. Add Android and iOS client IDs to `.env`
3. Add your Supabase project URL as an authorized redirect URI

### 5. Start Development

```bash
npm start
```

Scan the QR code with Expo Go on your device.

---

## Project Structure

```
ai-hustle-academy/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root layout + auth check
│   ├── index.tsx                 # Entry point (redirect logic)
│   ├── (auth)/                   # Login, Register, Forgot Password
│   ├── (onboarding)/             # Welcome, Career Path, Goals
│   ├── (tabs)/                   # Main tab navigation
│   │   ├── index.tsx             # Home Dashboard
│   │   ├── learn.tsx             # Learning Modules
│   │   ├── challenges.tsx        # Daily Challenges
│   │   ├── leaderboard.tsx       # Global Leaderboard
│   │   └── profile.tsx           # User Profile
│   ├── lesson/[id].tsx           # Lesson viewer + completion
│   ├── quiz/[id].tsx             # Quiz engine
│   ├── challenge/[id].tsx        # Challenge submission
│   ├── opportunities/            # Opportunities browser
│   ├── certificates/             # Certificate gallery
│   └── achievements/             # Achievement tracker
├── src/
│   ├── components/
│   │   ├── ui/                   # Button, Card, Input, Badge, etc.
│   │   ├── home/                 # Dashboard components
│   │   ├── learn/                # Module & lesson cards
│   │   ├── challenges/           # Challenge cards
│   │   ├── leaderboard/          # Leaderboard items
│   │   ├── profile/              # Achievement & certificate cards
│   │   └── quiz/                 # Quiz question component
│   ├── stores/                   # Zustand state stores
│   │   ├── authStore.ts          # Auth (login, register, OAuth)
│   │   ├── userStore.ts          # Profile, XP, streak
│   │   ├── learnStore.ts         # Modules, lessons, progress
│   │   ├── challengeStore.ts     # Challenges, submissions
│   │   └── gamificationStore.ts  # Achievements, leaderboard, certs
│   ├── lib/
│   │   ├── supabase.ts           # Supabase client
│   │   ├── analytics.ts          # Firebase Analytics
│   │   └── admob.ts              # Google AdMob
│   ├── types/
│   │   ├── database.types.ts     # Full DB type definitions
│   │   └── app.types.ts          # App-level types
│   ├── constants/
│   │   ├── colors.ts             # App color palette
│   │   ├── xp.ts                 # XP system + level calculator
│   │   └── careers.ts            # Career path configurations
│   └── data/                     # Seed data TypeScript files
├── supabase/
│   ├── migrations/001_initial_schema.sql
│   └── seed.sql
├── global.css                    # Tailwind imports
├── tailwind.config.js            # NativeWind config
├── babel.config.js               # Babel + NativeWind
├── metro.config.js               # Metro + NativeWind
└── app.config.ts                 # Expo config
```

---

## XP System

| Action | XP |
|---|---|
| Complete Lesson | +20 XP |
| Pass Quiz | +50 XP |
| Complete Challenge | +100 XP |
| Daily Login | +10 XP |
| 7-Day Streak | +250 XP |
| 14-Day Streak | +500 XP |
| 30-Day Streak | +1,000 XP |
| Unlock Achievement | +100 XP |

### Level Thresholds

| Level | XP Required | Title |
|---|---|---|
| 1 | 0 | AI Newcomer |
| 2 | 101 | AI Learner |
| 3 | 301 | AI Explorer |
| 4 | 701 | AI Practitioner |
| 5 | 1,501 | AI Specialist |
| 6 | 3,101 | AI Expert |
| 7 | 6,301 | AI Master |
| 8 | 12,701 | AI Champion |
| 9 | 25,501 | AI Legend |
| 10 | 51,101 | AI Grandmaster |

---

## Career Paths

1. **AI Content Writer** — Content creation with AI tools
2. **AI Virtual Assistant** — Remote administrative support
3. **AI Customer Support Agent** — AI-powered customer service
4. **AI Research Assistant** — Data research and analysis
5. **AI Social Media Manager** — Social media with AI
6. **Prompt Engineer** — LLM prompt design and optimization
7. **Data Entry Specialist** — AI-assisted data processing

---

## Features

### Gamification
- XP system with 10 levels
- Daily login streaks with milestone bonuses
- Global, Kenya, and Qatar leaderboards
- 16 achievements with unlock requirements
- Digital certificates with unique IDs
- Animated XP popups and completion effects

### Learning
- Career-path-specific curriculum
- Beginner, Intermediate, and Advanced modules
- Rich text lesson content
- Lesson completion tracking
- Module progress percentage

### Quiz Engine
- Multiple choice, true/false, and scenario questions
- Timed quizzes with countdown
- Instant feedback with explanations
- Pass/fail scoring (80% to pass)
- XP rewards for passing

### Daily Challenges
- 7 unique challenge types
- 24-hour expiry timer
- Text submission with AI hint tips
- Immediate XP on submission
- Submission history

### Opportunities
- Unlockable based on XP + level
- Practice projects → Simulations → Mock freelance → Real jobs
- Progress indicators for locked items

### Authentication
- Email/Password login
- Google OAuth
- Email verification
- Password reset
- Secure session with Expo SecureStore

---

## Monetization (AdMob)

AdMob requires a native build (EAS). Stub implementations run in Expo Go dev mode.

**Ad Placements:**
- Banner: Bottom of main screens
- Interstitial: After module completion
- Rewarded: Watch ad for bonus XP / quiz retry

**To enable AdMob:**
1. Create an AdMob account
2. Add app IDs to `.env`
3. Run `eas build` instead of `expo start`

---

## Production Deployment

### EAS Build (recommended)

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android
eas build --platform ios
```

### Environment Setup for Production

1. Set all environment variables in your EAS project secrets
2. Enable AdMob in `app.config.ts`
3. Configure Firebase for production analytics
4. Set up Sentry DSN

---

## Database Setup Notes

### Row Level Security

All tables have RLS enabled. Key policies:
- Users can only read/write their own data
- Career paths, modules, lessons, quizzes: publicly readable
- Achievements, opportunities: publicly readable

### Auto Profile Creation

A PostgreSQL trigger automatically creates a profile row when a user signs up via Supabase Auth. No manual profile creation needed.

### Rotating Daily Challenges

Challenges have an `expires_at` column. Set up a Supabase Edge Function or cron job to create new challenges daily:

```sql
-- Example: Expire old challenges and insert new ones
UPDATE challenges SET is_active = false WHERE expires_at < NOW();
```

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on both iOS and Android
5. Submit a pull request

---

## License

MIT License — see LICENSE file for details.

---

## Support

For issues or questions, open a GitHub issue.

**Target Markets:** Kenya 🇰🇪 | Qatar 🇶🇦 | Africa 🌍 | Middle East

*AI Hustle Academy — Learn AI Skills. Unlock Opportunities.*
