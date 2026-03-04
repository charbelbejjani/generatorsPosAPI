import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));

app.use('/api', routes);

app.get('/', (_req, res) => res.json({ ok: true, message: 'API running' }));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
