'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="panel"><h1>This page could not load</h1><p>Please try again. Your saved information has not been removed.</p><button className="btn" onClick={reset}>Try again</button><a href="/">Return home</a></main>}
