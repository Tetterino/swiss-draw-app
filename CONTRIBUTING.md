# Contributing

## ブランチルール

### ブランチ戦略

| ブランチ | 用途 |
|---------|------|
| `main` | 本番用。直接 push 禁止 |
| `feature/*` | 新機能の開発 |
| `fix/*` | バグ修正 |

### ワークフロー

1. `main` から feature/fix ブランチを作成
2. 変更をコミット・プッシュ
3. Pull Request を作成
4. CI（lint / test / build）が全て通ることを確認
5. レビュー後にマージ

### Branch Ruleset（推奨設定）

Settings > Rules > Rulesets > **New ruleset > New branch ruleset** で `main` ブランチ用のルールセットを作成:

1. **Ruleset Name**: `main-protection` など任意の名前
2. **Enforcement status**: `Active`
3. **Target branches**: 「Add target」→ 「Include default branch」を選択
4. **Rules** で以下を有効化:
   - **Restrict deletions** — main ブランチの削除を防止
   - **Require a pull request before merging** — 直接 push を禁止
   - **Require status checks to pass** — 「Add checks」で `test` を追加（CI ワークフローのジョブ名）
   - **Block force pushes** — force push を禁止

## 開発

```bash
# 開発サーバー起動
npm run dev

# リント
npm run lint

# テスト
npm test

# ビルド
npm run build
```

## テスト

- テストフレームワーク: [Vitest](https://vitest.dev/)
- テスト対象: `src/lib/swiss/` 配下のコアロジック（順位計算・ペアリング・BYE 選出）
- テストファイル: `src/lib/swiss/__tests__/*.test.ts`

新しいロジックを追加・変更した場合は、対応するテストも追加してください。

## CI

GitHub Actions で PR 作成時・main への push 時に自動実行:

1. **Lint** — ESLint によるコードチェック
2. **Test** — Vitest による単体テスト
3. **Build** — Next.js ビルドの成功確認

全てのチェックが通らないと main へのマージはできません（Branch Protection 設定時）。
