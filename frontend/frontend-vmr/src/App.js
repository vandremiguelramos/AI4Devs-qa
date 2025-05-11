import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RecruiterDashboard from './components/RecruiterDashboard';
import AddCandidate from './components/AddCandidateForm'; 
import Positions from './components/Positions'; 
import CandidateKanban from './components/CandidateKanban';
import CandidateKanbanTest from './components/CandidateKanbanTest';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RecruiterDashboard />} />
        <Route path="/add-candidate" element={<AddCandidate />} />
        <Route path="/positions" element={<Positions />} />
        <Route path="/positions/:id/kanban" element={<CandidateKanban />} />
        <Route path="/kanban-test" element={<CandidateKanbanTest />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;