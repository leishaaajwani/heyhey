import React, { useState, useEffect } from "react";
import axios from "axios";
import { Trash2, Edit3, Eye, Plus, X, Upload, ImageIcon, ChevronLeft } from "lucide-react";
import "./App.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function App() {
  const [artifacts, setArtifacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewState, setViewState] = useState("LIST"); // LIST, CREATE, EDIT, VIEW
  const [selectedArtifact, setSelectedArtifact] = useState(null);

  // Form State
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [imageFile, setImageFile] = useState(null);

  // --- 1. BROWSE ENTRIES (List) ---
  const fetchArtifacts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/artifacts`);
      setArtifacts(res.data);
    } catch (err) {
      console.error("Failed to fetch artifacts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchArtifacts(); }, []);

  // --- 2. CREATE & UPLOAD ---
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE_URL}/artifacts`, formData);
      if (imageFile) {
        await handleImageUpload(res.data.id);
      }
      resetForm();
    } catch (err) { alert("Error creating artifact"); }
  };

  // --- 3. UPDATE ARTIFACT ---
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_BASE_URL}/artifacts/${selectedArtifact.id}`, formData);
      if (imageFile) {
        await handleImageUpload(selectedArtifact.id);
      }
      resetForm();
    } catch (err) { alert("Update failed"); }
  };

  // --- 4. DELETE ARTIFACT ---
  const handleDelete = async (id) => {
    if (!confirm("Delete this artifact permanently?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/artifacts/${id}`);
      fetchArtifacts();
    } catch (err) { alert("Delete failed"); }
  };

  // --- 5. IMAGE UPLOAD HELPER ---
  const handleImageUpload = async (id) => {
    const data = new FormData();
    data.append("file", imageFile);
    await axios.post(`${API_BASE_URL}/artifacts/${id}/upload`, data);
  };

  const resetForm = () => {
    setFormData({ name: "", description: "" });
    setImageFile(null);
    setViewState("LIST");
    fetchArtifacts();
  };

  // --- RENDER HELPERS ---
  const renderFingerprint = (data) => {
    if (!data) return <p>No fingerprinting data available.</p>;
    return (
      <div className="metrics-box">
        <div className="stat"><span>Irregularity:</span> {data.irregularities?.circularity_score?.toFixed(3)}</div>
        <div className="stat"><span>Edge Jaggedness:</span> {data.irregularities?.edge_jaggedness?.toFixed(3)}</div>
        <div className="stat"><span>Color (HSV):</span> {data.dominant_color?.hsv?.map(n => Math.round(n)).join(", ")}</div>
      </div>
    );
  };

  return (
    <div className="container">
      <header className="main-header">
        <h1 onClick={() => setViewState("LIST")}>🏺 Artifact Vault</h1>
        {viewState === "LIST" && (
          <button className="btn-primary" onClick={() => setViewState("CREATE")}>
            <Plus size={18}/> New Entry
          </button>
        )}
      </header>

      {/* VIEW: BROWSE LIST */}
      {viewState === "LIST" && (
        <div className="artifact-list">
          {artifacts.map((art) => (
            <div key={art.id} className="artifact-card">
              <div className="art-info">
                <h3>{art.name}</h3>
                <p>{art.description || "No description"}</p>
              </div>
              <div className="art-actions">
                <button onClick={() => { setSelectedArtifact(art); setViewState("VIEW"); }}><Eye size={18}/></button>
                <button onClick={() => { setSelectedArtifact(art); setFormData({name: art.name, description: art.description}); setViewState("EDIT"); }}><Edit3 size={18}/></button>
                <button className="btn-danger" onClick={() => handleDelete(art.id)}><Trash2 size={18}/></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW: CREATE or EDIT FORM */}
      {(viewState === "CREATE" || viewState === "EDIT") && (
        <div className="form-overlay">
          <form onSubmit={viewState === "CREATE" ? handleCreate : handleUpdate}>
            <h2>{viewState === "CREATE" ? "New Artifact" : "Edit Details"}</h2>
            <input 
              placeholder="Artifact Name" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})} 
              required
            />
            <textarea 
              placeholder="Description" 
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
            <div className="file-input">
              <label><Upload size={18}/> {imageFile ? imageFile.name : "Upload Image"}</label>
              <input type="file" onChange={e => setImageFile(e.target.files[0])} />
            </div>
            <div className="form-buttons">
              <button type="button" onClick={() => setViewState("LIST")}>Cancel</button>
              <button type="submit" className="btn-primary">Save Artifact</button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW: GET ARTIFACT DETAILS & SERVE IMAGES */}
      {viewState === "VIEW" && selectedArtifact && (
        <div className="details-page">
          <button className="btn-back" onClick={() => setViewState("LIST")}><ChevronLeft/> Back to Library</button>
          <div className="details-grid">
            <div className="image-section">
              {/* SERVE IMAGE: Fetching from the partner's serve endpoint */}
              <img src={`${API_BASE_URL}/images/${selectedArtifact.id}`} alt="Artifact" />
              <p className="caption">Processed Silhouette / Original</p>
            </div>
            <div className="data-section">
              <h2>{selectedArtifact.name}</h2>
              <p className="desc">{selectedArtifact.description}</p>
              <hr />
              <h3>Computer Vision Fingerprint</h3>
              {renderFingerprint(selectedArtifact.fingerprint_data)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
