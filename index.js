const express = require('express');
const bodyParser = require('body-parser');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do Sequelize com SQLite
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'database.sqlite'
});

// Definição do modelo para o quadro de líderes
const LeaderboardEntry = sequelize.define('LeaderboardEntry', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true // Garante que nomes sejam únicos
    },
    score: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});

app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));

// Sincronização do modelo com o banco de dados
sequelize.sync()
    .then(() => {
        console.log('Database and tables synchronized');
    })
    .catch((error) => {
        console.error('Error synchronizing database:', error);
    });

// Rota para obter os top 20 jogadores do quadro de líderes
app.get('/leaderboard', async (req, res) => {
    try {
        const leaderboard = await LeaderboardEntry.findAll({
            order: [['score', 'DESC']],
            limit: 20,
            attributes: ['name', 'score']
        });
        res.json(leaderboard);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

// Rota para adicionar ou atualizar a pontuação de um jogador no quadro de líderes
app.post('/leaderboard', async (req, res) => {
    const { name, score } = req.body;
    try {
        let playerEntry = await LeaderboardEntry.findOne({ where: { name } });

        if (playerEntry) {
            // Atualiza a pontuação se o jogador já existir
            if (score > playerEntry.score) {
                playerEntry.score = score;
                await playerEntry.save();
                res.status(200).json(playerEntry);
            } else {
                res.status(200).json(playerEntry); // Retorna o jogador existente sem alteração
            }
        } else {
            // Cria um novo jogador se não existir
            const newEntry = await LeaderboardEntry.create({ name, score });
            res.status(201).json(newEntry);
        }
    } catch (error) {
        console.error('Error adding/updating entry in leaderboard:', error);
        res.status(500).json({ error: 'Failed to add/update entry in leaderboard' });
    }
});

// Inicialização do servidor
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
