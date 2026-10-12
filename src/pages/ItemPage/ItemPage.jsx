import './ItemPage.css'
import { useParams } from 'react-router-dom'
import Sidebar from '../../components/Sidebar/Sidebar'

import examplePic from '../../assets/pencil.png'

function ItemPage() {
  const { id } = useParams()

  return (
    <div className='item-page'>
        <Sidebar />
        <main className='item-layout'>

            {/* WILL BE REPLACED WITH ACTUAL ITEM DESCRIPTIONS--NEED TO STORE THE ITEMS TO BACKEND FIRST*/}
            <h1 class="item-name">Item {id} </h1>
        
        </main>
    </div>
  )
}

export default ItemPage