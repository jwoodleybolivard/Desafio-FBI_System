const express = require('express');
const jwt = require('jsonwebtoken');
const agentes = require('./data/agentes.js');

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));

// Ruta para devolver el formulario de inicio de sesión
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

const secretKey = 'my-secret-key';

// Ruta para autenticar a un agente y generar un token
app.get('/SignIn', (req, res) => {
    const { email, password } = req.query;
    // console.log('email recibido: ', email, 'passwordrecibido: ', password);
    const agent = agentes.results.find(agent => agent.email === email && agent.password === password);
    // console.log('agent: ', agent);

    if (!email || !password) {
        return res.status(401).send(`
      <html>
        <body>
          <h1>Faltan datos en el formulario, email y password son obligatorios</h1>
          <a href="/">Volver a intentar</a>
        </body>
      </html>
    `);
    }
    if (!agent) {
        return res.status(401).send(`
      <html>
        <body>
          <h1>Credenciales incorrectas revisalas</h1>
          <a href="/">Volver a intentar</a>
        </body>
      </html>
    `);
    }

    const token = jwt.sign({
        email: agent.email,
        password: agent.password
    }, secretKey, { expiresIn: '2m' });

    // console.log('token generado: ', token);

    res.send(`
    <html>
      <body>
        <h1>Bienvenido ${agent.email}</h1>
        <p>Token generado: ${token}</p>
        <button onclick="guardarToken('${token}')">Acceder a la página restringida</button>
        <script>
          function guardarToken(token) {
            sessionStorage.setItem('token', token);
            window.location.href = '/restringido?token=' + token;
          }
        </script>
      </body>
    </html>
  `);
});

// Middleware para verificar el token de autenticación
function verificarToken(req, res, next) {
    const token = req.query.token;

    if (!token) {
        return res.status(401).send(`
      <html>
        <body>
          <h1>Token no proveído</h1>
          <a href="/">Volver a iniciar sesión</a>
        </body>
      </html>
    `);
    }

    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.status(401).send(`
        <html>
          <body>
            <h1>Token inválido o expirado</h1>
            <a href="/">Volver a iniciar sesión</a>
          </body>
        </html>
      `);
        }
        req.email = decoded.email;
        next();
    });
}

// Ruta restringida
app.get('/restringido', verificarToken, (req, res) => {
    res.send(`<h1>Bienvenido ${req.email} a la página restringida</h1>`);
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}, visitalo en http://localhost:${PORT}`);
});



