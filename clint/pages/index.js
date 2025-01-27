import Header from '../components/index/Header'
import Board from '../components/index/Board'
import Boder from '../components/index/Banner'
export default function Home(isLogined) {
  isLogined = false
  return (
    <div>
      <Header></Header>
      <Boder></Boder>
      <Board></Board>
    </div>
  )
}
