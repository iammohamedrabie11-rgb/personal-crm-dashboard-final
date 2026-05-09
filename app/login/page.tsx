import { LoginForm } from "@/components/AuthForms";

interface LoginPageProps {
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

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return <LoginForm next={getSafeNextPath(params.next)} message={params.message} />;
}
