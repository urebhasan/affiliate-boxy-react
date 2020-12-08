import { SiteBaseUrl } from 'aws-sdk/clients/quicksight'
import { AnyARecord } from 'dns'
import React, { useEffect } from 'react'
import './style.css'

const initialState = { name: '' }

interface Site {
    id?: number,
    name: string
}

const Sites = () =>{
    const [formState, setFormState] = React.useState(initialState)
    const [sites, setSites] = React.useState<any>([])

    function setInput(key: string, value: string) {
        console.log('Setinput ', key, value)
        setFormState({ ...formState, [key]: value })
    }

    async function addTodo() {
        try {
          if (!formState.name) return
          let site: Site = { ...formState }
          site['id'] = sites.length !== 0 ? sites.length+1 : 1
          //const { todos } = this.state
          setSites([...sites, site])
          console.log(sites)
          setFormState(initialState)
          //await API.graphql(graphqlOperation(createTodo, {input: todo}))
        } catch (err) {
          console.log('error creating todo:', err)
        }
        //localStorage.setItem('todos', todos)
    }

    return (
        <div>
        <div id="container">
          <h2>Add your sites here</h2>
          <input
            onChange={event => setInput('name', event.target.value)}
            value={formState.name} 
            placeholder="Add your site's url"
          />
          {/* <input
            onChange={event => setInput('description', event.target.value)}
            style={styles.input}
            value={formState.description}
            placeholder="Description"
          /> */}
          <button id="button" onClick={addTodo}>Add URL</button>
          {
            sites.map((site: Site, index: number) => (
              <div key={site.id ? site.id : index} id="todo">
                <p id="todoName">{site.name}</p>
                {//<p style={styles.todoDescription}>{todo.description}</p>
                }
                <span id="statuses">
                  <span id="active">ACTIVE:</span> 0, BROKEN LINKS: 0
                </span>
              </div>
            ))
          }
        </div>
        </div>
      )
}

// const styles = {
//     container: { width: '85rem', margin: ' auto', display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'center', padding: 20 },
//     todo: {  
//       marginBottom: 15, 
//       backgroundColor: '#ffcc80', 
//       borderRadius: '25px', 
//       padding: '5px 10px 5px 10px',
//       marginTop: 10,
//       marginLeft: 30,
//       marginRight: 30,
//     },
//     statuses: {
//       float: 'right',
//       fontSize: 18,
//       fontWeight: 'bold'
//     },
//     active: {
//       color: '#ff0000'
//     },
//     input: { border: 'none', backgroundColor: '#ddd', marginBottom: 10, padding: 8, fontSize: 18, width: '40%', borderRadius: '15px' },
//     todoName: { fontSize: 20, fontWeight: 'bold' },
//     todoDescription: { marginBottom: 0 },
//     button: { backgroundColor: 'black', color: 'white', outline: 'none', fontSize: 18, padding: '12px 0px', width: '15%', align: 'right', borderRadius: '15px' }
// }

export default Sites;