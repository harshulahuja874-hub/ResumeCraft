
import { useState, useRef } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import "./App.css";


const templates = [
  {
    id: "ats",
    name: "ATS Professional",
    description: "Clean corporate single-column layout",
  },
  {
    id: "split",
    name: "Modern Split",
    description: "Sidebar with structured sections",
  },
  {
    id: "executive",
    name: "Executive",
    description: "Elegant premium professional layout",
  },
  {
    id: "tech",
    name: "Tech Fresher",
    description: "Projects and technical skills focused",
  },
];


function App() {
  const [resume, setResume] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    phone: "",
    email: "",
    linkedin: "",
    github: "",
    class10: "",
    board10: "",
    year10: "",
    class12: "",
    board12: "",
    year12: "",
    degree: "",
    college: "",
    graduationYear: "",
    skills: "",
    experience: "",
    projects: "",
    achievements: "",
  });
  const [savedResumes, setSavedResumes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState("ats");
  const [downloading, setDownloading] = useState(false);
  const resumeRef = useRef(null)
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiContent, setAiContent] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [templateRecommendation, setTemplateRecommendation] = useState(null);
  const [atsLoading, setAtsLoading] = useState(false);
  const [atsAnalysis, setAtsAnalysis] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setResume((previous) => ({ ...previous, [name]: value }));
  }

async function handleSave() {
  try {
    const url = editingId
      ? `http://localhost:8080/api/resumes/${editingId}`
      : "http://localhost:8080/api/resumes";

    const response = await fetch(url, {
      method: editingId ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(resume),
    });

    if (!response.ok) {
      throw new Error("Resume save nahi hua");
    }

    const savedResume = await response.json();

    setEditingId(savedResume.id);
    setSavedResumes((previous) => {
      const alreadyExists = previous.some((item) => item.id === savedResume.id);
      return alreadyExists
        ? previous.map((item) => item.id === savedResume.id ? savedResume : item)
        : [...previous, savedResume];
    });

    alert(
      editingId
        ? "Resume successfully updated!"
        : `Resume successfully saved! ID: ${savedResume.id}`
    );
  } catch (error) {
    console.error("Save error:", error);
    alert("Resume save nahi hua. Backend check karo.");
  }
}

