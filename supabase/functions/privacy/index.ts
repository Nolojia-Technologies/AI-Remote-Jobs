// Supabase Edge Function: privacy
// Serves the AI Remote Jobs privacy policy as a rendered HTML page.
//
// Storage can't serve user HTML (it forces text/plain), so this function returns
// the page with a real text/html header. Public — deploy WITHOUT JWT so anyone
// (Google Play reviewers, users) can open it:
//   npx supabase functions deploy privacy --project-ref xuurnnvppxthnnsvrcgd --no-verify-jwt
//
// Public URL once deployed:
//   https://xuurnnvppxthnnsvrcgd.supabase.co/functions/v1/privacy
//
// Runs on Deno (Supabase Edge), NOT in the React Native bundle.
// @ts-nocheck

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Privacy Policy — AI Remote Jobs</title>
<meta name="description" content="Privacy Policy for AI Remote Jobs by Nolojia Technologies." />
<style>
  :root { --brand:#026AFA; --ink:#111827; --muted:#6B7280; --line:#E5E7EB; --bg:#FFFFFF; }
  * { box-sizing: border-box; }
  html,body { margin:0; padding:0; background:#F3F4F6; color:var(--ink);
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    -webkit-text-size-adjust:100%; line-height:1.65; }
  .wrap { max-width:820px; margin:0 auto; background:var(--bg); }
  header { background:linear-gradient(135deg,#026AFA,#0B2E78); color:#fff; padding:36px 28px 28px; }
  header h1 { margin:0 0 6px; font-size:26px; font-weight:800; letter-spacing:-.3px; }
  header p { margin:2px 0; font-size:14px; opacity:.92; }
  main { padding:24px 28px 56px; }
  main > p { color:#1F2937; }
  h2 { font-size:19px; font-weight:700; margin:30px 0 8px; padding-top:14px; border-top:1px solid var(--line); color:var(--ink); }
  h2:first-of-type { border-top:0; padding-top:0; }
  ul { margin:8px 0 8px; padding-left:22px; }
  li { margin:4px 0; }
  a { color:var(--brand); text-decoration:none; }
  a:hover { text-decoration:underline; }
  .sub { font-weight:700; margin:14px 0 4px; color:#1F2937; font-size:15px; }
  .contact { background:#F8FAFC; border:1px solid var(--line); border-radius:12px; padding:16px 18px; margin-top:10px; }
  footer { padding:18px 28px 40px; color:var(--muted); font-size:13px; text-align:center; }
  @media (max-width:520px){ header,main{padding-left:18px;padding-right:18px;} }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <h1>Privacy Policy</h1>
    <p><strong>AI Remote Jobs</strong></p>
    <p>Effective Date: 26 June 2026</p>
    <p>Last Updated: 26 June 2026</p>
  </header>
  <main>
    <p>Welcome to AI Remote Jobs, an application developed and operated by Nolojia Technologies ("we," "our," or "us").</p>
    <p>This Privacy Policy explains how we collect, use, store, protect, and share your information when you use AI Remote Jobs.</p>
    <p>By creating an account or using our application, you agree to the practices described in this Privacy Policy.</p>

    <h2>1. About AI Remote Jobs</h2>
    <p>AI Remote Jobs is a learning and career development platform designed to help users:</p>
    <ul>
      <li>Learn remote work skills</li>
      <li>Complete structured courses</li>
      <li>Take quizzes and assessments</li>
      <li>Earn XP and achievements</li>
      <li>Unlock remote job opportunities</li>
      <li>Apply for available jobs</li>
      <li>Receive learning reminders</li>
      <li>Track personal learning progress</li>
    </ul>

    <h2>2. Information We Collect</h2>
    <p>Depending on how you use the app, we may collect the following information.</p>
    <p class="sub">Personal Information</p>
    <p>When creating an account, we may collect:</p>
    <ul>
      <li>Full name</li>
      <li>Email address</li>
      <li>Username</li>
      <li>Profile picture (optional)</li>
      <li>Country</li>
      <li>Preferred language</li>
    </ul>
    <p class="sub">Account Information</p>
    <p>We collect information necessary to manage your account, including:</p>
    <ul>
      <li>User ID</li>
      <li>Login method</li>
      <li>Account creation date</li>
      <li>Last login date</li>
    </ul>
    <p class="sub">Learning Information</p>
    <p>To provide learning services, we collect:</p>
    <ul>
      <li>Courses enrolled</li>
      <li>Lessons completed</li>
      <li>Reading progress</li>
      <li>Quiz scores</li>
      <li>Final assessment scores</li>
      <li>Certificates earned</li>
      <li>XP</li>
      <li>Badges</li>
      <li>Learning streaks</li>
      <li>Jobs unlocked</li>
    </ul>
    <p class="sub">Device Information</p>
    <p>Depending on your device, we may collect:</p>
    <ul>
      <li>Device model</li>
      <li>Operating system</li>
      <li>Device language</li>
      <li>App version</li>
      <li>IP address</li>
      <li>Time zone</li>
    </ul>
    <p class="sub">Usage Information</p>
    <p>We collect information about how you interact with the app, including:</p>
    <ul>
      <li>Screens visited</li>
      <li>Buttons clicked</li>
      <li>Session duration</li>
      <li>Features used</li>
      <li>Pages viewed</li>
      <li>Navigation history</li>
      <li>Ad interactions</li>
      <li>Notification interactions</li>
    </ul>
    <p class="sub">Advertising Information</p>
    <p>Our advertising partners may collect:</p>
    <ul>
      <li>Advertising ID</li>
      <li>Device identifiers</li>
      <li>Approximate location</li>
      <li>Ad impressions</li>
      <li>Ad clicks</li>
    </ul>
    <p>This information helps deliver relevant advertisements and measure advertising performance.</p>

    <h2>3. How We Use Your Information</h2>
    <p>We use your information to:</p>
    <ul>
      <li>Create and manage your account</li>
      <li>Deliver learning content</li>
      <li>Save your progress</li>
      <li>Unlock courses and jobs</li>
      <li>Track XP and achievements</li>
      <li>Generate certificates</li>
      <li>Improve user experience</li>
      <li>Provide customer support</li>
      <li>Analyze app performance</li>
      <li>Detect abuse and fraud</li>
      <li>Deliver notifications</li>
      <li>Display advertisements</li>
      <li>Comply with legal obligations</li>
    </ul>

    <h2>4. Artificial Intelligence Features</h2>
    <p>AI Remote Jobs may use artificial intelligence to:</p>
    <ul>
      <li>Generate educational content</li>
      <li>Generate quizzes</li>
      <li>Improve lessons</li>
      <li>Personalize learning</li>
      <li>Recommend courses</li>
      <li>Recommend jobs</li>
    </ul>
    <p>When AI features are used, only the information necessary to provide the requested functionality is processed.</p>

    <h2>5. Advertising</h2>
    <p>AI Remote Jobs displays advertisements to help keep the platform free.</p>
    <p>Advertising providers may include:</p>
    <ul>
      <li>Google AdMob</li>
      <li>Meta Audience Network</li>
    </ul>
    <p>These providers may collect information such as:</p>
    <ul>
      <li>Advertising identifiers</li>
      <li>Device information</li>
      <li>Interaction with advertisements</li>
    </ul>
    <p>Please review their respective privacy policies for more information.</p>

    <h2>6. Analytics</h2>
    <p>We use analytics tools to understand how users interact with the application.</p>
    <p>Analytics may include:</p>
    <ul>
      <li>Daily active users</li>
      <li>Session duration</li>
      <li>Course completion rates</li>
      <li>Quiz performance</li>
      <li>App crashes</li>
      <li>Feature usage</li>
    </ul>
    <p>Analytics data helps us improve the app.</p>

    <h2>7. Notifications</h2>
    <p>If you grant permission, we may send notifications including:</p>
    <ul>
      <li>Daily learning reminders</li>
      <li>New course announcements</li>
      <li>New job alerts</li>
      <li>Learning streak reminders</li>
      <li>Special promotions</li>
      <li>Important account notifications</li>
    </ul>
    <p>You can disable notifications at any time through your device settings.</p>

    <h2>8. Job Listings</h2>
    <p>AI Remote Jobs provides access to remote job opportunities.</p>
    <p>We strive to provide accurate information but do not guarantee:</p>
    <ul>
      <li>Employment</li>
      <li>Interview invitations</li>
      <li>Job availability</li>
      <li>Salary accuracy</li>
      <li>Employer responses</li>
    </ul>
    <p>Users are responsible for evaluating opportunities before applying.</p>

    <h2>9. Cookies and Similar Technologies</h2>
    <p>Our website and connected services may use cookies or similar technologies to:</p>
    <ul>
      <li>Improve performance</li>
      <li>Remember preferences</li>
      <li>Analyze usage</li>
      <li>Personalize content</li>
      <li>Measure advertising performance</li>
    </ul>

    <h2>10. Third-Party Services</h2>
    <p>We may use trusted third-party services, including:</p>
    <ul>
      <li>Supabase</li>
      <li>Google Play Services</li>
      <li>Google AdMob</li>
      <li>Meta Audience Network</li>
      <li>Firebase Analytics (if enabled)</li>
      <li>OpenAI (for AI-powered features, if enabled)</li>
    </ul>
    <p>These services process information according to their own privacy policies.</p>

    <h2>11. Data Storage</h2>
    <p>User information is securely stored using cloud infrastructure.</p>
    <p>We take reasonable technical and organizational measures to protect your information from unauthorized access, disclosure, alteration, or destruction.</p>
    <p>However, no method of electronic storage or internet transmission is completely secure.</p>

    <h2>12. Data Retention</h2>
    <p>We retain your information only as long as necessary to:</p>
    <ul>
      <li>Provide our services</li>
      <li>Comply with legal obligations</li>
      <li>Resolve disputes</li>
      <li>Enforce agreements</li>
    </ul>
    <p>If you delete your account, we will delete or anonymize your personal information unless we are legally required to retain certain records.</p>

    <h2>13. Your Rights</h2>
    <p>Depending on your location, you may have the right to:</p>
    <ul>
      <li>Access your personal information</li>
      <li>Correct inaccurate information</li>
      <li>Delete your account</li>
      <li>Request deletion of your data</li>
      <li>Restrict processing</li>
      <li>Object to certain processing activities</li>
      <li>Receive a copy of your personal data where applicable</li>
    </ul>
    <p>To exercise these rights, contact us using the details below.</p>

    <h2>14. Children's Privacy</h2>
    <p>AI Remote Jobs is not intended for children under the age required by applicable law in their jurisdiction.</p>
    <p>We do not knowingly collect personal information from children who are below the applicable minimum age.</p>
    <p>If we become aware that such information has been collected without appropriate consent, we will take reasonable steps to delete it.</p>

    <h2>15. International Users</h2>
    <p>Your information may be processed and stored in countries other than your own.</p>
    <p>By using AI Remote Jobs, you acknowledge that your information may be transferred to and processed in accordance with this Privacy Policy and applicable law.</p>

    <h2>16. Security</h2>
    <p>We implement reasonable safeguards designed to protect your information, including:</p>
    <ul>
      <li>Secure authentication</li>
      <li>Encrypted connections (HTTPS/TLS)</li>
      <li>Access controls</li>
      <li>Database security measures</li>
      <li>Monitoring and logging</li>
    </ul>
    <p>Users are responsible for maintaining the confidentiality of their account credentials.</p>

    <h2>17. Changes to This Privacy Policy</h2>
    <p>We may update this Privacy Policy from time to time.</p>
    <p>When significant changes are made, we will update the "Last Updated" date and may notify users through the application or by other appropriate means.</p>
    <p>Your continued use of AI Remote Jobs after changes become effective constitutes acceptance of the updated Privacy Policy.</p>

    <h2>18. Contact Us</h2>
    <p>If you have any questions, requests, or concerns regarding this Privacy Policy or your personal information, please contact us:</p>
    <div class="contact">
      <p style="margin:0 0 6px"><strong>Nolojia Technologies</strong></p>
      <p style="margin:2px 0">Website: <a href="https://www.nolojia.com">https://www.nolojia.com</a></p>
      <p style="margin:2px 0">Email: <a href="mailto:support@nolojia.com">support@nolojia.com</a></p>
      <p style="margin:2px 0">Phone: <a href="tel:+254793903930">+254 793 903 930</a></p>
    </div>

    <h2>19. Google Play Compliance Statement</h2>
    <p>AI Remote Jobs is committed to complying with applicable Google Play policies, including requirements relating to user privacy, data handling, advertising, and security. We strive to collect only the information necessary to provide and improve our services, and we aim to be transparent about how your information is used.</p>
  </main>
  <footer>© 2026 Nolojia Technologies · AI Remote Jobs</footer>
</div>
</body>
</html>`;

Deno.serve((req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS" },
    });
  }
  return new Response(HTML, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
