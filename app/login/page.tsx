import { LoginForm } from "@/components/AuthForms";

interface LoginPageProps {
  searchParams: Promise<{
    message?: string | string[];
    next?: string | string[];
  }>;
}

function getSingleSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getSafeNextPath(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = getSafeNextPath(getSingleSearchParam(params.next));
  const message = getSingleSearchParam(params.message);

  return <LoginForm next={next} message={message} />;
}
