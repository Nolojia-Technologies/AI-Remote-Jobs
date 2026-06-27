/**
 * Privacy Policy content for AI Remote Jobs (Nolojia Technologies), rendered
 * natively in-app by app/privacy/index.tsx. Kept as structured data so the
 * screen stays presentational and the text is easy to update in one place.
 *
 * The canonical online copy (for the Play Store listing) is hosted at
 * {@link PRIVACY_POLICY_URL}.
 */

export const PRIVACY_POLICY_URL =
  "https://xuurnnvppxthnnsvrcgd.supabase.co/storage/v1/object/public/legal/privacy-policy.txt";

export const PRIVACY_EFFECTIVE_DATE = "26 June 2026";
export const PRIVACY_LAST_UPDATED = "26 June 2026";

export type PolicyBlock =
  | { t: "p"; text: string }
  | { t: "sub"; text: string }
  | { t: "ul"; items: string[] };

export interface PolicySection {
  heading: string;
  blocks: PolicyBlock[];
}

export const PRIVACY_INTRO: string[] = [
  'Welcome to AI Remote Jobs, an application developed and operated by Nolojia Technologies ("we," "our," or "us").',
  "This Privacy Policy explains how we collect, use, store, protect, and share your information when you use AI Remote Jobs.",
  "By creating an account or using our application, you agree to the practices described in this Privacy Policy.",
];

export const PRIVACY_CONTACT = {
  org: "Nolojia Technologies",
  website: "https://www.nolojia.com",
  email: "support@nolojia.com",
  phone: "+254 793 903 930",
};

