import './ItemPage.css'
import { useParams } from 'react-router-dom'
import Sidebar from '../../components/Sidebar/Sidebar'

function ItemPage() {
  const { id } = useParams()

  return (
    <div>
        <Sidebar />
        <h1 class="item-name">Item {id}</h1>
    </div>
  )
}

export default ItemPage