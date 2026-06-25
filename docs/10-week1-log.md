# Week 1 進捗ログ — 環境構築から Supabase 認証の土台まで

> 期間: 2026-06-18 〜 2026-06-23
> ゴール: Next.js / Supabase / Vercel の3点セットを繋ぎ、認証の土台を完成させる
> 完了範囲: 01-design-overview.md の「10. 次のステップ」Day 1 〜 Day 4

---

## Week 1 全体のゴールと達成度

| やったこと | 設計書の対応箇所 | ステータス |
|---|---|---|
| GitHub / Vercel / Supabase アカウントと初期プロジェクト作成 | Day 1 | ✅ |
| Next.js プロジェクトを立ち上げ、GitHub → Vercel に繋ぐ | Day 2-3 | ✅ |
| Supabase 認証の土台（クライアント2種類 + Proxy）を作る | Day 4-7 の前半 | ✅ |
| Supabase 公式認証チュートリアル完走（ログイン/サインアップ動作） | Day 4-7 の後半 | ⏳ Day 5 以降 |

「Hello」を本番URLで表示する、というWeek 1の最低ラインは初日でクリア。残り日数で**認証の骨格まで作れた**のは予定より前倒し。

---

## Day 1: アカウント開設と各種設定（環境のお膳立て）

### やったこと

1. **GitHub リポジトリ作成** — `roumu-lite`、Public、MITライセンス、`.gitignore (Node)` 付き
2. **Vercel アカウント作成** — GitHub連携でログイン
3. **Supabase プロジェクト作成** — リージョン: Tokyo（成田）

### Supabase のセキュリティ設定（明示的に選んだ項目）

| 設定項目 | 選んだ値 | 意図 |
|---|---|---|
| Enable Data API | **オン** | フロントから直接Supabase SDKで叩く構成にするため、Data API は有効化が必須 |
| Automatically expose new tables | **オフ** | 新規テーブルを作っても自動的にAPI公開しない。明示的に許可したものだけ外に出す |
| Enable automatic RLS | **オン** | 新規テーブルは作成時点で RLS が自動有効化される。ポリシー未定義のテーブルは誰からもアクセス不能 |

### この設定の意図（なぜこの組み合わせか）

労務SaaSは住所・口座・マイナンバーなど機微情報を扱う。設計の出発点として **「デフォルト拒否」のセキュリティポスチャ** を選んだ。

「忘れていたら漏れる」のではなく **「明示的に許可したものだけアクセスできる」** 状態をデフォルトにすることで、ポリシー漏れによる事故を構造的に防ぐ。これは Week 2 で RLS ポリシーを書き始めたときに、ポリシーを書き忘れたテーブルが「とりあえずアクセス不能」になることで気づける、という保険になる。

### キャリア面での意味

CSとして労務SaaSベンダーに行ったとき、顧客から「セキュリティはどうなっているのか」と必ず聞かれる。「自分のポートフォリオでも、設計の最初のステップで明示的にセキュリティ設定を選んだ」と語れることは、ドメイン適性のシグナルになる。

---

## Day 2-3: Next.js プロジェクトの立ち上げと Vercel デプロイ

### やったこと

1. `npx create-next-app@latest roumu-lite --typescript --tailwind --app` を実行
   - TypeScript / Tailwind CSS / App Router の3点をフラグで明示
2. main ブランチに初期コミット、GitHub へ push
3. Vercel と GitHub リポを連携 → 初回デプロイが通ることを確認
4. 適当なトップページを書いて `feat:` でPR → セルフマージ

### 技術選定の意図（Next.js + App Router）

| 採用技術 | 理由 |
|---|---|
| **Next.js (App Router)** | モダンReactフレームワークのデファクト。SmartHR / freee / マネーフォワード等、労務SaaS求人で言及頻度が高い |
| **TypeScript** | 型を書きながら作ることで「契約書ベースで考える労務ドメイン」と相性が良い。属性が多いフォーム実装で型の恩恵が大きい |
| **Tailwind CSS** | クラスベースの効率性、shadcn/ui との相性。FLOCSS/BEM とは別系統だが、SaaS UI 開発では Tailwind がデファクト |
| **Vercel** | GitHub 連携で自動デプロイ。無料枠で MVP には十分。Next.js 開発元なので相性が一番良い |

