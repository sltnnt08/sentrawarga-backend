import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3000;
const host = process.env.NODE_ENV !== 'production' ? 'localhost' : '0.0.0.0';

app.use(
	cors({
		origin: 'http://localhost:5173',
	}),
);
app.use(express.json());

app.get('/', (req, res) => {
	res.json({
		message: 'API running',
	});
});

app.listen(port, () => {
	console.log(`Server running on http://${host}:${port}`);
});
