const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');


const app = express();
const port = 3000;

// Use o cors
app.use(cors());

// Middleware para o Express enternder JSON no corpo da requisição (req.body)
app.use(express.json());


// 1. Configura a conexão com o MySQL
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
    password: '',
    database: 'vestshop_supa'
});

// Conecta ao banco de dados
connection.connect((err) => {
    if (err) {
      console.error('Erro ao conectar ao MySQL: ', err.stack );
      return;
    }
    console.log('Conectado ao MySQL com sucesso!');

    // Cria a tabela 'alunos'  caso ela não exista
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS alunos(
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL
      )`;
      connection.query( createTableQuery, (err) => {
        if (err) {
          console.error('Erro ao criar tabela: ', err.stack );
          return;
        }

    // Cria a tabela 'clientes' caso ela não exista
  const createTableQuery = `
      CREATE TABLE IF NOT EXISTS clientes(
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        senha VARCHAR(255) NOT NULL,
        onboarding_concluido BOOLEAN DEFAULT FALSE
      )`;

    connection.query(createTableQuery, (err) => {
      if (err) {
        console.error('Erro ao criar tabela: ', err.stack);
        return;
      }
    });

    // Cria a tabela 'notificacao_sistema' caso ela não exista
  const createNotificacaoTableQuery = `
      CREATE TABLE IF NOT EXISTS notificacao_sistema(
        id_notificacao INT AUTO_INCREMENT PRIMARY KEY,
        id_usuario INT NOT NULL,
        tipo_notificacao VARCHAR(50) NOT NULL,
        titulo VARCHAR(150) NOT NULL,
        mensagem TEXT NOT NULL,
        canal VARCHAR(20),
        status VARCHAR(50) NOT NULL,
        opt_out_respeitado BOOLEAN,
        data_envio TIMESTAMP
      )`;

    connection.query(createNotificacaoTableQuery, (err) => {
      if (err) {
      console.error('Erro ao criar tabela: ', err.stack);
      return;
    }
  });
});
      

connection.query(createTableQuery, (err) => {
  if (err) {
    console.error('Erro ao criar tabela: ', err.stack);
    return;
  }
});
});

app.get('/alunos', (req, res) => {
  connection.query('SELECT * FROM alunos', (err, results) => {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao buscar alunos'});
    }
    res.json(results);
  });
});


app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}/`);
});

// Cadastrar cliente
app.post('/clientes', (req, res) => {
  const { nome, email, senha } = req.body;

  const insertQuery = `
    INSERT INTO clientes (nome, email, senha)
    VALUES (?, ?, ?)
  `;

  connection.query(insertQuery, [nome, email, senha], (err, results) => {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao cadastrar cliente' });
    }

    res.json({ mensagem: 'Cliente cadastrado com sucesso!' });
  });
});

// Autenticar cliente
app.post('/login', (req, res) => {
  const { email, senha } = req.body;

  const loginQuery = `
    SELECT * FROM clientes
    WHERE email = ? AND senha = ?
  `;

  connection.query(loginQuery, [email, senha], (err, results) => {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao realizar login' });
    }

    if (results.length === 0) {
      return res.status(401).json({ erro: 'Email ou senha incorretos' });
    }

    res.json({
      mensagem: 'Login realizado com sucesso!',
      cliente: {
        id: results[0].id,
        nome: results[0].nome,
        email: results[0].email
      }
    });
  });
});

// Cadastrar notificacao
app.post('/notificacoes', (req, res) => {
  const { id_usuario, tipo_notificacao, titulo, mensagem, canal, status, opt_out_respeitado, data_envio } = req.body;

  if (!id_usuario || !tipo_notificacao || !titulo || !mensagem || !status) {
    return res.status(400).json({
      erro: 'Informe id_usuario, tipo_notificacao, titulo, mensagem e status'
    });
  }

  const insertQuery = `
    INSERT INTO notificacao_sistema
    (id_usuario, tipo_notificacao, titulo, mensagem, canal, status, opt_out_respeitado, data_envio)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  connection.query(
    insertQuery, [ id_usuario, tipo_notificacao, titulo, mensagem, canal || null, status, opt_out_respeitado ?? null, data_envio || null ],
    (err, results) => {
      if (err) {
        return res.status(500).json({ erro: 'Erro ao cadastrar notificacao' });
      }

      res.json({
        mensagem: 'Notificacao cadastrada com sucesso!',
        id_notificacao: results.insertId
      });
    }
  );
});

// Listar notificacoes de um usuario
app.get('/notificacoes/:id_usuario', (req, res) => {
  const { id_usuario } = req.params;

  const selectQuery = `
    SELECT * FROM notificacao_sistema
    WHERE id_usuario = ?
    ORDER BY data_envio DESC
  `;

  connection.query(selectQuery, [id_usuario], (err, results) => {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao buscar notificacoes' });
    }

    res.json(results);
  });
});