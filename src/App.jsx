import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useEffect, useState } from 'react';
import './App.css';
import './style.css';

const KEEP_ALIVE_INTERVAL = 10000;

const Node = ({ node, path, onInputChange, xmlDoc, setUpdatedXml, duplicateIds }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [updatedNode, setUpdatedNode] = useState(null);
  const removableNodes = ['Store', 'PosId', 'MailTo', 'MailCC', 'Port'];
  const nonTextNodes = ['Stores', 'Ports', 'MailTos'];

  // update node when node changes
  useEffect(() => {
    console.log('Node updated');
  }, [node]);


  // update xml when xmlDoc changes
  useEffect(() => {
    // console.log('xmlDoc changed on Node');
  }, [xmlDoc]);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };
  
  const handleInputChange = (event, path, attrName, node) => {
    onInputChange(event, path, attrName, node);
  }
  
  const addPosId = (node, path) => {
    console.log('adding pos');
    console.log(node);
    console.log(path);

    const newPosId = xmlDoc.createElement('PosId');
    // get siblings then set content to length + 1
    // node: Store node
    const siblings = Array.from(node.children).filter(n => n.tagName === 'PosId');
    newPosId.textContent = siblings.length + 1;
    node.appendChild(newPosId);
    setUpdatedXml(new XMLSerializer().serializeToString(xmlDoc));
  }
  
  const removeNode = (node) => {
    console.log('removing node');
    console.log(node);
    node.remove();
    setUpdatedXml(new XMLSerializer().serializeToString(xmlDoc));
  }


  const addStore = (node, path) => {
    console.log('adding store');
    console.log(node);
    console.log(path);
    const newStore = xmlDoc.createElement('Store');
    newStore.setAttribute('id', '');
    newStore.setAttribute('secondPort', '');
    newStore.setAttribute('extStoreId', '');
    newStore.setAttribute('storeName', '');
    node.appendChild(newStore);
    // insert new store top
    node.insertBefore(newStore, node.firstChild);
    
    addPosId(newStore, path);

    setUpdatedXml(new XMLSerializer().serializeToString(xmlDoc));
  }

  const renderAttributes = (node) => {
    if (node.attributes.length === 0) return;
    return (
      <div key={"col" + path}
        className="col">
      <div key={"inputgroup" + path}
        className="input-group input-group-sm">
      {Array.from(node.attributes).map((attr, index) => (
        <>
          <span 
            id={"span" + attr.name + path + index}
            key={"span" + attr.name + path + index}
            className="input-group-text">
            {attr.name}
          </span>
          <input
            id={"input" + attr.name + path + index}
            key={"input" + attr.name + path + index}
            type="text"
            className="form-control form-control-sm"
            value={attr.value}
            onChange={(e) => handleInputChange(e, path, attr.name, node)}
          />
        </>
      ))}
      </div>
      </div>
    );
  }
  
  const addNode = (node, tagName) => {
    console.log('adding node');
    console.log(node);
    console.log(tagName);
    const newNode = xmlDoc.createElement(tagName);
    // add to top
    node.insertBefore(newNode, node.firstChild);
    setUpdatedXml(new XMLSerializer().serializeToString(xmlDoc));
  }

  const handleMailTos = (node, path) => {
    if (node.tagName !== 'MailTos') return;
    return (
      <div className="col-auto">
        <div className="input-group input-group-sm">
          <button className="btn btn-primary btn-sm" onClick={() => addNode(node, 'MailTo')}>
            Add MailTo 
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => addNode(node, 'MailCC')}>
            Add MailCC
          </button>
        </div>
      </div>
    );
  }

  const classes = ['pt-1', 'tag', 'px-2', 'row', 'align-items-center', 'gap-0'];

  // if store id is duplicate, highlight red and text white
  if (node.tagName === 'Store' && duplicateIds.has(node.getAttribute('id'))
    || (
    node.tagName === 'PosId' &&
    duplicateIds.has(node.parentNode.getAttribute('id')))
  )
  {
    classes.push('text-white');
  }

  let backgroundColor = '';
  if (node.tagName === 'Store' && node.getAttribute('id').trim() === '')
  {
    // yellow
    backgroundColor = 'rgba(255, 255, 0, 0.4)';
  }

  if (node.duplicate)
  {
    backgroundColor = 'rgba(255, 0, 0, 0.4)';
  }
  
  return (
    <div
      className={classes.join(' ')}
      style={{
        backgroundColor: backgroundColor,
        marginLeft: '2px'
      }}
      id={path}
    >
      <div className="col-auto me-auto">
        <label>{node.tagName}</label>
      </div>
      
      {renderAttributes(node)}
      
      {handleMailTos(node, path)}

      {node.tagName === 'Stores' ? (
        <div className="col-auto">
          <button className="btn btn-primary btn-sm my-1" onClick={() => addStore(node, path)}>
            Add Store
          </button>
        </div>
      ) : null }

      {node.tagName === 'Ports' ? (
        <div className="col-auto">
          <button className="btn btn-primary btn-sm my-1" onClick={() => addNode(node, 'Port')}>
            Add Port
          </button>
        </div>
      ) : null }

      {node.tagName === 'Store' ? (
        <div className="col-auto">
          <div className="input-group input-group-sm mt-1">
          <button type="button" className="btn btn-primary" onClick={() => addPosId(node, path)}>
            Add Pos
          </button>
          <button type="button" className="btn btn-danger" onClick={() => removeNode(node)}>
            Remove
          </button>
          </div>
        </div>
      ) : null }
      
      { node.children.length > 0 ? (
        <div className="col-auto mx-0 pw-0">
          <button className="btn btn-sm btn-primary"
            onClick={toggleOpen}>
            { isOpen ? '+' : '-' }
          </button>
        </div>
      ) : null }

      { nonTextNodes.includes(node.tagName) || node.children.length > 0 ? (
        null
      ) : (
        // dont have children? then it must be a text node
        <div className="col-5">
          <div className="input-group input-group-sm my-1">
            <label className="input-group-text">
              Value
            </label>
            <input
              type="text"
              value={node.textContent}
              className="form-control-sm form-control"
              onChange={(e) => handleInputChange(e, path, null, node)} 
            />

            {removableNodes.includes(node.tagName) ? (
              <button className="btn btn-danger btn-sm my-0 mx-0" onClick={() => removeNode(node)}>
                Remove
              </button>
          ) : null }

          </div>
        </div>
      ) }
      

      {isOpen && node.children.length > 0 ? 
        Array.from(node.children).map((child, index) => ( 
          <Node
            key={`${path}/${child.tagName}[${index + 1}]`}
            node={child}
            path={`${path}/${child.tagName}[${index + 1}]`}
            onInputChange={onInputChange}
            xmlDoc={xmlDoc}
            setUpdatedXml={setUpdatedXml}
            duplicateIds={duplicateIds}
          />
        )) : null }

    </div>
  );
};


