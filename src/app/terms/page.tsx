import PolicyPage from "../legal/PolicyPage";
import { generatePolicyMetadata } from "../legal/policyMetadata";

export async function generateMetadata() {
  return generatePolicyMetadata("terms");
}

export default function TermsPage() {
  return <PolicyPage document="terms" />;
}