async function handleLoad() {
  try {
    const response = await fetch("http://localhost:8080/api/resumes");

    if (!response.ok) {
      throw new Error("Resume load nahi hua");
    }

    const resumesData = await response.json();

setSavedResumes(resumesData);

    if (resumesData.length === 0) {
      alert("Abhi koi saved resume nahi hai.");
      return;
    }

    const latestResume = resumesData[resumesData.length - 1];
    setEditingId(latestResume.id);
    setResume((previous) => ({
      ...previous,
      ...latestResume,
    }));

    alert("Resume successfully load ho gaya!");
  } catch (error) {
    console.error("Load error:", error);
    alert("Resume load nahi hua. Backend check karo.");
  }
}
async function handleDelete(id) {
  const confirmDelete = window.confirm(
    "Kya tum ye resume delete karna chahte ho?"
  );

  if (!confirmDelete) return;

  try {
    const response = await fetch(
      `http://localhost:8080/api/resumes/${id}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error("Resume delete nahi hua");
    }

    setSavedResumes((previous) =>
      previous.filter((resume) => resume.id !== id)
    );

    if (editingId === id) {
      setEditingId(null);
    }

    alert("Resume successfully deleted!");
  } catch (error) {
    console.error("Delete error:", error);
    alert("Resume delete nahi hua.");
  }
}

const handleGenerateAI = async () => {
  if (!aiPrompt.trim()) {
    alert("Pehle AI ko batao kya generate karna hai!");
    return;
  }

  setAiLoading(true);
  setAiContent("");

  try {
    const response = await fetch(
      "http://localhost:8080/api/ai/generate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: aiPrompt,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "AI request failed");
    }

    setAiContent(data.content || "");
  } catch (error) {
    console.error("AI Error:", error);
    alert("AI content generate nahi hua. Backend aur API key check karo.");
  } finally {
    setAiLoading(false);
  }
};

  // Ask AI to recommend the best resume template
  const handleRecommendTemplate = async () => {
    const resumeDetails = Object.entries(resume)
      .filter(([, value]) => String(value || "").trim())
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");

    if (!resumeDetails) {
      alert("Pehle resume details fill karo, phir AI recommendation milegi.");
      return;
    }

    setRecommendationLoading(true);
    setTemplateRecommendation(null);

    try {
      const response = await fetch(
        "http://localhost:8080/api/ai/recommend-template",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ resumeDetails }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "AI recommendation failed");
      }

      const recommendationText = String(data.recommendation || "").trim();

      if (!recommendationText) {
        throw new Error(data.message || "Backend se recommendation khaali aayi.");
      }

      // Accept both template IDs (tech) and template names (Tech Fresher).
      const lowerText = recommendationText.toLowerCase();
      let templateId = null;

      const templateMatch = recommendationText.match(
        /TEMPLATE\s*:\s*(ats|split|executive|tech(?:\s+fresher)?|ats\s+professional|modern\s+split)/i
      );

      if (templateMatch) {
        const answer = templateMatch[1].toLowerCase();
        if (answer.includes("tech")) templateId = "tech";
        else if (answer.includes("split")) templateId = "split";
        else if (answer.includes("executive")) templateId = "executive";
        else templateId = "ats";
      } else {
        // Fallback if the AI explains its choice without following the exact format.
        if (lowerText.includes("tech fresher")) templateId = "tech";
        else if (lowerText.includes("modern split")) templateId = "split";
        else if (lowerText.includes("executive")) templateId = "executive";
        else if (lowerText.includes("ats professional")) templateId = "ats";
      }

      if (!templateId) {
        throw new Error(
          "AI ka response expected format mein nahi aaya: " + recommendationText
        );
      }

      const selected = templates.find((item) => item.id === templateId);
      const reasonMatch = recommendationText.match(/REASON\s*:\s*([\s\S]*)/i);

      setTemplateRecommendation({
        id: templateId,
        name: selected.name,
        reason: reasonMatch
          ? reasonMatch[1].trim()
          : recommendationText,
      });
    } catch (error) {
      console.error("Template recommendation error:", error);
      alert("AI recommendation error: " + error.message);
    } finally {
      setRecommendationLoading(false);
    }
  };


  // Analyze resume and get an AI-based ATS readiness review
  const handleCheckAtsScore = async () => {
    const resumeDetails = Object.entries(resume)
      .filter(([, value]) => String(value || "").trim())
      .map(([key, value]) => `${key}: ${value}`)
      .join("\\n");

    if (!resumeDetails) {
      alert("Pehle resume details fill karo, phir ATS score check kar sakte ho.");
      return;
    }

    setAtsLoading(true);
    setAtsAnalysis("");

    try {
      const response = await fetch(
        "http://localhost:8080/api/ai/ats-score",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ resumeDetails }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "ATS score request failed");
      }

      setAtsAnalysis(data.analysis || "AI ne koi analysis return nahi kiya.");
    } catch (error) {
      console.error("ATS score error:", error);
      alert("ATS score check nahi hua. Backend aur API key check karo.");
    } finally {
      setAtsLoading(false);
    }
  };


  function showValue(value) {
    return value.trim() ? value : "";
  }

  async function handleDownload() {
    if (!resumeRef.current || downloading) return;

    try {
      setDownloading(true);

      const canvas = await html2canvas(resumeRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const image = canvas.toDataURL("image/png");
      const ratio = Math.min(
        pageWidth / canvas.width,
        pageHeight / canvas.height
      );

      const width = canvas.width * ratio;
      const height = canvas.height * ratio;

      pdf.addImage(image, "PNG", (pageWidth - width) / 2, 5, width, height);
      pdf.save(
        `${resume.firstName || "My"}_${resume.lastName || "Resume"}.pdf`
      );
    } catch (error) {
      console.error("PDF download failed:", error);
      alert("PDF download nahi hua. Please dobara try karo.");
    } finally {
      setDownloading(false);
    }
  }

  function ResumeSection({ title, children }) {
    if (!children) return null;

    return (
      <section className="resume-section">
        <h3>{title}</h3>
        <div className="resume-section-content">{children}</div>
      </section>
    );
  }

  function ResumeDocument() {
  const fullName =
    `${resume.firstName} ${resume.lastName}`.trim() || "Your Name";

  


const contact = (
  <div className="resume-contact">
    {showValue(resume.email) && (
      <div className="contact-email">{resume.email}</div>
    )}

    {showValue(resume.phone) && (
      <div className="contact-phone">{resume.phone}</div>
    )}

    <div className="profile-links">
      {showValue(resume.linkedin) && (
        <a
          className="profile-btn"
          href={resume.linkedin.startsWith("http") ? resume.linkedin : `https://${resume.linkedin}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          LinkedIn
        </a>
      )}

      {showValue(resume.github) && (
        <a
          className="profile-btn"
          href={resume.github.startsWith("http") ? resume.github : `https://${resume.github}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
      )}
    </div>
  </div>
);




  const education = (
    <ResumeSection title="Education">
      {(resume.degree || resume.college || resume.graduationYear) && (
        <div className="resume-entry">
          <strong>{resume.degree}</strong>
          <p>{resume.college}</p>
          {resume.graduationYear && <p>Graduation Year: {resume.graduationYear}</p>}
        </div>
      )}
      {(resume.class12 || resume.board12 || resume.year12) && (
        <div className="resume-entry">
          <strong>Class 12th</strong>
          <p>{resume.class12}</p>
          <p>{[resume.board12, resume.year12].filter(Boolean).join(" | ")}</p>
        </div>
      )}
      {(resume.class10 || resume.board10 || resume.year10) && (
        <div className="resume-entry">
          <strong>Class 10th</strong>
          <p>{resume.class10}</p>
          <p>{[resume.board10, resume.year10].filter(Boolean).join(" | ")}</p>
        </div>
      )}
    </ResumeSection>
  );

  const skills = (
    <ResumeSection title="Technical Skills">
      {resume.skills && <p>{resume.skills}</p>}
    </ResumeSection>
  );

  const experience = (
    <ResumeSection title="Experience / Training">
      {resume.experience && <p>{resume.experience}</p>}
    </ResumeSection>
  );

  const projects = (
    <ResumeSection title="Projects">
      {resume.projects && <p>{resume.projects}</p>}
    </ResumeSection>
  );

  const achievements = (
    <ResumeSection title="Achievements">
      {resume.achievements && <p>{resume.achievements}</p>}
    </ResumeSection>
  );

  const personal = (
    <ResumeSection title="Personal Details">
      {resume.gender && <p>Gender: {resume.gender}</p>}
    </ResumeSection>
  );

  if (selectedTemplate === "split") {
    return (
      <div ref={resumeRef} className="resume-paper resume-split">
        <aside className="split-sidebar">
          <h1>{fullName}</h1>
          {contact}
          {personal}
          {skills}
        </aside>
        <main className="split-main">
          {experience}
          {projects}
          {education}
          {achievements}
        </main>
      </div>
    );
  }

  if (selectedTemplate === "executive") {
    return (
      <div ref={resumeRef} className="resume-paper resume-executive">
        <header className="executive-header">
          <h1>{fullName}</h1>
          {contact}
        </header>
        <div className="executive-body">
          {personal}
          {experience}
          {education}
          {skills}
          {projects}
          {achievements}
        </div>
      </div>
    );
  }

  if (selectedTemplate === "tech") {
    return (
      <div ref={resumeRef} className="resume-paper resume-tech">
        <header className="tech-header">
          <h1>{fullName}</h1>
          {contact}
        </header>
        <div className="tech-body">
          {skills}
          {projects}
          {experience}
          {education}
          {achievements}
          {personal}
        </div>
      </div>
    );
  }

  return (
    <div ref={resumeRef} className="resume-paper resume-ats">
      <header className="ats-header">
        <h1>{fullName}</h1>
        {contact}
      </header>
      {education}
      {skills}
      {experience}
      {projects}
      {achievements}
      {personal}
    </div>
  );
}

  return (
    <div className="app">
      <header className="navbar">
        <h2>ResumeCraft</h2>
        <span>Create your professional resume</span>
      </header>

      <main className="form-container">
        {step === 1 ? (
          <>
            <div className="form-heading">
              <h1>Build Your Resume</h1>
              <p>Fill in your details to create your resume.</p>
            </div>

            <form onSubmit={(event) => event.preventDefault()}>
              <h3>Personal Details</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>First Name</label>
                  <input name="firstName" value={resume.firstName}
                    onChange={handleChange} placeholder="Enter first name" />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input name="lastName" value={resume.lastName}
                    onChange={handleChange} placeholder="Enter last name" />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select name="gender" value={resume.gender} onChange={handleChange}>
                    <option value="">Select gender</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                    <option>Prefer not to say</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input name="phone" type="tel" value={resume.phone}
                    onChange={handleChange} placeholder="Enter phone number" />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input name="email" type="email" value={resume.email}
                    onChange={handleChange} placeholder="Enter email address" />
                </div>
              </div>
              
<div className="form-group">
  <label>LinkedIn Profile URL</label>
  <input
    name="linkedin"
    type="url"
    value={resume.linkedin}
    onChange={handleChange}
    placeholder="https://linkedin.com/in/your-profile"
  />
</div>

<div className="form-group">
  <label>GitHub Profile URL</label>
  <input
    name="github"
    type="url"
    value={resume.github}
    onChange={handleChange}
    placeholder="https://github.com/your-username"
  />
</div>

              <h3>10th Class Details</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>School Name</label>
                  <input name="class10" value={resume.class10}
                    onChange={handleChange} placeholder="Enter school name" />
                </div>
                <div className="form-group">
                  <label>10th Board</label>
                  <select name="board10" value={resume.board10} onChange={handleChange}>
                    <option value="">Select board</option>
                    <option>CBSE</option><option>ICSE</option>
                    <option>HBSE</option><option>Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Passing Year</label>
                  <input name="year10" value={resume.year10}
                    onChange={handleChange} placeholder="e.g. 2022" />
                </div>
              </div>

              <h3>12th Class Details</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>School Name</label>
                  <input name="class12" value={resume.class12}
                    onChange={handleChange} placeholder="Enter school name" />
                </div>
                <div className="form-group">
                  <label>12th Board</label>
                  <select name="board12" value={resume.board12} onChange={handleChange}>
                    <option value="">Select board</option>
                    <option>CBSE</option><option>ISC</option>
                    <option>HBSE</option><option>Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Passing Year</label>
                  <input name="year12" value={resume.year12}
                    onChange={handleChange} placeholder="e.g. 2024" />
                </div>
              </div>

              <h3>Graduation Details</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Degree / Course</label>
                  <input name="degree" value={resume.degree}
                    onChange={handleChange} placeholder="e.g. B.Tech CSE" />
                </div>
                <div className="form-group">
                  <label>College / University</label>
                  <input name="college" value={resume.college}
                    onChange={handleChange} placeholder="Enter college name" />
                </div>
                <div className="form-group">
                  <label>Graduation Year</label>
                  <input name="graduationYear" value={resume.graduationYear}
                    onChange={handleChange} placeholder="e.g. 2028" />
                </div>
              </div>

              <h3>Skills & Experience</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Skills</label>
                  <textarea name="skills" value={resume.skills}
                    onChange={handleChange} placeholder="Java, React, HTML, CSS..." rows="3" />
                </div>
                <div className="form-group">
                  <label>Experience / Training</label>
                  <textarea name="experience" value={resume.experience}
                    onChange={handleChange} placeholder="Internships or training details" rows="3" />
                </div>
                <div className="form-group">
                  <label>Projects</label>
                  <textarea name="projects" value={resume.projects}
                    onChange={handleChange} placeholder="Describe your projects" rows="3" />
                </div>
                <div className="form-group">
                  <label>Achievements</label>
                  <textarea name="achievements" value={resume.achievements}
                    onChange={handleChange} placeholder="Hackathons, certificates, awards..." rows="3" />
                </div>
              </div>
              <div className="ai-generator">
                <h2>✨ AI Resume Content Generator</h2>
                <p>
                  Enter your details and let AI help you write professional resume content.
                  </p>
                  <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Example: Write a professional project description for my ResumeCraft project built using React, Spring Boot and MariaDB."
                  rows={4}
                  />
                  <button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={aiLoading}
                  >
                    {aiLoading ? "Generating..." : "✨ Generate AI Content"}
                    </button>
                    {aiContent && (
                      <div className="ai-result">
                        <h3>Generated Content</h3>
                        
                        <textarea
                        value={aiContent}
                        onChange={(e) => setAiContent(e.target.value)}
                        rows={6}
                        />
                        <button
                        type="button"
                        onClick={() =>
                          setResume((prev) => ({
                            ...prev,
                            projects: aiContent,
                          }))
                        }
                        >
                          Use as Project Description
                          </button>
                          </div>
                        )}</div>

              <button type="button" className="download-btn"
                onClick={() => setStep(2)}>
                Choose Resume Design →
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="form-heading">
              <h1>Choose Your Resume</h1>
              <p>Select a design, check your resume, and download it as a PDF.</p>
            </div>

            <div className="ai-template-recommendation">
              <h2>✨ AI Template Recommendation</h2>
              <p>
                Let AI review your resume details and suggest the most suitable design.
              </p>
              <button
                type="button"
                className="download-btn"
                onClick={handleRecommendTemplate}
                disabled={recommendationLoading}
              >
                {recommendationLoading
                  ? "Analyzing Your Resume..."
                  : "✨ Recommend Best Template"}
              </button>

              {templateRecommendation && (
                <div className="ai-result">
                  <h3>AI Recommended: {templateRecommendation.name}</h3>
                  <p>{templateRecommendation.reason}</p>
                  <button
                    type="button"
                    className="download-btn"
                    onClick={() => setSelectedTemplate(templateRecommendation.id)}
                  >
                    Apply Recommended Template
                  </button>
                </div>
              )}
            </div>

            <div className="ai-template-recommendation">
              <h2>📊 AI ATS Score Checker</h2>
              <p>
                AI will review your resume and suggest improvements for better ATS readiness.
              </p>
              <button
                type="button"
                className="download-btn"
                onClick={handleCheckAtsScore}
                disabled={atsLoading}
              >
                {atsLoading ? "Checking Your Resume..." : "📊 Check ATS Score"}
              </button>

              {atsAnalysis && (
                <div className="ai-result">
                  <h3>ATS Resume Analysis</h3>
                  <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                    {atsAnalysis}
                  </div>
                </div>
              )}
            </div>

            <div className="template-grid">
              {templates.map((template) => (
                <button
                  type="button"
                  key={template.id}
                  className={`template-card ${
                    selectedTemplate === template.id ? "selected" : ""
                  }`}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <div className={`template-sample sample-${template.id}`}>
                    <span></span><span></span><span></span><span></span>
                  </div>
                  <strong>{template.name}</strong>
                  <small>{template.description}</small>
                  {selectedTemplate === template.id && (
                    <span className="selected-label">✓ Selected</span>
                  )}
                </button>
              ))}
            </div>

            <div className="resume-preview">
              <ResumeDocument />
            </div>

            <div className="resume-actions">
              <button type="button" className="back-btn" onClick={() => setStep(1)}>
                ← Edit Details
              </button>
              <button type="button" className="download-btn" 
              onClick={handleSave}>
                Save Resume
              </button>
              <button type="button" className="download-btn"
              onClick={handleLoad}>
                Load Saved Resume
                </button>
              <button
  type="button"
  className="download-btn"
  onClick={() => {
    setEditingId(null);
    window.location.reload();
  }}
>
  Create New Resume
</button>

              <button type="button" className="download-btn"
                onClick={handleDownload} disabled={downloading}>
                {downloading ? "Preparing PDF..." : "Download PDF ↓"}
              </button>
            </div>

            <div className="my-resumes">
  <h2>My Resumes</h2>

  <button
    type="button"
    className="download-btn"
    onClick={handleLoad}
  >
    Refresh My Resumes
  </button>

  {savedResumes.length === 0 ? (
    <p>No saved resumes found.</p>
  ) : (
    savedResumes.map((item) => (
      <div className="resume-item" key={item.id}>
        <h3>
          {item.firstName} {item.lastName}
        </h3>

        <p>{item.email}</p>

        <button
          type="button"
          className="download-btn"
          onClick={() => {
            setEditingId(item.id);
            setResume((previous) => ({
              ...previous,
              ...item,
            }));
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          Edit Resume
        </button>

        <button
          type="button"
          className="download-btn"
          onClick={() => handleDelete(item.id)}
        >
          Delete Resume
        </button>
      </div>
    ))
  )}
</div>

          </>
        )}
      </main>
    </div>
  );
}

export default App;
