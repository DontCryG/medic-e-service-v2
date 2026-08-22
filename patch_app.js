const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/App.tsx');
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes(import { supabase })) {
  content = content.replace(import { setSentryUser, clearSentryUser } from './lib/sentry';, import { setSentryUser, clearSentryUser } from './lib/sentry';\nimport { supabase } from './lib/supabase';);
}

const logoutLogic = 
  // Force Logout Check
  React.useEffect(() => {
    const checkVersionAndLogout = async () => {
      const FORCE_LOGOUT_VERSION = 'v2.2'; // Update this string to force logout again
      const currentVersion = localStorage.getItem('app_force_logout_version');
      if (currentVersion !== FORCE_LOGOUT_VERSION) {
        await supabase.auth.signOut();
        useAuthStore.getState().logout();
        localStorage.setItem('app_force_logout_version', FORCE_LOGOUT_VERSION);
        window.location.href = '/';
      }
    };
    checkVersionAndLogout();
  }, []);
;

if (!content.includes('FORCE_LOGOUT_VERSION')) {
  content = content.replace(
    export default function App() {\n  const { user } = useAuthStore();,
    export default function App() {\n  const { user } = useAuthStore();\n
  );
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('App.tsx updated successfully');
