import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';
import './style.css';
import debounce from 'lodash/debounce';
import { find, set } from 'lodash';

const KEEP_ALIVE_INTERVAL = 10000;
const removableNodes = ['Store', 'PosId', 'MailTo', 'MailCC', 'Port'];
const nonTextNodes = ['Stores', 'Ports', 'MailTos', 'DBPropertyFile', 'UploadTransDB'];
const numberNodes = ['Port', 'PosId'];
const warningColor = 'rgba(0, 255, 0, 0.4)'; // green
const alertColor = 'rgba(255, 0, 0, 0.4)'; // red

const getBGColor = (node) => {
  if (node.duplicate) {
    return alertColor;
  }
  if (node.tagName === 'Store') {
    if (!node.getAttribute('id') || node.getAttribute('id').trim() === '') {
      return warningColor;
    } else if (node.getAttribute('id').match(/\D/)) {
      return alertColor;
    }
  } else if (numberNodes.includes(node.tagName) && node.textContent.match(/\D/)) {
    return alertColor;  
  } else if (nonTextNodes.includes(node.tagName)) {
    return '';
  } else if (node.textContent.trim() === '') {
    return warningColor;
  }
  return '';
};

const Node = ({ node, path, xmlDoc, setUpdatedXml, handleInputChange }) => {
  const [isOpen, setIsOpen] = useState( node.tagName === 'Store' ? false : true );
  const [value, setValue] = useState(node.textContent);
  // const [bgColor, setBgColor] = useState(getBGColor(node));

  useEffect(() => {
    console.log('Node updated');
  });

  const onValueChange = (e, attrName) => {
    setValue(e.target.value);
    if (attrName) {
      node.setAttribute(attrName, e.target.value);
    } else {
      node.textContent = e.target.value;
    }
    console.log('path: ' + path);
    handleInputChange(e, path, attrName, node, xmlDoc);
  }

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const addPosId = (node) => {
    const newPosId = xmlDoc.createElement('PosId');
    // get siblings then set content to length + 1
    // node: Store node
    const siblings = Array.from(node.children).filter(n => n.tagName === 'PosId');
    newPosId.textContent = siblings.length + 1;
    node.appendChild(newPosId);
    setUpdatedXml(new XMLSerializer().serializeToString(xmlDoc));
  }

  const removeNode = (node) => {
    node.remove();
    setUpdatedXml(new XMLSerializer().serializeToString(xmlDoc));
  }

  const addStore = (node) => {
    const newStore = xmlDoc.createElement('Store');
    newStore.setAttribute('id', '');
    newStore.setAttribute('secondPort', '');
    newStore.setAttribute('extStoreId', '');
    newStore.setAttribute('storeName', '');
    node.appendChild(newStore);
    // insert new store top
    node.insertBefore(newStore, node.firstChild);
    addPosId(newStore);
    setUpdatedXml(new XMLSerializer().serializeToString(xmlDoc));
  }

  const addNode = (node, tagName) => {
    const newNode = xmlDoc.createElement(tagName);
    // add to top
    node.insertBefore(newNode, node.firstChild);
    console.log(node);
    console.log(newNode);
    setUpdatedXml(new XMLSerializer().serializeToString(xmlDoc));
  }

  const Attributes = ({ node }) => {
    if (node.attributes === undefined) return null;
    if (node.attributes.length === 0) return null;
    return Array.from(node.attributes).map((attr, index) => (
      <div key={"col" + path + index} className="col">
        <div
          key={"input-group" + path + index}
          className="input-group input-group-sm py-1">
          <span
            key={"span" + path + index}
            className="input-group-text"
            style={{ 
              fontStyle: 'italic',
              color: 'blue'
            }}>
              {attr.name}
          </span>
          <input
            key={"input" + path + index}
            type="text"
            className="form-control form-control-sm"
            value={attr.value}
            onChange={(e) => onValueChange(e, attr.name)}
          />
        </div>
      </div>
    ));
  }

  const MailTosComponent = ({ node }) => {
    if (node.tagName !== 'MailTos') return null;
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


  const classes = ['py-0', 'tag', 'row', 'align-items-center', 'gap-0', 'ps-4', 'pe-0']; 

  if (node.parentNode && node.parentNode.duplicate || node.duplicate) {
    classes.push('text-white');
  }  else {
    classes.push('text-dark');
  }
  
  return (
    <div
      className={classes.join(' ')}
      style={{
        backgroundColor: getBGColor(node),
      }}
      id={path}
    >
      <div className="col-auto me-auto">
        <label>
          <b>
            {node.tagName}
          </b>
        </label>
      </div>

      {Attributes({ node })}

      {MailTosComponent({ node })}

      {node.tagName === 'Stores' ? (
        <div className="col-auto">
          <button className="btn btn-primary btn-sm my-1" onClick={() => addStore(node, path)}>
            Add Store
          </button>
        </div>
      ) : null}

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
      ) : null}

      {node.children.length > 0 ? (
        <div className="col-auto mx-0 pw-0">
          <button className="btn btn-sm btn-primary my-1"
            onClick={toggleOpen}>
            {isOpen ? '-' : '+'}
          </button>
        </div>
      ) : null}

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
              onChange={(e) => onValueChange(e)}
            />

            {removableNodes.includes(node.tagName) ? (
              <button className="btn btn-danger btn-sm" onClick={() => removeNode(node)}>
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
            xmlDoc={xmlDoc}
            handleInputChange={handleInputChange}
            setUpdatedXml={setUpdatedXml}
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
  const [userMsg, setUserMsg] = useState('');

  var intervalId = null;

  // update xml when xmlDoc changes
  useEffect(() => {
    if (xmlDoc) {
      console.log('xmlDoc changed');
      //setUpdatedXml(new XMLSerializer().serializeToString(xmlDoc));
    }
    return () => {
      console.log('unmounting');
    }
  }, [xmlDoc]);
  
  
  // debounce sanity check
  const debouncedSanityCheck = useCallback(debounce((xml) => {
    findDuplicateIds(xml);
  }
  , 1000), []);

  const sendKeepAlive = () => {
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
        setUserMsg('File is locked by another user.');
        clearInterval(intervalId);
        setEditable(false);
        // setXmlDoc(null);
      }
    });
  }

  useEffect(() => {
    if (selectedFile) {
      setUserMsg('Loading XML file...');

      fetch(`/api/xml/${selectedFile}`)
        .then(response => {
          if (response.status === 409) {
            throw new Error('File is locked by another user.');
          }
          else if (response.status === 401) {
            throw new Error('File is read only.');
          }
          else if (response.status !== 200) {
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
          clearInterval(intervalId);
          let id = setInterval(sendKeepAlive, KEEP_ALIVE_INTERVAL);
          // console.log('new interval id: ' + id);
          intervalId = id;
          // console.log('interval id: ' + intervalId);
          setUserMsg('');
        })
        .catch(err => {
          clearInterval(intervalId);
          setXmlDoc(null);
          setUserMsg(err.message);
          console.error(err);
        });
    }
    return () => {
      // console.log('unmounting');
      clearInterval(intervalId);
    }
  }, [selectedFile]);

  function loadXMLFiles() {
    // console.log('Fetching xml file list');

    fetch('/api/xml/files')
      .then(response => response.json())
      .then(data => {
        setXmlFiles(data);
      }).catch(err => {
        alert('Failed to fetch xml files.');
      });
  }

  // fetch xml file on mount
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      clearInterval(intervalId);
      navigator.sendBeacon(`/api/xml/${selectedFile}/unlock`, JSON.stringify({ filename: selectedFile }));
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        //console.log('Switched to another tab');
        clearInterval(intervalId);
      } else {
        //console.log('Switched back to tab');
        sendKeepAlive();

        clearInterval(intervalId);
        let id = setInterval(sendKeepAlive, KEEP_ALIVE_INTERVAL);
        intervalId = id;
        loadXMLFiles();
      }
    }

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
    // check textContent of children of a node to determine if it's a duplicate
    // if so, set duplicate to true
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

    return duplicates;
  };

  // find duplicate store ids
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
    const ports = xml.querySelectorAll('Ports')[0];
    findDupChildren(ports);
    setDuplicateIds(duplicates);
  };

  // handle input change
  const handleInputChange = (event, path, attrName, node, xml) => {
    debouncedSanityCheck(xml);
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
  
  const setEditable = (editable) => {
    const nodes = xmlDoc.querySelectorAll('*');
    for (let i = 0; i < nodes.length; i++) {
      if (editable) {
        nodes[i].removeAttribute('readonly');
      } else {
        nodes[i].setAttribute('readonly', true);
      }
    }
  };

  const checkNoChildren = (tagName) => {
    const nodes = xmlDoc.querySelectorAll(tagName);
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].children.length === 0) {
        alert(`Node ${tagName} cannot be empty. Please fix before saving.`);
        return true;
      }
    }
    return false;
  };

  const checkTextEmptyNode = (node) => {
    if (node.children.length === 0 && node.textContent.trim() === '') {
      alert(`Node ${node.tagName} cannot be empty. Please fix before saving.`);
      return;
    }
  };

  const saveXml = () => {
    if (!xmlDoc) {
      return;
    }
    // check nodes without children
    const nodes = xmlDoc.querySelectorAll('*');
    for (let i = 0; i < nodes.length; i++) {
      if (!nonTextNodes.includes(nodes[i].tagName) && nodes[i].children.length === 0 && nodes[i].textContent.trim() === '') {
        alert(`Node ${nodes[i].tagName} cannot be empty. Please fix before saving.`);
        return;
      }
    }
  
    if (checkNoChildren('MailTos') ||
        checkNoChildren('Stores') ||
        checkNoChildren('Ports')) {
      return;
    }
  
    // check ports
    const ports = xmlDoc.querySelectorAll('Port');
    if (ports.length === 0) {
      alert('No ports found.');
      return;
    }
    for (let i = 0; i < ports.length; i++) {
      if (ports[i].textContent.trim() === '') {
        alert('Port cannot be empty. Please fix before saving.');
        return;
      } else if (ports[i].textContent.match(/\D/)) {
        alert(`Port ${ports[i].textContent} must be a number. Please fix before saving.`);
        return;
      }
    }

    // check if stores are unique, not empty, and numbers
    // if so, alert and return
    const stores = xmlDoc.querySelectorAll('Store');
    if (stores.length === 0) {
      alert('No stores found.');
      return;
    }
    for (let i = 0; i < stores.length; i++) {
      if (!stores[i].getAttribute('id') || stores[i].getAttribute('id').trim() === '') {
        alert('Store id cannot be empty. Please fix before saving.');
        return;
      } else if (stores[i].getAttribute('id').match(/\D/)) {
        alert(`Store with id ${stores[i].getAttribute('id')} must be a number. Please fix before saving.`);
        return;
      } else if (duplicateIds.has(stores[i].getAttribute('id'))) {
        alert(`Duplicate Store id ${stores[i].getAttribute('id')} found. Please fix before saving.`);
        return;
      }
    }

    // check if pos ids are unique, not empty, and numbers
    // if not, alert and return
    for (let i = 0; i < stores.length; i++) {
      const posIds = stores[i].querySelectorAll('PosId');
      const ids = new Map();
      if (posIds.length === 0) {
        alert('No PosIds found in Store ' + stores[i].getAttribute('id') + '. Please fix before saving.');
        return;
      }
      for (let j = 0; j < posIds.length; j++) {
        const id = posIds[j].textContent;
        if (ids.has(id)) {
          alert('Duplicate PosId found in Store ' + stores[i].getAttribute('id') + '. Please fix before saving.');
          return;
        } else if (id.trim() === '') {
          alert('PosId cannot be empty in Store ' + stores[i].getAttribute('id') + '. Please fix before saving.');
          return;
        } else if (id.match(/\D/)) { 
          alert('PosId must be a number in Store ' + stores[i].getAttribute('id') + '. Please fix before saving.');
          return;
        } else {
          ids.set(id, true);
        }
      }
    }

    const xmlString = new XMLSerializer().serializeToString(xmlDoc);
    console.log(xmlString);
    fetch('/api/xml', {
      method: 'POST',
      headers: { 'Content-Type': 'application/xml' },
      body: xmlString
    }).then(response => {
      if (response.ok) {
        alert('XML file saved successfully.');
      } else if (response.status === 409) {
        // alert('Another user is in the system. Wait until they leave and reload the page.');
        // setEditable(false);
        setUserMsg('Your session has expired and another user entered the editor. Please wait and reload the page.');
        // setXmlDoc(null);
      } else {
        alert('Failed to save XML file.' + response.statusText);
        console.log(response);
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
            <button 
              className="btn btn-primary" 
              onClick={saveXml} 
              disabled={userMsg !== ''}>
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
      <div className="vw-100 justify-content-center container mt-3 pt-5 w-100 px-0" id="xmlContainer">
        { userMsg ? (
          <div className="text-center">
            <h1>
              { userMsg }
            </h1>
          </div>
        ) : null }

        {xmlDoc ? ( 
          <Node
            key={xmlDoc.documentElement.tagName}
            node={xmlDoc.documentElement} 
            path={xmlDoc.documentElement.tagName}
            handleInputChange={handleInputChange}
            xmlDoc={xmlDoc}
            setUpdatedXml={setUpdatedXml}
            duplicateIds={duplicateIds}
          />
        ) : null }
      </div>
    </>
  );
}

export default App
