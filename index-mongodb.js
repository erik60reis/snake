const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Conexão com o MongoDB
mongoose.connect('mongodb://localhost:27017/leaderboard', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

const leaderboardSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    score: {
        type: Number,
        required: true
    }
});
const LeaderboardEntry = mongoose.model('LeaderboardEntry', leaderboardSchema);

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/leaderboard', async (req, res) => {
    try {
        const leaderboard = await LeaderboardEntry.find({})
            .sort({ score: -1 })
            .limit(20)
            .select('name score');

        res.json(leaderboard);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

app.post('/leaderboard', async (req, res) => {
    const { name, score } = req.body;
    try {
        let playerEntry = await LeaderboardEntry.findOne({ name });

        if (playerEntry) {
            if (score > playerEntry.score) {
                playerEntry.score = score;
                await playerEntry.save();
                res.status(200).json(playerEntry);
            } else {
                res.status(200).json(playerEntry);
            }
        } else {
            const newEntry = new LeaderboardEntry({ name, score });
            await newEntry.save();
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
