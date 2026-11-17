import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Container, Row, Col, Table, Button, Tab, Nav, Card, Form, Modal, Badge } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css'; // কাস্টম স্টাইলের জন্য

const API_BASE = 'https://my-trading-api.onrender.com'; // এখানে আপনার Render API লিঙ্ক দিন

function App() {
  const [activeTab, setActiveTab] = useState('ai_signals');
  const [data, setData] = useState([]);
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [searchSymbol, setSearchSymbol] = useState('');
  const [marketStatus, setMarketStatus] = useState({ is_open: false, dse_time: 'Loading...' });
  const [loading, setLoading] = useState(false);

  // মাকের্ট স্ট্যাটাস ফেচ
  const fetchMarketStatus = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/market-status`);
      setMarketStatus(res.data);
    } catch (err) {
      console.error("Market status error:", err);
    }
  }, []);

  // ডেটা ফেচ
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let url = activeTab === 'ai_signals' 
        ? `${API_BASE}/api/signals?limit=1000`
        : `${API_BASE}/api/generic-data?collection=${activeTab}&limit=500`;
      
      if (selectedDate) url += `&date=${selectedDate}`;
      if (searchSymbol) url += `&symbol=${searchSymbol}`;

      const res = await axios.get(url);
      setData(res.data.data || []);
    } catch (err) {
      console.error("Fetch data error:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedDate, searchSymbol]);

  // ডেটস ফেচ
  const fetchDates = useCallback(async (col) => {
    try {
      const res = await axios.get(`${API_BASE}/api/dates?collection=${col}`);
      setDates(res.data);
    } catch (err) {
      console.error("Dates error:", err);
    }
  }, []);

  useEffect(() => {
    fetchMarketStatus();
    fetchDates(activeTab);
    fetchData();

    const interval = setInterval(() => {
      fetchMarketStatus();
      fetchData();
    }, 60000); // প্রতি ১ মিনিটে আপডেট

    return () => clearInterval(interval);
  }, [activeTab, fetchData, fetchDates, fetchMarketStatus]);

  // ট্যাব পরিবর্তন
  const handleTabChange = (k) => {
    setActiveTab(k);
    setSearchSymbol('');
    setSelectedDate('');
  };

  // ডিলিট
  const handleDelete = async (symbol, date) => {
    if (!window.confirm(`Delete ${symbol}?`)) return;
    await axios.delete(`${API_BASE}/api/delete-signal?collection=${activeTab}&symbol=${symbol}&date=${date}`);
    fetchData();
  };

  const renderTable = () => {
    if (loading) return <p className="text-center text-info">Loading...</p>;
    if (!data.length) return <p className="text-center text-muted">No data found.</p>;

    return (
      <div style={{ overflowX: 'auto' }}>
        <Table striped bordered hover variant="dark" size="sm" className="mt-3 text-nowrap">
          <thead className="text-info">
            <tr>
              <th>#</th>
              <th>Symbol</th>
              <th>LTP</th>
              <th>Signal</th>
              <th>Score</th>
              <th>Diff</th>
              <th>Gape</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td><b>{item.symbol}</b></td>
                <td className="text-success">{item.ltp || '-'}</td>
                <td>{item.final_signal || '-'}</td>
                <td><b>{item.final_combined_score?.toFixed(1) || '-'}</b></td>
                <td className="text-warning">{item.diff?.toFixed(2) || '-'}</td>
                <td className="text-info">{item.gape?.toFixed(2) || '-'}</td>
                <td>
                  <Button size="sm" variant="outline-danger" onClick={() => handleDelete(item.symbol, item.analysis_date)}>🗑️</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };

  return (
    <div className="bg-dark text-light min-vh-100 p-2">
      <Container fluid>
        {/* হেডার */}
        <Card className="text-center mb-2 border-0" style={{ background: 'linear-gradient(45deg,#1a1a2e,#0f3460)' }}>
          <Card.Body className="p-3">
            <h3 className="fw-bold" style={{ background: 'linear-gradient(90deg,#00d4ff,#7b2ff7,#ff6b6b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              🤖 AI Trading Signals
            </h3>
            <div className="small mt-1">
              {marketStatus.is_open ? '🟢 DSE OPEN' : '🔴 DSE CLOSED'} · <b>{marketStatus.dse_time}</b>
            </div>
          </Card.Body>
        </Card>

        {/* কন্ট্রোলস */}
        <Row className="mb-2 g-1 align-items-center">
          <Col xs={6} md={3}>
            <Form.Select size="sm" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}>
              <option value="">Latest Date</option>
              {dates.map((d, i) => <option key={i} value={d}>{d}</option>)}
            </Form.Select>
          </Col>
          <Col xs={6} md={3}>
            <Form.Control size="sm" type="text" placeholder="Search Symbol" value={searchSymbol} onChange={(e) => setSearchSymbol(e.target.value)} />
          </Col>
          <Col xs={12} md={6} className="d-flex gap-1">
            <Button size="sm" variant="info" className="flex-fill" onClick={fetchData}>🔄 Refresh</Button>
          </Col>
        </Row>

        {/* ট্যাব */}
        <Tab.Container activeKey={activeTab} onSelect={handleTabChange}>
          <Nav variant="pills" className="flex-row mb-2 gap-1 justify-content-center bg-dark border border-secondary rounded p-1">
            <Nav.Item><Nav.Link eventKey="ai_signals" className="text-light py-1 px-2 small">AI Signals</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link eventKey="swrsi_signals" className="text-light py-1 px-2 small">SWRSI</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link eventKey="support_resistance" className="text-light py-1 px-2 small">S/R</Nav.Link></Nav.Item>
            <Nav.Item><Nav.Link eventKey="rsi_signals" className="text-light py-1 px-2 small">RSI</Nav.Link></Nav.Item>
          </Nav>

          <Tab.Content>
            {renderTable()}
          </Tab.Content>
        </Tab.Container>
      </Container>
    </div>
  );
}

export default App;