### App Router を選んだ理由

設計書の段階で固めた点だが、Day 2-3 で実際に触ってみて確信した点として:

- `/admin/*` と `/onboarding/*` という **URL でロールを切り分ける構成** が、App Router のディレクトリ構造とそのまま対応する
- Server Components で Supabase クライアントを直接呼べる → API 層を書かずに済む（個人開発の現実解）
- Server Actions でフォーム処理が完結 → REST API を別途設計しなくていい

### GitHub 運用ルールの確立

設計書の「8. Git/GitHub運用ルール」を初日から実行することを決めた:

- ソロ開発でも **必ず PR 経由でマージ**
- Conventional Commits（`feat:` / `fix:` / `docs:` / `chore:` / `refactor:`）
- ブランチ命名は `feature/xxx`

### この運用の意図

PR履歴それ自体がポートフォリオになる。面接で「コードを見せて」と言われたとき、main にダイレクトコミットの一直線のリポより、機能ごとのPRが並んでいる方が「設計判断のプロセスを残しながら進めている」ことが伝わる。CSは「プロダクトの背景を顧客に説明する仕事」なので、自分の開発ログ自体がその訓練。

---

## Day 4: Supabase 認証の土台作り

### やったこと（成果物4点セット）

| ファイル | 役割 |
|---|---|
| `.env.local` | Supabase への接続情報（URL とPublishable Key） |
| `lib/supabase/client.ts` | ブラウザ用 Supabase クライアント |
| `lib/supabase/server.ts` | サーバー用 Supabase クライアント（Cookie 同期付き） |
| `proxy.ts` | 認証トークンの自動更新 + 未ログインリダイレクト |

### 1. 環境変数（`.env.local`）

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxx
```

#### キー名の意図

Supabase は2026年末までに従来の `anon` / `service_role` キーを廃止予定。新形式の `publishable` / `secret` キーに移行している。今のうちから新形式を採用することで、将来のマイグレーションコストをゼロにする。

`NEXT_PUBLIC_` プレフィックスは Next.js の規約で、これが付いた変数だけがブラウザ側に渡される。Publishable Key はクライアントに渡って良い前提のキーなのでこれでOK。Secret Key（サーバー専用）は絶対に `NEXT_PUBLIC_` を付けないこと。

### 2. ブラウザ用クライアント（`lib/supabase/client.ts`）

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
```

