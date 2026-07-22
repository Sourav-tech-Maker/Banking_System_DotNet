import React, { useState } from 'react';
import { Database, Server, Layout, CheckCircle2 } from 'lucide-react';

export default function MigrationProcess() {
  const [activeTab, setActiveTab] = useState('db');

  return (
    <section id="migration" className="section-wrapper">
      <div className="container">
        {/* Step Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.65rem' }}>
          <span className="badge badge-teal">Step 3</span>
          <span style={{ fontSize: '0.82rem', color: '#C5C3C6' }}>Step-by-Step Migration Engineering</span>
        </div>

        <h2 className="section-title">3. Step-by-Step Migration Process</h2>
        <p className="section-subtitle">
          Deconstructing the exact engineering workflow utilized to refactor the entire system layer by layer: 
          Database, Backend REST API, and Frontend Application.
        </p>

        {/* 3 Step Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('db')}
            className={`btn ${activeTab === 'db' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.85rem', padding: '0.65rem 1.15rem' }}
          >
            <Database size={16} /> 3.1 Database (Mongo ➔ SSMS)
          </button>
          <button
            onClick={() => setActiveTab('backend')}
            className={`btn ${activeTab === 'backend' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.85rem', padding: '0.65rem 1.15rem' }}
          >
            <Server size={16} /> 3.2 Backend (Express ➔ .NET)
          </button>
          <button
            onClick={() => setActiveTab('frontend')}
            className={`btn ${activeTab === 'frontend' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.85rem', padding: '0.65rem 1.15rem' }}
          >
            <Layout size={16} /> 3.3 Frontend (React ➔ Angular)
          </button>
        </div>

        {/* Tab 1: Database Migration */}
        {activeTab === 'db' && (
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#DCDCDD' }}>
                  3.1 Database Schema Normalization & Type Mapping
                </h3>
                <p style={{ color: '#C5C3C6', fontSize: '0.88rem', marginTop: '0.2rem' }}>
                  Mapping MongoDB nested BSON documents into normalized SQL Server (SSMS) 3NF Relational Tables.
                </p>
              </div>
              <span className="badge badge-teal">EF Core Migrations</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(11, 17, 26, 0.9)', padding: '1.15rem', borderRadius: '0.65rem', border: '1px solid rgba(76, 92, 104, 0.4)' }}>
                <h4 style={{ color: '#808e9b', fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.65rem' }}>MongoDB Collections (BSON)</h4>
                <div className="code-container">
                  <pre><code>{`// Users Collection
{
  "_id": ObjectId("64f..."),
  "name": "Jane Doe",
  "email": "jane@bank.com",
  "accounts": [
    { "accNo": "ACC-1001", "type": "Savings", "balance": 15000.50 }
  ]
}`}</code></pre>
                </div>
              </div>

              <div style={{ background: 'rgba(25, 133, 161, 0.08)', padding: '1.15rem', borderRadius: '0.65rem', border: '1px solid rgba(25, 133, 161, 0.4)' }}>
                <h4 style={{ color: '#5ec7e0', fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.65rem' }}>SQL Server SSMS Tables</h4>
                <div className="code-container">
                  <pre><code>{`-- Users Table
CREATE TABLE Users (
  UserId INT IDENTITY(1,1) PRIMARY KEY,
  Email NVARCHAR(150) UNIQUE NOT NULL
);

-- Accounts Table (FK to Users)
CREATE TABLE Accounts (
  AccountId INT IDENTITY(1,1) PRIMARY KEY,
  UserId INT FOREIGN KEY REFERENCES Users(UserId),
  Balance DECIMAL(18,2) NOT NULL DEFAULT 0.00
);`}</code></pre>
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(11, 17, 26, 0.8)', padding: '1.15rem', borderRadius: '0.5rem', border: '1px solid rgba(76, 92, 104, 0.4)' }}>
              <h5 style={{ fontWeight: 600, color: '#DCDCDD', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Key Database Transformations Handled:</h5>
              <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.5rem', listStyle: 'none', fontSize: '0.85rem', color: '#C5C3C6' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><CheckCircle2 size={15} color="#1985A1" /> <strong>ObjectId ➔ INT IDENTITY:</strong> High query index performance.</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><CheckCircle2 size={15} color="#1985A1" /> <strong>JS Double ➔ DECIMAL(18,2):</strong> Exact currency precision.</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><CheckCircle2 size={15} color="#1985A1" /> <strong>Embedded Array ➔ FK Table:</strong> Cascade integrity rules.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Tab 2: Backend Rewrite */}
        {activeTab === 'backend' && (
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#DCDCDD' }}>
                  3.2 ExpressJS Route Handler ➔ C# ASP.NET Core Controllers
                </h3>
                <p style={{ color: '#C5C3C6', fontSize: '0.88rem', marginTop: '0.2rem' }}>
                  Translating un-typed Node/Express callbacks into strongly-typed .NET Controllers with EF Core ORM.
                </p>
              </div>
              <span className="badge badge-teal">ASP.NET Core 8 API</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <h4 style={{ color: '#808e9b', fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.65rem' }}>ExpressJS Route (Legacy)</h4>
                <div className="code-container">
                  <pre><code>{`// Express.js Transfer Endpoint
app.post('/api/transfer', async (req, res) => {
  const { fromAcc, toAcc, amount } = req.body;
  const source = await Account.findOne({ accNo: fromAcc });
  source.balance -= amount;
  await source.save();
  res.json({ success: true });
});`}</code></pre>
                </div>
              </div>

              <div>
                <h4 style={{ color: '#5ec7e0', fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.65rem' }}>C# .NET Controller + EF Core (Enterprise)</h4>
                <div className="code-container">
                  <pre><code>{`[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TransferController : ControllerBase {
    private readonly IBankingService _bankingService;
    
    [HttpPost]
    public async Task<IActionResult> Transfer([FromBody] TransferDto dto) {
        var result = await _bankingService.ExecuteTransferAsync(dto);
        return Ok(result);
    }
}`}</code></pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Frontend Transition */}
        {activeTab === 'frontend' && (
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#DCDCDD' }}>
                  3.3 React Components & Hooks ➔ Angular 22 Modular Architecture
                </h3>
                <p style={{ color: '#C5C3C6', fontSize: '0.88rem', marginTop: '0.2rem' }}>
                  Transitioning from React useState/useEffect patterns to Angular Services & RxJS Observables.
                </p>
              </div>
              <span className="badge badge-teal">Angular 22 & RxJS</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              <div>
                <h4 style={{ color: '#808e9b', fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.65rem' }}>React Hooks Pattern</h4>
                <div className="code-container">
                  <pre><code>{`function AccountView() {
  const [balance, setBalance] = useState(0);
  useEffect(() => {
    fetch('/api/account')
      .then(res => res.json())
      .then(data => setBalance(data.balance));
  }, []);
  return <div>Balance: \${balance}</div>;
}`}</code></pre>
                </div>
              </div>

              <div>
                <h4 style={{ color: '#5ec7e0', fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.65rem' }}>Angular Service + RxJS Stream</h4>
                <div className="code-container">
                  <pre><code>{`@Component({
  selector: 'app-account',
  template: \`<div *ngIf="account$ | async as acc">
               Balance: {{ acc.balance | currency }}
             </div>\`
})
export class AccountComponent implements OnInit {
  account$!: Observable<AccountDto>;
  constructor(private accountService: AccountService) {}
}`}</code></pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
