import Head from 'next/head'
export default function Home(isLogined) {
  isLogined = false
  return (
    <Head>
      <meta charset="utf-8" />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
      />
      <link
        rel="icon"
        href="/favicon.ico"
        type="image/x-icon"
      /> 
      <link
        rel="shortcut icon"
        href="/favicon.ico"
        type="image/x-icon"
      />
    </Head>
  )
}
