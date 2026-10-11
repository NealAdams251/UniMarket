import './ItemPage.css'
import { useParams } from 'react-router-dom'

function ItemPage() {
  const { id } = useParams()

  return (
    <div>
      <h1 class="item-name">Item {id}</h1>
    </div>
  )
}

export default ItemPage