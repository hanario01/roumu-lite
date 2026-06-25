// app/auth/confirm/route.ts
import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type') as EmailOtpType | null
    const nextParam = searchParams.get('next') ?? '/admin/dashboard'
    // オープンリダイレクト対策: 自サイト内の相対パスのみ許可
    const next = nextParam.startsWith('/') && !nextParam.startsWith('//')
        ? nextParam
        : '/admin/dashboard'

    if (token_hash && type) {
        const supabase = await createClient()

        const { error } = await supabase.auth.verifyOtp({
            type,
            token_hash,
        })

        if (!error) {
            redirect(next)
        }
    }

    // トークンがない/無効な場合
    redirect('/auth/error')
}