function App() {
  const [xmlDoc, setXmlDoc] = useState(null);
  const [updatedXml, setUpdatedXml] = useState('');
  const [duplicateIds, setDuplicateIds] = useState(new Set());
  const [selectedFile, setSelectedFile] = useState('server.config');
  const [xmlFiles, setXmlFiles] = useState([]);
  const [userMsg, setUserMsg] = useState('Loading XML file...');

  var intervalId = null;

  // update xml when xmlDoc changes
  useEffect(() => {
    if (xmlDoc) {
      console.log('xmlDoc changed');
      setUpdatedXml(new XMLSerializer().serializeToString(xmlDoc));
    }
  },[xmlDoc]);
  
  const sendKeepAlive = () => {
    console.log('interval id: ' + intervalId);
    console.log('sending keep-alive for ' + selectedFile);
    fetch('/api/xml/keep-alive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: selectedFile })
    })
    .then(response => {
      if (!response.ok) {
        console.error('Failed to send keep-alive.');
      }
      if (response.status === 400) {
        setUserMsg('Session expired. Please refresh the page.');
        clearInterval(intervalId);
        setXmlDoc(null);
      }
    });
  }

  useEffect(() => {
    console.log('selected file changed: ' + selectedFile);
    
    if (selectedFile) {
      fetch(`/api/xml/${selectedFile}`)
        .then(response => {
          console.log(response);
          if (response.status === 409) {
            throw new Error('File is locked by another user.');
          }
          else if (response.status != 200) {
            throw new Error('Failed to load XML file.');
          }
          return response.text();
        })
        .then(data => {
          // parse xml
          const parser = new DOMParser();
          const xml = parser.parseFromString(data, 'application/xml');
          
          setXmlDoc(xml);
          findDuplicateIds(xml);

          console.log('xml loaded for ' + selectedFile);
          
          console.log('clearing interval id: ' + intervalId);
          clearInterval(intervalId);

          let id = setInterval(sendKeepAlive, KEEP_ALIVE_INTERVAL);
          console.log('new interval id: ' + id);
        
          intervalId = id;
          
          console.log('interval id: ' + intervalId);
        })
        .catch(err => {
          clearInterval(intervalId);

          setXmlDoc(null);
          setUserMsg(err.message);
          console.error(err);
        });
    }
    return () => {
      console.log('unmounting');
      clearInterval(intervalId);
    }
  }, [selectedFile]);

  function loadXMLFiles() {
    console.log('fetching xml file list');
    fetch('/api/xml/files')
      .then(response => response.json())
      .then(data => {
        setXmlFiles(data);
      }).catch(err => {
        alert('Failed to fetch xml files.');
      });
  }


  // fetch xml file on load
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      clearInterval(intervalId);
      
      navigator.sendBeacon(`/api/xml/${selectedFile}/unlock`, JSON.stringify({ filename: selectedFile }));
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('Switched to another tab');
        clearInterval(intervalId);
      } else {
        console.log('Switched back to tab');
        // loadXMLFiles();
        // let id = setInterval(sendKeepAlive, KEEP_ALIVE_INTERVAL);
        // console.log('new interval id: ' + id);
        // intervalId = id;
      }
    }

    console.log('Loading site');
    loadXMLFiles();
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
  }, []);

  const handleFileChange = (event) => {
    const prevFile = selectedFile;
    setSelectedFile(event.target.value);
    navigator.sendBeacon(`/api/xml/${prevFile}/unlock`, JSON.stringify({ filename: prevFile }));
  };

  const findDupChildren = (node) => {
    // check textContent of node to determine if it's a duplicate
    const children = Array.from(node.children);
    const ids = new Map();
    const duplicates = new Set();
    children.forEach((child, index) => {
      const id = child.textContent;
      if (id === null || id.trim() === '') {
        return;
      }   
      if (ids.has(id)) {
        duplicates.add(id);
      } else {
        ids.set(id, true);
      }
    });
    
    children.forEach(child => {
      child.duplicate = false;
    });

    duplicates.forEach(id => {
      children.forEach(child => {
        if (child.textContent === id) {
          child.duplicate = true;
        }
      });
    });

  };

  const findDuplicateIds = (xml) => {
    const ids = new Map();
    const duplicates = new Set();
     
    xml.querySelectorAll('Store').forEach((store, index) => {
      store.duplicate = false;
      findDupChildren(store);

      const id = store.getAttribute('id');
      if (id === null || id.trim() === '') {
        return;
      }
      if (ids.has(id)) {
        duplicates.add(id);
      } else {
        ids.set(id, true);
      }
    });

    xml.querySelectorAll('Store').forEach(store => {
      if (duplicates.has(store.getAttribute('id'))) {
        store.duplicate = true;
      }
    });
    
    setDuplicateIds(duplicates);
  };

  const handleInputChange = (event, path, attrName, node) => {
    const newDoc = xmlDoc.cloneNode(true);
    console.log('path', path);
    console.log('attrName', attrName);
    console.log('node', node);

    if (attrName) {
      node.setAttribute(attrName, event.target.value);
    } else {
      node.textContent = event.target.value;
    }
    
    setUpdatedXml(new XMLSerializer().serializeToString(xmlDoc));
    findDuplicateIds(xmlDoc);
  };

  const getNodeByPath = (doc, path) => {
    let currentNode = doc.documentElement;
    const parts = path.split('/');
    for (let i = 1; i < parts.length; i++) {
      const [tagName, index] = parts[i].match(/(\w+)(?:\[(\d+)\])?/).slice(1, 3);
      if (currentNode === undefined) {
        return;
      }
      const children = Array.from(currentNode.children).filter(n => n.tagName === tagName);
      currentNode = children[(index ? index - 1 : 0)];
    }
    return currentNode;
  };

  const saveXml = () => {
    console.log('saving xml');
    if (!xmlDoc) {
      return;
    }
    
    // check if stores have empty id
    // if so, alert and return
    const stores = xmlDoc.querySelectorAll('Store');
    if (stores.length === 0) {
      alert('No stores found.');
      return;
    }

    for (let i = 0; i < stores.length; i++) {
      if (!stores[i].getAttribute('id') || stores[i].getAttribute('id').trim() === '') {
        alert('Store id cannot be empty.');
        return;
      }
    }
    
    if (duplicateIds.size > 0) {
      alert('Duplicate store ids found. Please fix before saving.');
      return;
    }
    
    console.log('saving xml');
    console.log(updatedXml);

    fetch('/api/xml', {
      method: 'POST',
      headers: { 'Content-Type': 'application/xml' },
      body: updatedXml
    }).then(response => {
      if (response.ok) {
        alert('XML file saved successfully.');
      } else if (response.status === 409) {
        alert('Another user is in the system. Wait until they leave and reload the page.');
        // setEditable(false);
        setUserMsg('Another user is in the system. Wait until they leave and reload the page.');
        setXmlDoc(null);
      } else {
        alert('Failed to save XML file.');
      }
    });
    loadXMLFiles(); // reload xml files
  };
  
  

  return (
    <>
      <header>
        <nav className="navbar navbar-expand-md navbar-dark fixed-top bg-dark">
          <div className="container-fluid justify-content-center">
            <div className="navbar-brand d-flex align-items-center">
              <h3 className="me-2 my-0">XML Editor</h3>
            </div>
            <button className="btn btn-primary" onClick={saveXml}>
              Save
            </button>
            
            <label className="mx-2 text-white">
              Select XML file:
            </label>

            <select className="w-auto form-select form-select-sm" onChange={handleFileChange} value={selectedFile}>
              {xmlFiles.map(file => (
                <option key={file}>
                  {file}
                </option>
              ))} 
            </select>

          </div>
        </nav>
      </header>
      <div className="vw-100 justify-content-center container mt-5 pt-5 w-100 px-0" id="xmlContainer">
        {xmlDoc ? ( 
          <Node
            key={xmlDoc.documentElement.tagName}
            node={xmlDoc.documentElement} 
            path={xmlDoc.documentElement.tagName}
            onInputChange={handleInputChange}
            xmlDoc={xmlDoc}
            setUpdatedXml={setUpdatedXml}
            duplicateIds={duplicateIds}
          />
        ) : <div className="text-center">
              <h1>
                { userMsg }
              </h1>
            </div>
        }
      </div>
    </>
  );
}

export default App
