import Head from 'next/head'
export default function Home(isLogined) {
  isLogined = false
  return (
    <div>
      <Head>
        <meta charset="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />
      </Head>
    </div>
  )
}
