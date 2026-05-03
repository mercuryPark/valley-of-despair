import Link from 'next/link';

export default function AuthErrorPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl font-medium tracking-tight">로그인 실패</h1>
      <p className="text-muted-foreground">
        OAuth 콜백에서 오류가 발생했습니다. 다시 시도하거나 브라우저 쿠키를 확인하세요.
      </p>
      <Link href="/auth/sign-in" className="underline">
        로그인 페이지로
      </Link>
    </div>
  );
}
