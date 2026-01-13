import React, { useState, useEffect } from "react";
import axios from "axios";
import { Trash2, RefreshCw, Eye, Plus, X } from "lucide-react";
import "./App.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function App() {
  const [artifacts, setArtifacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewState, setViewState] = useState("LIST");
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [imageFile, setImageFile] = useState(null);

  const fetchArtifacts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/artifacts`);
      setArtifacts(res.data);
    } catch (err) { console.error("Error fetching", err); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE_URL}/artifacts`, formData);
      if (imageFile) {
        const data = new FormData();
        data.append("file", imageFile);
        await axios.post(`${API_BASE_URL}/artifacts/${res.data.id}/upload`, data);
      }
      setViewState("LIST");
      fetchArtifacts();
    } catch (err) { alert("Create failed"); }
  };

  useEffect(() => { fetchArtifacts(); }, []);

  return (
    <div className="container">
      <header className="app-header">
        <h1>🏺 Artifact Fingerprinter</h1>
        <button onClick={fetchArtifacts} className="icon-btn"><RefreshCw size={20}/></button>
      </header>

      {viewState === "LIST" ? (
        <>
          <div className="toolbar">
            <button className="primary-btn" onClick={() => setViewState("CREATE")}><Plus/> New Artifact</button>
          </div>
          <div className="artifact-grid">
            {artifacts.map(art => (
              <div key={art.id} className="card">
                <h3>{art.name}</h3>
                <button onClick={() => {setSelectedArtifact(art); setViewState("VIEW")}}>View Details</button>
              </div>
            ))}
          </div>
        </>
      ) : viewState === "CREATE" ? (
        <form onSubmit={handleCreate} className="form-container">
          <input placeholder="Name" onChange={e => setFormData({...formData, name: e.target.value})} />
          <input type="file" onChange={e => setImageFile(e.target.files[0])} />
          <button type="submit">Upload & Process</button>
          <button type="button" onClick={() => setViewState("LIST")}>Cancel</button>
        </form>
      ) : (
        <div className="detail-view">
          <button onClick={() => setViewState("LIST")}>Back</button>
          <h2>{selectedArtifact.name}</h2>
          <pre>{JSON.stringify(selectedArtifact.fingerprint_data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}