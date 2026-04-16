import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Actions では GITHUB_REPOSITORY="owner/repo" が自動でセットされる。
// リポジトリ名を取り出して絶対パスの base を生成し、GitHub Pages の project page
// でアセットが確実に解決されるようにする。
// ローカル開発時は変数が存在しないため './' にフォールバックする。
const repository = process.env.GITHUB_REPOSITORY?.split('/')[1]

export default defineConfig({
  plugins: [react()],
  base: repository ? `/${repository}/` : './',
})
