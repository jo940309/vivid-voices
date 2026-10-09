import type {Metadata} from 'next';import './globals.css';
export const metadata:Metadata={title:'活色聲香｜TK流行歌唱社',description:'TK流行歌唱社活色聲香投票網站'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="zh-Hant"><head><link rel="stylesheet" href="/style.css"/></head><body>{children}</body></html>}