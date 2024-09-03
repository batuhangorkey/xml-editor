import express from 'express';
import path from 'path';
import fs from 'fs';
import bodyParser from 'body-parser';
import cors from 'cors';
import session from 'express-session';

const app = express();

const secret = process.env.SECRET || 'secret';

app.use(session({
  secret: secret,
  resave: false,
  saveUninitialized: true,
}));

const __dirname = path.resolve();
console.log('Current directory: ' + __dirname);

const PORT = process.env.CONTAINER_PORT  || 8080;
const TIMEOUT = process.env.TIMEOUT || 25000;
const xmlDir = process.env.XML_DIR_PATH || path.join(__dirname, 'xml');
const xmlFileName = process.env.XML_FILE_NAME || 'server.config';

const xmlFilePath = path.join(xmlDir, xmlFileName);

const locks = {};

app.use(cors());
app.use(bodyParser.text({ type: 'application/xml' }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'dist')));

app.get('/', (req, res) => {
  console.log('session id: ' + req.sessionID);

  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

app.get('/api/xml/files', (req, res) => {
  // get all xml files in the public directory
  // return the list of files
  const files = fs.readdirSync(xmlDir);
  const xmlFiles = files.filter(file => file.endsWith('.config'));
  res.json(xmlFiles);
});


// POST request to update the xml file
app.post('/api/xml', (req, res) => {
  if (!req.body) {
    return res.status(400).send('Request body is missing');
  } else if (req.body === '') {
    return res.status(400).send('Request body is empty');
  }

  if (!locks[xmlFileName]) {
    return res.status(409).send('File is not locked');
  }

  if (locks[xmlFileName].sessionId !== req.sessionID) {
    
    return res.status(409).send('File is locked by another session');
  }

  const xmlData = req.body;
  console.log(xmlData);
  
  // define the path of the xml file to be updated
  // save the previous xml file with timestamp old-config-year-month-day-hour-minute-second.xml
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const oldxmlFilePath = path.join(xmlDir, `old-server-${timestamp}.config`);
  console.log(oldxmlFilePath);

  // rename the current xml file to old-config-year-month-day-hour-minute-second.xml
  fs.renameSync(xmlFilePath, oldxmlFilePath);

  // write the new xml data to the xml file
  fs.writeFile(xmlFilePath,
    xmlData,
    (err) => {
      if (err) {
        res.status(500).send('Error writing file');
      } else {
        res.status(200).send('File updated');
      }
    });
});

// /api/xml/filename.xml to get the content of the specified xml file
app.get('/api/xml/:filename', (req, res) => {
  console.log('session id: ' + req.sessionID);
  console.log('Reading file: ' + req.params.filename);
  
  if (!locks[req.params.filename]) {
    console.log('File not locked');
    console.log('Locking file');
    console.log('session id: ' + req.sessionID);
    locks[req.params.filename] = {
      sessionId: req.sessionID,
      timestamp: Date.now(),
    };
    res.type('application/xml');
    res.status(200).send(fs.readFileSync(path.join(xmlDir, req.params.filename), 'utf8'));

  } 
  else if (locks[req.params.filename].sessionId !== req.sessionID) 
  {
    console.log('File locked by another session');
    res.sendStatus(409); // Conflict
  } 
  else 
  {
    console.log('File locked by this session id already');
    console.log('session id: ' + req.sessionID);
    console.log('file session id: ' + locks[req.params.filename].sessionId);

    // check if the xml file we are reading is read only with fs module
    // if it is read only, return 400 status code
    // if it is not read only, return the content of the xml file
    const stats = fs.statSync(path.join(xmlDir, req.params.filename));
    if (stats.mode & 0o200) {
      res.type('application/xml');
      res.status(200).send(fs.readFileSync(path.join(xmlDir, req.params.filename), 'utf8'));
    } else {
      console.log('File is read only');
      res.status(401).send('File is read only');
    }

    //res.type('application/xml');
    //res.status(200).send(fs.readFileSync(path.join(xmlDir, req.params.filename), 'utf8'));
  }

});

app.post('/api/xml/:filename/unlock', (req, res) => {
  console.log('trying to unlock file: ' + req.params.filename);
  console.log(locks);

  const filename = req.params.filename;
  const sessionId = req.sessionID;

  if (locks[filename] === undefined) {
    console.log('this file is not locked');
    console.log('*'.repeat(20));

    return res.status(400).send('This file is not locked.');
  } else if (locks[filename].sessionId === sessionId) {
    delete locks[filename];
    console.log('File unlocked: ' + filename);
    res.send('File unlocked.').status(200);
  } else {
    res.status(400).send('You do not have the lock on this file.');
  }
});

app.get('/api/xml/amialone', (req, res) => {
  console.log('Checking if I am alone');
  console.log(locks);

  if (Object.keys(locks).length === 0) {
    console.log('I am alone');
    res.sendStatus(200);
  } else {
    console.log('I am not alone');
    res.sendStatus(409);
  }
});

app.post('/api/xml/keep-alive', (req, res) => {
  console.log('keep-alive api called by session id: ' + req.sessionID);
  const sessionId = req.sessionID;
  const filename = req.body.filename;
  console.log('keep alive for: ' + filename);
  console.log(locks);
  console.log('Length: ' + Object.keys(locks).length);

  if (!locks[filename]) {
    locks[filename] = {
      sessionId: sessionId,
      timestamp: Date.now(),
    };
    console.log('Locking file: ' + filename);
    console.log('session id: ' + sessionId);
    return res.sendStatus(200);
  }

  if (locks[filename] && locks[filename].sessionId === sessionId) 
  {
    locks[filename].timestamp = Date.now(); // Update timestamp on each ping
    res.sendStatus(200);
  }
  else
  {
    console.log('File locked by another session');
    res.sendStatus(400);
  }
});

// Monitor locks for stale sessions
setInterval(() => {
  const now = Date.now();
  for (const filename in locks) {
    if (now - locks[filename].timestamp > TIMEOUT) {
      console.log('Lock expired for file: ' + filename);
      delete locks[filename];
      console.log('Lock removed for file: ' + filename);
      console.log('*'.repeat(20));
    }
  }
}, TIMEOUT);


app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

