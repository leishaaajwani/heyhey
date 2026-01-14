import "./App.css";
import React, { useState, useEffect, useRef } from "react";
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

  // New: error state and file input ref
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // helpful log for debugging environment / CORS/API URL issues
    console.log("API_BASE_URL", API_BASE_URL);
  }, []);

  // --- 1. BROWSE ENTRIES (List) ---
  const fetchArtifacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/artifacts`);
      setArtifacts(res.data || []);
    } catch (err) {
      console.error("Failed to fetch artifacts", err);
      setError(err?.response?.data?.message || err.message || "Failed to fetch artifacts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchArtifacts(); }, []);

  // keep form in sync when selecting an artifact for edit
  useEffect(() => {
    if (viewState === "EDIT" && selectedArtifact) {
      setFormData({ name: selectedArtifact.name || "", description: selectedArtifact.description || "" });
    }
  }, [viewState, selectedArtifact]);

  // --- 2. CREATE & UPLOAD ---
  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/artifacts`, formData);
      if (imageFile) {
        await handleImageUpload(res.data.id);
      }
      resetForm();
    } catch (err) {
      console.error("Error creating artifact", err);
      setError(err?.response?.data?.message || err.message || "Error creating artifact");
      alert(`Create failed: ${error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- 3. UPDATE ARTIFACT ---
  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const id = selectedArtifact?.id;
      if (!id) throw new Error("No selected artifact to update");
      await axios.put(`${API_BASE_URL}/artifacts/${id}`, formData);
      if (imageFile) {
        await handleImageUpload(id);
      }
      resetForm();
    } catch (err) {
      console.error("Update failed", err);
      setError(err?.response?.data?.message || err.message || "Update failed");
      alert(`Update failed: ${error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- 4. DELETE ARTIFACT ---
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this artifact permanently?")) return;
    setLoading(true);
    setError(null);
    try {
      await axios.delete(`${API_BASE_URL}/artifacts/${id}`);
      // refresh list after delete
      await fetchArtifacts();
      // if currently viewing/dealing with this artifact, drop selection
      if (selectedArtifact?.id === id) {
        setSelectedArtifact(null);
        setViewState("LIST");
      }
    } catch (err) {
      console.error("Delete failed", err);
      setError(err?.response?.data?.message || err.message || "Delete failed");
      alert(`Delete failed: ${error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- 5. IMAGE UPLOAD HELPER ---
  const handleImageUpload = async (id) => {
    if (!imageFile) return;
    setError(null);
    try {
      const data = new FormData();
      data.append("file", imageFile);
      await axios.post(`${API_BASE_URL}/artifacts/${id}/upload`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // Ensure latest artifact data is fetched after upload
      await fetchArtifacts();
    } catch (err) {
      console.error("Image upload failed", err);
      setError(err?.response?.data?.message || err.message || "Image upload failed");
      alert(`Upload failed: ${error || err.message}`);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", description: "" });
    setImageFile(null);
    // clear file input DOM value if available
    if (fileInputRef.current) fileInputRef.current.value = null;
    setViewState("LIST");
    fetchArtifacts();
  };

  // --- RENDER HELPERS ---
  const renderFingerprint = (data) => {
    if (!data) return <p>No fingerprinting data available.</p>;
    const circ = data.irregularities?.circularity_score ?? "N/A";
    const edge = data.irregularities?.edge_jaggedness ?? "N/A";
    const hsvArr = data.dominant_color?.hsv;
    const hsvText = Array.isArray(hsvArr) ? hsvArr.map(n => Math.round(n)).join(", ") : "N/A";
    return (
      <div className="metrics-box">
        <div className="stat"><span>Irregularity:</span> {typeof circ === "number" ? circ.toFixed(3) : circ}</div>
        <div className="stat"><span>Edge Jaggedness:</span> {typeof edge === "number" ? edge.toFixed(3) : edge}</div>
        <div className="stat"><span>Color (HSV):</span> {hsvText}</div>
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

      {error && <div className="error">{error}</div>}
      {loading && <div className="loading">Working…</div>}

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
              <input ref={fileInputRef} type="file" onChange={e => setImageFile(e.target.files[0])} />
            </div>
            <div className="form-buttons">
              <button type="button" onClick={resetForm}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={loading}>{viewState === "CREATE" ? "Create" : "Save"}</button>
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
