
import { useState, useRef } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import "./App.css";

const templates = [
  { id: "classic", name: "Classic", description: "Simple black and white" },
  { id: "modern", name: "Modern", description: "Purple and blue design" },
  { id: "minimal", name: "Minimal", description: "Clean and professional" },
  { id: "student", name: "Student", description: "Education and projects focused" },
];

function App() {
  const [resume, setResume] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    phone: "",
    email: "",
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

  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState("modern");
  const [downloading, setDownloading] = useState(false);
  const resumeRef = useRef(null);

  function handleChange(event) {
    const { name, value } = event.target;
    setResume((previous) => ({ ...previous, [name]: value }));
  }

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

    return (
      <div
        ref={resumeRef}
        className={`resume-paper resume-${selectedTemplate}`}
      >
        <header className="resume-header">
          <h1>{fullName}</h1>
          <div className="resume-contact">
            {showValue(resume.email) && <span>{resume.email}</span>}
            {showValue(resume.phone) && <span>{resume.phone}</span>}
          </div>
        </header>

        <ResumeSection title="Personal Details">
          {resume.gender && <p>Gender: {resume.gender}</p>}
        </ResumeSection>

        <ResumeSection title="Education">
          {(resume.degree || resume.college || resume.graduationYear) && (
            <div className="resume-entry">
              <strong>{resume.degree}</strong>
              <p>{resume.college}</p>
              {resume.graduationYear && (
                <p>Graduation Year: {resume.graduationYear}</p>
              )}
            </div>
          )}

          {(resume.class12 || resume.board12 || resume.year12) && (
            <div className="resume-entry">
              <strong>Class 12th</strong>
              <p>{resume.class12}</p>
              <p>
                {[resume.board12, resume.year12].filter(Boolean).join(" | ")}
              </p>
            </div>
          )}

          {(resume.class10 || resume.board10 || resume.year10) && (
            <div className="resume-entry">
              <strong>Class 10th</strong>
              <p>{resume.class10}</p>
              <p>
                {[resume.board10, resume.year10].filter(Boolean).join(" | ")}
              </p>
            </div>
          )}
        </ResumeSection>

        <ResumeSection title="Skills">
          {resume.skills && <p>{resume.skills}</p>}
        </ResumeSection>

        <ResumeSection title="Experience / Training">
          {resume.experience && <p>{resume.experience}</p>}
        </ResumeSection>

        <ResumeSection title="Projects">
          {resume.projects && <p>{resume.projects}</p>}
        </ResumeSection>

        <ResumeSection title="Achievements">
          {resume.achievements && <p>{resume.achievements}</p>}
        </ResumeSection>
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
                onClick={handleDownload} disabled={downloading}>
                {downloading ? "Preparing PDF..." : "Download PDF ↓"}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
