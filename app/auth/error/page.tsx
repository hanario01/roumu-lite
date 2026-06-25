// app/auth/error/page.tsx
import Link from 'next/link'

export default function AuthErrorPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow text-center">
                <h1 className="text-xl font-bold text-gray-900">
                    認証に失敗しました
                </h1>
                <p className="text-sm text-gray-600">
                    メールアドレスまたはパスワードが正しくない可能性があります。
                    もう一度お試しください。
                </p>
                <Link
                    href="/login"
                    className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                    ログイン画面に戻る
                </Link>
            </div>
        </div>
    )
}