### 3. サーバー用クライアント（`lib/supabase/server.ts`）

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component から呼ばれた場合は無視（proxy が処理する）
          }
        },
      },
    }
  )
}
```

#### なぜブラウザ用とサーバー用の2つに分けるのか

Next.js App Router では、コードが「ブラウザで動く（Client Components）」「サーバーで動く（Server Components / Server Actions / Route Handlers）」のどちらかで実行される。

- **ブラウザ用** — `localStorage` や `window` が使える環境
- **サーバー用** — Cookie の読み書きを `next/headers` の `cookies()` 経由で行う環境

Supabase のセッション管理は **Cookie ベース** にしているため、サーバー側ではリクエストの Cookie を読んでセッションを復元する必要がある。この違いを吸収するために2つのクライアントを用意する。

#### `try/catch` で `setAll` のエラーを握り潰す意図

Server Components はレスポンス Cookie に書き込めない（Next.js の仕様）。でも `createServerClient` は Cookie 同期を試みる。ここでエラーを投げると Server Component が壊れるので、エラーは握り潰して **proxy.ts 側でCookie 同期を担当する** という役割分担にしている。

### 4. Proxy（`proxy.ts`）

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export default async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

#### proxy が必要な理由

Supabase の認証トークン（JWT）は有効期限がある。期限切れになる前にリフレッシュトークンで新しい JWT を取得して Cookie に書き戻す必要がある。これを毎リクエストで自動的にやる「門番」が proxy。

役割は2つ:

1. **トークン更新** — 期限切れになりそうな JWT を裏で更新して Cookie に書き戻す
2. **認証ガード** — 未ログインユーザーを `/login` にリダイレクトする

#### Next.js 16 で middleware → proxy にリネームされた経緯

Next.js 16 で `middleware.ts` が `proxy.ts` にリネームされた。背景には CVE-2025-29927（middleware の認証バイパス脆弱性）があり、Next.js チームは「これはネットワーク境界の routing 層であって、セキュリティの最終防衛線ではない」というメッセージを出している。

実装上の違いは:

| 項目 | Next.js 15以前 | Next.js 16 |
|---|---|---|
| ファイル名 | `middleware.ts` | `proxy.ts` |
| 関数名 | `middleware` | `proxy` |
| エクスポート | named export | default export |
| 実行ランタイム | Edge | Node.js |

将来的には「proxy は routing のみ、認証ガードは各 `layout.tsx` に書く」のが推奨パターンになる予定。これは Week 2-3 で `/admin/*` を作るときにリファクタリングのネタとして取り上げる予定。

#### `createServerClient` と `getUser()` の間にコードを入れない

公式ドキュメントで強調されている注意点。この間にコードを書くと、Cookie 同期と認証チェックのタイミングがずれてセッションが壊れる。**「クライアント作って、即getUser」** をパターンとして覚えておく。

### Day 4 の動作確認

`npm run dev` を起動して `http://localhost:3000` にアクセス。`/login` ページが未作成なので **404** になる。これは proxy が正しく動いて未ログインユーザーを `/login` にリダイレクトした結果。期待通りの挙動。

---

## Week 1 で得られた学び

### 技術面

- **App Router の Server / Client の分離** — Supabase クライアントを2つ用意する理由を実感した。ブラウザ用とサーバー用は別物として明確に区別する必要がある
- **Cookie ベースのセッション管理** — localStorage ではなく Cookie を使う理由（SSR対応、HttpOnly でXSS耐性、SameSite でCSRF耐性）が腹落ちした
- **Next.js 16 の proxy 命名** — フレームワーク側の意図（middleware にセキュリティロジックを集中させると危険）を理解した上で、現状は proxy に認証ガードを置く実装にした。後でリファクタリングする方針

### 設計面

- **デフォルト拒否のセキュリティポスチャ** — Supabase の設定3点で「明示許可だけアクセス可」を担保するパターンを身につけた。労務ドメインの「最小権限の原則」と直結する考え方
- **ドキュメントを残しながら進める** — 設計判断とその理由をMarkdownで残すことで、自分自身の理解が深まる。これはCSとして顧客に「なぜこの仕様なのか」を説明する訓練になる

### 想定よりも時間がかかった点

- Next.js 16 へのバージョンアップで `middleware → proxy` のリネームに対応する必要があった。Supabase 公式ドキュメントはまだ `middleware.ts` 表記なので、自分でマッピングし直した
- `proxy.ts` の配置場所（プロジェクトルート vs `app/` 内）でつまずいた。`/login` を作る前なのに 404 にならず Next.js のフロントページが表示されてしまい、proxy が動いていないことに気づいた

---

## Week 2 へのつなぎ

### Week 1 の残りタスク（Day 5-7）

1. `/login` ページを作成（メール+パスワードのフォーム + Server Action）
2. メール確認用 Route Handler（`/auth/confirm`）
3. `/admin/dashboard` を保護ページとして作成（Day 6 〜 Day 7 で RLS の挙動も体感）

### Week 2 の入口

データモデル設計の会話を別チャットで開始。`employee_details` テーブルの項目を労務知識ベースで詰める。設計書の「5. データモデル骨格」を起点に、`02-data-model.md` を仕上げる。

---

## ドキュメント番号ルール

`docs/` 配下のファイル番号は2系統で運用する:

- **0X番台** — 設計ドキュメント（profile / design-overview / data-model / rls-policies / decisions-log）
- **1X番台** — 進捗ログ（week1-log, week2-log, ...）

設計と記録を番号レンジで分けることで、ファイル名だけで役割が判別できる。設計ドキュメントが Week 2 以降に追加されても、進捗ログとの間に空白が空かない。

---

## 変更履歴

| 日付 | バージョン | 変更内容 |
|---|---|---|
| 2026-06-23 | 0.1 | Week 1（Day 1-4）の振り返りログとして初版作成。`docs/` の番号は0X=設計、1X=進捗ログの2系統運用とする |
