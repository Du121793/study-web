import Layout from '../components/Layout'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Navs from '../components/Navs'
import Board from '../components/Board'
export default function Home(isLogined) {
  isLogined = false
  return (
    <div>
      <Header></Header>
      <Board></Board>
      <Layout></Layout>
      <Footer></Footer>
    </div>
  )
}
