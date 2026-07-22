import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// In-memory store for mentor evaluations
const mentorEvaluations = [];

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Senior Full-Stack Engineer Portfolio API',
    candidate: 'Sourav',
    targetPosition: 'Google Senior Full-Stack Engineer',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/migration-summary', (req, res) => {
  res.json({
    project: 'Banking System',
    version1: {
      stack: 'MERN (MongoDB, Express, React, Node)',
      typeSafety: 'Dynamic (JavaScript)',
      storage: 'Unstructured BSON Documents',
      architecture: 'Single-layered REST'
    },
    version2: {
      stack: 'Angular 22 + C# ASP.NET Core 10 + SQL Server SSMS',
      typeSafety: 'Strict (TypeScript & C#)',
      storage: '3NF Relational SSMS Tables',
      architecture: 'Clean Architecture (Domain, App, Infrastructure, API)'
    },
    results: {
      queryLatencyImprovement: '68%',
      concurrencyGain: '340%',
      financialAccuracy: '100% ACID Compliant'
    }
  });
});

app.post('/api/mentor-review', (req, res) => {
  const { mentorName, rating, feedback, recommendation } = req.body;
  if (!mentorName) {
    return res.status(400).json({ error: 'Mentor name is required' });
  }

  const review = {
    id: Date.now(),
    mentorName,
    rating,
    feedback,
    recommendation,
    createdAt: new Date().toISOString()
  };

  mentorEvaluations.push(review);
  res.status(201).json({ message: 'Mentor review submitted successfully', review });
});

app.get('/api/mentor-reviews', (req, res) => {
  res.json({ reviews: mentorEvaluations });
});

// Serve static frontend assets if built
app.use(express.static(path.join(__dirname, '../dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 MERN Portfolio Express Server running on http://localhost:${PORT}`);
});
