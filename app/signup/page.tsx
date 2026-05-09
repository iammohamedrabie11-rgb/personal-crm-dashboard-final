import { SignUpForm } from "@/components/AuthForms";

interface SignUpPageProps {
  searchParams: Promise<{
    message?: string;
    next?: string;
  }>;
}

function getSafeNextPath(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;

  return <SignUpForm next={getSafeNextPath(params.next)} message={params.message} />;
}
