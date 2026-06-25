// app/admin/dashboard/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="mx-auto max-w-4xl">
                <h1 className="text-2xl font-bold text-gray-900">
                    ダッシュボード
                </h1>
                <p className="mt-4 text-sm text-gray-600">
                    ようこそ、<span className="font-medium">{user.email}</span> さん
                </p>
                <div className="mt-8 rounded-lg bg-white p-6 shadow">
                    <p className="text-sm text-gray-700">
                        ここは認証済みユーザーだけが見られるページです。
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                        User ID: {user.id}
                    </p>
                </div>
            </div>
        </div>
    )
}