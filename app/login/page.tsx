import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-zinc-950 p-6 md:p-10">
      <div className="flex w-full max-w-md flex-col items-center justify-center">
        <LoginForm className="w-full" />
      </div>
    </div>
  );
}