export const PRIVACY_SECTIONS: PolicySection[] = [
  {
    heading: "1. About AI Remote Jobs",
    blocks: [
      { t: "p", text: "AI Remote Jobs is a learning and career development platform designed to help users:" },
      {
        t: "ul",
        items: [
          "Learn remote work skills",
          "Complete structured courses",
          "Take quizzes and assessments",
          "Earn XP and achievements",
          "Unlock remote job opportunities",
          "Apply for available jobs",
          "Receive learning reminders",
          "Track personal learning progress",
        ],
      },
    ],
  },
  {
    heading: "2. Information We Collect",
    blocks: [
      { t: "p", text: "Depending on how you use the app, we may collect the following information." },
      { t: "sub", text: "Personal Information" },
      { t: "p", text: "When creating an account, we may collect:" },
      { t: "ul", items: ["Full name", "Email address", "Username", "Profile picture (optional)", "Country", "Preferred language"] },
      { t: "sub", text: "Account Information" },
      { t: "p", text: "We collect information necessary to manage your account, including:" },
      { t: "ul", items: ["User ID", "Login method", "Account creation date", "Last login date"] },
      { t: "sub", text: "Learning Information" },
      { t: "p", text: "To provide learning services, we collect:" },
      {
        t: "ul",
        items: [
          "Courses enrolled",
          "Lessons completed",
          "Reading progress",
          "Quiz scores",
          "Final assessment scores",
          "Certificates earned",
          "XP",
          "Badges",
          "Learning streaks",
          "Jobs unlocked",
        ],
      },
      { t: "sub", text: "Device Information" },
      { t: "p", text: "Depending on your device, we may collect:" },
      { t: "ul", items: ["Device model", "Operating system", "Device language", "App version", "IP address", "Time zone"] },
      { t: "sub", text: "Usage Information" },
      { t: "p", text: "We collect information about how you interact with the app, including:" },
      {
        t: "ul",
        items: [
          "Screens visited",
          "Buttons clicked",
          "Session duration",
          "Features used",
          "Pages viewed",
          "Navigation history",
          "Ad interactions",
          "Notification interactions",
        ],
      },
      { t: "sub", text: "Advertising Information" },
      { t: "p", text: "Our advertising partners may collect:" },
      { t: "ul", items: ["Advertising ID", "Device identifiers", "Approximate location", "Ad impressions", "Ad clicks"] },
      { t: "p", text: "This information helps deliver relevant advertisements and measure advertising performance." },
    ],
  },
  {
    heading: "3. How We Use Your Information",
    blocks: [
      { t: "p", text: "We use your information to:" },
      {
        t: "ul",
        items: [
          "Create and manage your account",
          "Deliver learning content",
          "Save your progress",
          "Unlock courses and jobs",
          "Track XP and achievements",
          "Generate certificates",
          "Improve user experience",
          "Provide customer support",
          "Analyze app performance",
          "Detect abuse and fraud",
          "Deliver notifications",
          "Display advertisements",
          "Comply with legal obligations",
        ],
      },
    ],
  },
  {
    heading: "4. Artificial Intelligence Features",
    blocks: [
      { t: "p", text: "AI Remote Jobs may use artificial intelligence to:" },
      {
        t: "ul",
        items: [
          "Generate educational content",
          "Generate quizzes",
          "Improve lessons",
          "Personalize learning",
          "Recommend courses",
          "Recommend jobs",
        ],
      },
      { t: "p", text: "When AI features are used, only the information necessary to provide the requested functionality is processed." },
    ],
  },
  {
    heading: "5. Advertising",
    blocks: [
      { t: "p", text: "AI Remote Jobs displays advertisements to help keep the platform free." },
      { t: "p", text: "Advertising providers may include:" },
      { t: "ul", items: ["Google AdMob", "Meta Audience Network"] },
      { t: "p", text: "These providers may collect information such as:" },
      { t: "ul", items: ["Advertising identifiers", "Device information", "Interaction with advertisements"] },
      { t: "p", text: "Please review their respective privacy policies for more information." },
    ],
  },
  {
    heading: "6. Analytics",
    blocks: [
      { t: "p", text: "We use analytics tools to understand how users interact with the application." },
      { t: "p", text: "Analytics may include:" },
      { t: "ul", items: ["Daily active users", "Session duration", "Course completion rates", "Quiz performance", "App crashes", "Feature usage"] },
      { t: "p", text: "Analytics data helps us improve the app." },
    ],
  },
  {
    heading: "7. Notifications",
    blocks: [
      { t: "p", text: "If you grant permission, we may send notifications including:" },
      {
        t: "ul",
        items: [
          "Daily learning reminders",
          "New course announcements",
          "New job alerts",
          "Learning streak reminders",
          "Special promotions",
          "Important account notifications",
        ],
      },
      { t: "p", text: "You can disable notifications at any time through your device settings." },
    ],
  },
  {
    heading: "8. Job Listings",
    blocks: [
      { t: "p", text: "AI Remote Jobs provides access to remote job opportunities." },
      { t: "p", text: "We strive to provide accurate information but do not guarantee:" },
      { t: "ul", items: ["Employment", "Interview invitations", "Job availability", "Salary accuracy", "Employer responses"] },
      { t: "p", text: "Users are responsible for evaluating opportunities before applying." },
    ],
  },
  {
    heading: "9. Cookies and Similar Technologies",
    blocks: [
      { t: "p", text: "Our website and connected services may use cookies or similar technologies to:" },
      { t: "ul", items: ["Improve performance", "Remember preferences", "Analyze usage", "Personalize content", "Measure advertising performance"] },
    ],
  },
  {
    heading: "10. Third-Party Services",
    blocks: [
      { t: "p", text: "We may use trusted third-party services, including:" },
      {
        t: "ul",
        items: [
          "Supabase",
          "Google Play Services",
          "Google AdMob",
          "Meta Audience Network",
          "Firebase Analytics (if enabled)",
          "OpenAI (for AI-powered features, if enabled)",
        ],
      },
      { t: "p", text: "These services process information according to their own privacy policies." },
    ],
  },
  {
    heading: "11. Data Storage",
    blocks: [
      { t: "p", text: "User information is securely stored using cloud infrastructure." },
      { t: "p", text: "We take reasonable technical and organizational measures to protect your information from unauthorized access, disclosure, alteration, or destruction." },
      { t: "p", text: "However, no method of electronic storage or internet transmission is completely secure." },
    ],
  },
  {
    heading: "12. Data Retention",
    blocks: [
      { t: "p", text: "We retain your information only as long as necessary to:" },
      { t: "ul", items: ["Provide our services", "Comply with legal obligations", "Resolve disputes", "Enforce agreements"] },
      { t: "p", text: "If you delete your account, we will delete or anonymize your personal information unless we are legally required to retain certain records." },
    ],
  },
  {
    heading: "13. Your Rights",
    blocks: [
      { t: "p", text: "Depending on your location, you may have the right to:" },
      {
        t: "ul",
        items: [
          "Access your personal information",
          "Correct inaccurate information",
          "Delete your account",
          "Request deletion of your data",
          "Restrict processing",
          "Object to certain processing activities",
          "Receive a copy of your personal data where applicable",
        ],
      },
      { t: "p", text: "To exercise these rights, contact us using the details below." },
    ],
  },
  {
    heading: "14. Children's Privacy",
    blocks: [
      { t: "p", text: "AI Remote Jobs is not intended for children under the age required by applicable law in their jurisdiction." },
      { t: "p", text: "We do not knowingly collect personal information from children who are below the applicable minimum age." },
      { t: "p", text: "If we become aware that such information has been collected without appropriate consent, we will take reasonable steps to delete it." },
    ],
  },
  {
    heading: "15. International Users",
    blocks: [
      { t: "p", text: "Your information may be processed and stored in countries other than your own." },
      { t: "p", text: "By using AI Remote Jobs, you acknowledge that your information may be transferred to and processed in accordance with this Privacy Policy and applicable law." },
    ],
  },
  {
    heading: "16. Security",
    blocks: [
      { t: "p", text: "We implement reasonable safeguards designed to protect your information, including:" },
      { t: "ul", items: ["Secure authentication", "Encrypted connections (HTTPS/TLS)", "Access controls", "Database security measures", "Monitoring and logging"] },
      { t: "p", text: "Users are responsible for maintaining the confidentiality of their account credentials." },
    ],
  },
  {
    heading: "17. Changes to This Privacy Policy",
    blocks: [
      { t: "p", text: "We may update this Privacy Policy from time to time." },
      { t: "p", text: 'When significant changes are made, we will update the "Last Updated" date and may notify users through the application or by other appropriate means.' },
      { t: "p", text: "Your continued use of AI Remote Jobs after changes become effective constitutes acceptance of the updated Privacy Policy." },
    ],
  },
  {
    heading: "18. Contact Us",
    blocks: [
      { t: "p", text: "If you have any questions, requests, or concerns regarding this Privacy Policy or your personal information, please contact us using the details below." },
    ],
  },
  {
    heading: "19. Google Play Compliance Statement",
    blocks: [
      { t: "p", text: "AI Remote Jobs is committed to complying with applicable Google Play policies, including requirements relating to user privacy, data handling, advertising, and security. We strive to collect only the information necessary to provide and improve our services, and we aim to be transparent about how your information is used." },
    ],
  },
];
