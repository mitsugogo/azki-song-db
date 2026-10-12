import PolicyPage from "../legal/PolicyPage";
import { generatePolicyMetadata } from "../legal/policyMetadata";

export async function generateMetadata() {
  return generatePolicyMetadata("privacy");
}

export default function PrivacyPage() {
  return <PolicyPage document="privacy" />;
}
